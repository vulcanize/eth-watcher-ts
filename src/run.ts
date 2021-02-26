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
		processState: dataService.processState,
		processHeader: dataService.processHeader,
		processEvent: dataService.processEvent,
	})
})();
