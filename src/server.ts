import { createServer } from 'http';
import Store from './store';
import { createConnection, getConnectionOptions } from 'typeorm';
import { postgraphile, makePluginHook } from 'postgraphile';
const { default: PgPubsub } = require("@graphile/pg-pubsub"); // eslint-disable-line
import App from './app';
import Config from './config';
import GraphqlService from './services/graphqlService';
import GraphqlClient from './graphqlClient';
import {ProcessEventFunction, ProcessHeaderFunction, ProcessStateFunction} from "./types";
const ws = require('ws'); // eslint-disable-line

const server = async function({
	processEvent,
	processHeader,
	processState
}: {
	processEvent: ProcessEventFunction;
	processHeader: ProcessHeaderFunction;
	processState: ProcessStateFunction;
}, config?): Promise<void> {
	const env = Config.getEnv(config);

	const connectionOptions = await getConnectionOptions();
	createConnection(connectionOptions).then(async () => {
		const app = new App();

		Store.init();

		const graphqlClient = new GraphqlClient(env.GRAPHQL_URI, ws);
		const graphqlService = new GraphqlService(graphqlClient);

		if (env.ENABLE_EVENT_WATCHER) {
			graphqlService.subscriptionReceiptCids( // async
				() => Store.getStore().getContracts(),
				() => Store.getStore().getEvents(),
				(data) => processEvent(data)
			);
		} else {
			console.info('Event watcher is not enabled');
		}

		if (env.ENABLE_HEADER_WATCHER && env.ENABLE_EVENT_WATCHER) {
			console.log('Header watcher will work via Event watcher');
		} else if (env.ENABLE_HEADER_WATCHER && !env.ENABLE_EVENT_WATCHER) {
			graphqlService.subscriptionHeaderCids((data) => processHeader(data?.data?.listen?.relatedNode)); // async
		} else {
			console.info('Header watcher is not enabled');
		}

		if (env.ENABLE_STORAGE_WATCHER) {
			graphqlService.subscriptionStateCids( // async
				() => Store.getStore().getContracts(),
				() => Store.getStore().getStates(),
				(data) => processState(data)
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
		const pluginHook = makePluginHook([PgPubsub]);

		createServer(
			postgraphile(
				`postgres://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOSTNAME}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`,
				[
					'contract',
					'data',
					'eth',
					'public',
				],
				{
					watchPg: true,
					graphiql: true,
					enhanceGraphiql: true,
					enableCors: true,
					subscriptions: true,
					simpleSubscriptions: true,
					pluginHook,
				} as any
			)
		)
		.listen(env.GRAPHQL_SERVER_PORT, env.GRAPHQL_SERVER_ADDR, () =>
			console.info(`Postgraphile server running on port ${env.GRAPHQL_SERVER_ADDR}:${env.GRAPHQL_SERVER_PORT}`)
		);
	} else {
		console.info('Postgraphile server will be not run');
	}
}

export {
	server as EthWatcherServer
};
