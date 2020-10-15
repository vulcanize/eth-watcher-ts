import * as dotenv from 'dotenv';
dotenv.config();

import * as cron from 'node-cron';
import {createConnection, getConnection, getConnectionOptions} from 'typeorm';
import ProgressRepository from './repositories/data/progressRepository';
import Contract from './models/contract/contract';
import Event from './models/contract/event';
import Store from './store';
import DataService from './services/dataService';
import GraphqlService from './services/graphqlService';

const LIMIT = 1000;

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// TODO: send to log system
});

console.log('Cron daemon is started');
(async (): Promise<void> => {
	const connectionOptions = await getConnectionOptions();
	createConnection(connectionOptions).then(async () => {

		const dataService = new DataService();
		const graphqlService = new GraphqlService();

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

			for (const contract of contracts) {
				for (const event of events) {
					console.log('Contract', contract.contractId, 'Event', event.name);
					
					const startingBlock = contract.startingBlock;
					const maxBlock = await progressRepository.getMaxBlockNumber(contract.contractId, event.eventId);
					const maxPage = Math.ceil(maxBlock / LIMIT) || 1;

					// TODO: add unit test
					for (let page = 1; page <= maxPage; page++) {
						const progresses = await progressRepository.findSyncedBlocks(contract.contractId, event.eventId, (page - 1) * LIMIT, LIMIT);

						const max = Math.min(maxBlock, page * LIMIT); // max block for current page
						const start = startingBlock + (page -1) * LIMIT; // start block for current page

						const allBlocks = Array.from({ length:  max - start }, (_, i) => i + start);
						const syncedBlocks = progresses.map((p) => p.blockNumber);
						const notSyncedBlocks = allBlocks.filter(x => !syncedBlocks.includes(x));

						for (const blockNumber of notSyncedBlocks) {
							const header = await graphqlService.ethHeaderCidByBlockNumber(blockNumber);
	
							if (!header) {
								console.warn(`No header for ${blockNumber} block`);
								continue;
							}

							for (const ethHeader of header?.ethHeaderCidByBlockNumber?.nodes) {
								for (const tx of ethHeader.ethTransactionCidsByHeaderId.nodes) {
									await dataService.processEvent(tx.receiptCidByTxId);
								}
							}
						}
					}
				}
			}

			status = 'waiting';
		});
	});
})();
