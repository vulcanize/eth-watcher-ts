import { createServer } from 'http';
import Store from './store';
import { createConnection, getConnectionOptions } from 'typeorm';

import App from './app';
import env from './env';

const PORT = env.APP_PORT;

(async (): Promise<void> => {
	const connectionOptions = await getConnectionOptions();
	createConnection(connectionOptions).then(async () => {
		const app = new App();

		Store.init();

		app.subscribeToGraphql(); // async

		createServer(app.app).listen(PORT, () =>
			console.info(`Server running on port ${PORT}`)
		);
	}).catch((error) => console.log('Error: ', error));
})();
