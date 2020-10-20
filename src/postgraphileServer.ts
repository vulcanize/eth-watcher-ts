import { createServer } from 'http';
import postgraphile from 'postgraphile';

import env from './env';

const SERVER_PORT = env.SERVER_PORT;

(async (): Promise<void> => {
	createServer(
		postgraphile(
			`postgres://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOSTNAME}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`,
			[
				'contract',
				'data',
			],
			{
				watchPg: true,
				graphiql: true,
				enhanceGraphiql: true,
			}
		)
	)
	.listen(SERVER_PORT, () =>
		console.info(`Postgraphile server running on port ${SERVER_PORT}`)
	);
})();
