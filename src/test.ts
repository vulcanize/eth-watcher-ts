import * as dotenv from 'dotenv';
dotenv.config();

import EthWatcherServer from './server';

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// TODO: send to log system
});

(async (): Promise<void> => {
	await EthWatcherServer({ // DI 
		processState: (a) => console.log('Test',a),
		processHeader: (a) => console.log('Test',a),
		processEvent: (a) => console.log('Test',a),
	})
})();
