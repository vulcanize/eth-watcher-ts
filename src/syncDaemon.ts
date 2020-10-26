import * as dotenv from 'dotenv';
dotenv.config();

import * as cron from 'node-cron';
import {createConnection, getConnection, getConnectionOptions} from 'typeorm';
import ProgressRepository from './repositories/data/progressRepository';
import HeaderRepository from './repositories/data/headerRepository';
import Contract from './models/contract/contract';
import Event from './models/contract/event';
import Store from './store';
import DataService from './services/dataService';
import GraphqlService from './services/graphqlService';
import env from './env';

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

		if (env.ENABLE_EVENT_WATCHER) {
			let statusEventSync = 'waiting';
			cron.schedule('0 * * * * *', async () => { // every minute
				if (statusEventSync !== 'waiting') {
					console.log('Cron already running');
					return;
				}

				statusEventSync = 'running';

				// start Store without autoupdate data
				const store = Store.getStore();
				await store.syncData();

				const contracts: Contract[] = store.getContracts();

				console.log('Contracts', contracts.length);

				const progressRepository: ProgressRepository = getConnection().getCustomRepository(ProgressRepository);
				for (const contract of contracts) {
					for (const eventId of (contract.events || [])) {
						const event: Event = store.getEventById(eventId);
						console.log('Contract', contract.contractId, 'Event', event.name);

						await DataService.syncEventForContract({ graphqlService, dataService, progressRepository }, event, contract);
					}
				}

				statusEventSync = 'waiting';
			});
		}

		if (env.ENABLE_HEADER_WATCHER) {
			let statusHeaderSync = 'waiting';
			cron.schedule('0 * * * * *', async () => { // every minute
				if (statusHeaderSync !== 'waiting') {
					console.log('Cron already running');
					return;
				}

				statusHeaderSync = 'running';

				const headerRepository: HeaderRepository = getConnection().getCustomRepository(HeaderRepository);
				await DataService.syncHeaders({ graphqlService, dataService, headerRepository });

				statusHeaderSync = 'waiting';
			});
		}
	});
})();
