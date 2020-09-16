import { createServer } from 'http';
import { createConnection, getConnectionOptions } from 'typeorm';

import app from './app';
import env from './env';

const PORT = env.PORT;

(async (): Promise<void> => {
	const connectionOptions = await getConnectionOptions();
	createConnection(connectionOptions).then(async () => {
		createServer(app).listen(PORT, () =>
			console.info(`Server running on port ${PORT}`)
		);
	}).catch((error) => console.log('Error: ', error));
})();
