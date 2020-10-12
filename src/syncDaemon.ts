import * as dotenv from 'dotenv';
dotenv.config();

import * as cron from 'node-cron';
import {createConnection, getConnection, getConnectionOptions} from 'typeorm';
import ProgressRepository from './repositories/data/progressRepository';
import HeaderRepository from './repositories/eth/headerRepository';
import Contract from './models/contract/contract';
import Event from './models/contract/event';
import Store from './store';
import GraphqlClient from './graphqlClient';
import DataService from './services/dataService';


process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// TODO: send to log system
});

console.log('Cron daemon is started');
(async (): Promise<void> => {
	const connectionOptions = await getConnectionOptions();
	createConnection(connectionOptions).then(async () => {

		const graphqlClient = new GraphqlClient();
		const dataService = new DataService();

		let status = 'waiting';
		cron.schedule('0 * * * * *', async () => { // every minute
			if (status !== 'waiting') {
				console.log('Cron already running');
				return;
			}

			status = 'running';

			// start Store without autoupdate data
			const store = Store.getStore();
			await store.syncData();

			const contracts: Contract[] = Store.getStore().getContracts();
			const events: Event[] = Store.getStore().getEvents();

			console.log('Contracts', contracts.length);
			console.log('events', events.length);
			

			const progressRepository: ProgressRepository = getConnection().getCustomRepository(ProgressRepository);
			const headerRepository: HeaderRepository = getConnection().getCustomRepository(HeaderRepository);

			// console.log('Start for', progress ? progress.length : 0);

			for (const contract of contracts) {
				for (const event of events) {
					console.log('Contract', contract.contractId, 'Event', event.name);
					
					const startingBlock = 110; //contract.startingBlock;
					const currentBlock = 120; // TODO: use real current block

					const progresses = await progressRepository.findAllSyncedBlocks(contract.contractId, event.eventId);

					const allBlocks = Array.from({ length: currentBlock - startingBlock }, (_, i) => i + startingBlock);
					const syncedBlocks = progresses.map((p) => p.blockNumber);

					const notSyncedBlocks = allBlocks.filter(x => !syncedBlocks.includes(x));
					
					for (const blockNumber of notSyncedBlocks) {
						const header = await headerRepository.findByBlockNumber(blockNumber);
						if (!header) {
							// TODO: mark as done?
							continue;
						}

						for (const tx of header.transactions) {
							const data = await graphqlClient.query(`
								query MyQuery {
									receiptCidByTxId(txId: ${tx.id}) {
										id
										mhKey
										logContracts
										nodeId
										topic0S
										topic1S
										topic2S
										topic3S
										txId
										cid
										contract
										blockByMhKey {
											data
										}
										ethTransactionCidByTxId {
											ethHeaderCidByHeaderId {
												blockNumber
											}
										}
									}
								}
							`);

							await dataService.processEvent(data.receiptCidByTxId);
						}
					}
				}
			}

			status = 'waiting';
		});
	});
})();
