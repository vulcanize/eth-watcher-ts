import { createServer } from 'http';
import Store from './store';
import { createConnection, getConnectionOptions } from 'typeorm';
import postgraphile from 'postgraphile';
import * as ws from 'ws';
import App from './app';
import env from './env';
import GraphqlService from './services/graphqlService';
import DataService from './services/dataService';
import GraphqlClient from './graphqlClient';

(async (): Promise<void> => {
	const connectionOptions = await getConnectionOptions();
	createConnection(connectionOptions).then(async () => {
		const app = new App();

		Store.init();

		const graphqlClient = new GraphqlClient(env.GRAPHQL_URI, ws);
		const graphqlService = new GraphqlService(graphqlClient);
		const dataService = new DataService();

		if (env.ENABLE_EVENT_WATCHER) {
			graphqlService.subscriptionReceiptCids( // async
				() => Store.getStore().getContracts(),
				() => Store.getStore().getEvents(),
				(data) => dataService.processEvent(data?.relatedNode, data?.decoded)
			);
		} else {
			console.info('Event watcher is not enabled');
		}

		if (env.ENABLE_HEADER_WATCHER && env.ENABLE_EVENT_WATCHER) {
			console.log('Header watcher will work via Event watcher');
		} else if (env.ENABLE_HEADER_WATCHER && !env.ENABLE_EVENT_WATCHER) {
			graphqlService.subscriptionHeaderCids((data) => dataService.processHeader(data?.data?.listen?.relatedNode)); // async
		} else {
			console.info('Header watcher is not enabled');
		}

		if (env.ENABLE_STORAGE_WATCHER) {
			graphqlService.subscriptionStateCids( // async
				() => Store.getStore().getContracts(),
				() => Store.getStore().getStates(),
				(data) => dataService.processState(data?.relatedNode, data?.decoded)
			);
		} else {
			console.info('Storage watcher is not enabled');
		}

		if (env.HTTP_ENABLE) {
			createServer(app.app).listen(env.HTTP_PORT, env.HTTP_ADDR,() =>
				console.info(`Http server running on port ${env.HTTP_ADDR}:${env.HTTP_PORT}`)
			);
		} else {
			console.info('Http server will be not run');
		}
	}).catch((error) => console.log('Error: ', error));

	if (env.GRAPHQL_SERVER_ENABLE) {
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
		.listen(env.GRAPHQL_SERVER_PORT, env.GRAPHQL_SERVER_ADDR, () =>
			console.info(`Postgraphile server running on port ${env.GRAPHQL_SERVER_ADDR}:${env.GRAPHQL_SERVER_PORT}`)
		);
	} else {
		console.info('Postgraphile server will be not run');
	}
})();
