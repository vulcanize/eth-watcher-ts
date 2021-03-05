import * as dotenv from 'dotenv';
dotenv.config();

import {createConnection, getConnection, getConnectionOptions} from 'typeorm';
import ProgressRepository from './repositories/data/progressRepository';
import StateProgressRepository from './repositories/data/stateProgressRepository';
import BackfillProgressRepository from './repositories/data/backfillProgressRepository';
import Contract from './models/contract/contract';
import Event from './models/contract/event';
import State from './models/contract/state';
import Store from './store';
import DataService from './services/dataService';
import GraphqlService from './services/graphqlService';
import Config from './config';
import GraphqlClient from './graphqlClient';
const ws = require('ws'); // eslint-disable-line
import Method from "./models/contract/method";
import MethodProgressRepository from "./repositories/data/methodProgressRepository";

const ENTITIES_TO_BACKFILL = 3; // events, states, methods

const ids = process.argv.slice(2);

console.log('Backfill service contract ids', ids);

if (!ids || ids.length === 0) {
	throw new Error('Contract ids is required');
}

const env = Config.getEnv();

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

		const progressRepository: ProgressRepository = getConnection().getCustomRepository(ProgressRepository);
		const stateProgressRepository: StateProgressRepository = getConnection().getCustomRepository(StateProgressRepository);
		const methodProgressRepository: MethodProgressRepository = getConnection().getCustomRepository(MethodProgressRepository);
		const backfillProgressRepository: BackfillProgressRepository = getConnection().getCustomRepository(BackfillProgressRepository);

		// TODO: Do we need Store here? Remove

		const store = Store.getStore(); // start Store without auto update data
		await store.syncData((ids || []).map((id) => Number(id))); // TODO: use only contracts from args

		const contracts: Contract[] = store.getContracts();
		for (const contract of contracts) {
			const { blockNumber } = await graphqlService.getLastBlock();
			const totalProgress = ENTITIES_TO_BACKFILL * (blockNumber - contract.startingBlock);
			await backfillProgressRepository.startProgress(contract.contractId, totalProgress);
		}

		for (const contract of contracts) {
			const { blockNumber } = await graphqlService.getLastBlock();
			const totalProgress = ENTITIES_TO_BACKFILL * (blockNumber - contract.startingBlock);

			const events: Event[] = store.getEventsByContractId(contract.contractId);
			for (const event of events) {
				console.log('Contract', contract.contractId, 'Event', event.name);

				await DataService.syncEventForContract({ graphqlService, dataService, progressRepository, backfillProgressRepository }, event, contract);
			}

			const states: State[] = store.getStatesByContractId(contract.contractId);
			for (const state of states) {
				console.log('Contract', contract.contractId, 'Slot', state.slot);

				await DataService.syncStatesForContract({ graphqlService, dataService, stateProgressRepository, backfillProgressRepository }, state, contract);
			}

			const methods: Method[] = store.getMethodsByContractId(contract.contractId);
			for (const method of methods) {
				console.log('Contract', contract.contractId, 'Method', method.name);

				await DataService.syncMethodsForContract({ graphqlService, dataService, methodProgressRepository, backfillProgressRepository }, method, contract);
			}

			await backfillProgressRepository.updateProgress(contract.contractId, totalProgress); // all done
		}

		process.exit(0);
	});
})();
