import * as dotenv from 'dotenv';
dotenv.config();

import EthWatcherServer from './server';

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// TODO: send to log system
});

(async (): Promise<void> => {
	await EthWatcherServer({ // DI 
		processState: (raw) => console.log('Test state', raw),
		processHeader: (raw) => console.log('Test header', raw),
		processEvent: (raw, decoded) => console.log('Test event', raw, decoded),
	})
})();
