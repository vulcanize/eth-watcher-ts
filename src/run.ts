import * as dotenv from 'dotenv';
dotenv.config();

import EthWatcherServer from './server';
import DataService from './services/dataService';

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// TODO: send to log system
});


(async (): Promise<void> => {
	const dataService = new DataService();

	await EthWatcherServer({ // DI
		processState: (data) => dataService.processState(data.relatedNode),
		processHeader: (data) => dataService.processHeader(data),
		processEvent: (data) => dataService.processEvent(null, data.relatedNode, data.decoded, data.event),
	})
})();
