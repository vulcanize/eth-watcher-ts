import * as dotenv from 'dotenv';
dotenv.config();

import * as ws from 'ws';
import {createConnection, getConnection, getConnectionOptions} from 'typeorm';
import ProgressRepository from './repositories/data/progressRepository';
import StateProgressRepository from './repositories/data/stateProgressRepository';
import Contract from './models/contract/contract';
import Event from './models/contract/event';
import State from './models/contract/state';
import Store from './store';
import DataService from './services/dataService';
import GraphqlService from './services/graphqlService';
import env from './env';
import GraphqlClient from './graphqlClient';

const ids = process.argv.slice(2);

console.log('Backfill service contract ids', ids);

if (!ids || ids.length === 0) {
	throw new Error('Contract ids is required');
}

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// TODO: send to log system
});

(async (): Promise<void> => {
	const connectionOptions = await getConnectionOptions();
	createConnection(connectionOptions).then(async () => {

		const dataService = new DataService();
		const graphqlClient = new GraphqlClient(env.GRAPHQL_URI, ws);
		const graphqlService = new GraphqlService(graphqlClient);

		// TODO: Do we need Store here? Remove

		const store = Store.getStore(); // start Store without autoupdate data
		await store.syncData((ids || []).map((id) => Number(id))); // TODO: use only contracts from args

		const contracts: Contract[] = store.getContracts();
		console.log('Contracts', contracts);

		if (env.ENABLE_EVENT_WATCHER) {
			const progressRepository: ProgressRepository = getConnection().getCustomRepository(ProgressRepository);
			for (const contract of contracts) {
				const events: Event[] = store.getEventsByContractId(contract.contractId);
				for (const event of events) {
					console.log('Contract', contract.contractId, 'Event', event.name);

					await DataService.syncEventForContract({ graphqlService, dataService, progressRepository }, event, contract);
				}
			}
		}

		if (env.ENABLE_STORAGE_WATCHER) {
			const stateProgressRepository: StateProgressRepository = getConnection().getCustomRepository(StateProgressRepository);
			for (const contract of contracts) {
				const states: State[] = store.getStatesByContractId(contract.contractId);
				for (const state of states) {
					console.log('Contract', contract.contractId, 'Slot', state.slot);

					await DataService.syncStatesForContract({ graphqlService, dataService, stateProgressRepository }, state, contract);
				}
			}
		}

		process.exit(0);
	});
})();
