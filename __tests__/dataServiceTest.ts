/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import DataService from '../src/services/dataService';
import Event from '../src/models/contract/event';
import Contract from '../src/models/contract/contract';

const mockEvent1 = { eventId: 1, name: 'TestEvent1' } as Event;
const mockEvent2 = { eventId: 2, name: 'MessageChanged' } as Event;

const mockContract1 = {
	contractId: 1,
	name: 'Contract1',
	startingBlock: 0,
	abi: [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"message","type":"string"}],"name":"MessageChanged","type":"event"},{"inputs":[],"name":"getMessage","outputs":[{"internalType":"string","name":"_message","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"message","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_message","type":"string"}],"name":"setMessage","outputs":[],"stateMutability":"nonpayable","type":"function"}],
} as Contract;

const mockGraphqlService = {
	ethHeaderCidByBlockNumber: () => ({
		ethHeaderCidByBlockNumber: {
			nodes: [{
			ethTransactionCidsByHeaderId: {
				nodes: [{
				id: 1,
				}]
			}
			}]
		}
	}),
} as any;

const mockDataService = {
	processEvent: () => Promise.resolve(),
} as any;

test('syncEventForContractPage Test Full', async () => {

	const mockProgressRepository = {
		findSyncedBlocks: jest.fn().mockResolvedValueOnce([2,3,4,5].map((blockNumber) => ({ blockNumber })))
	} as any;

	const startBlock = 0;
	const maxBlock = 9;
	const limit = 10;
	const page = 1;

	// @ts-ignore
	const blocks = await DataService._syncEventForContractPage({
		graphqlService: mockGraphqlService,
		dataService: mockDataService,
		progressRepository: mockProgressRepository, 
	}, mockEvent1, mockContract1, startBlock, maxBlock, page, limit);

	expect(blocks).toEqual([0,1,6,7,8,9]);
});

test('syncEventForContractPage Test without synced blocks', async () => {

	const mockProgressRepository = {
		findSyncedBlocks: jest.fn().mockResolvedValueOnce([])
	} as any;

	const startBlock = 0;
	const maxBlock = 9;
	const limit = 10;
	const page = 1;

	// @ts-ignore
	const blocks = await DataService._syncEventForContractPage({
		graphqlService: mockGraphqlService,
		dataService: mockDataService,
		progressRepository: mockProgressRepository, 
	}, mockEvent1, mockContract1, startBlock, maxBlock, page, limit);

	expect(blocks).toEqual([0,1,2,3,4,5,6,7,8,9]);
});

test('syncEventForContractPage Test with all synced blocks', async () => {

	const mockProgressRepository = {
		findSyncedBlocks: jest.fn().mockResolvedValueOnce([0,1,2].map((blockNumber) => ({ blockNumber })))
	} as any;

	const startBlock = 0;
	const maxBlock = 2;
	const limit = 10;
	const page = 1;

	// @ts-ignore
	const blocks = await DataService._syncEventForContractPage({
		graphqlService: mockGraphqlService,
		dataService: mockDataService,
		progressRepository: mockProgressRepository, 
	}, mockEvent1, mockContract1, startBlock, maxBlock, page, limit);

	expect(blocks).toEqual([]);
});

test('_getTableOptions, test 1', async () => {
	// @ts-ignore
	const tableName = await DataService._getTableName(mockContract1.contractId, mockEvent1.eventId);
	expect(tableName).toEqual('data.contract_id_1_event_id_1');
});

test('_getTableOptions, test 2', async () => {
	// @ts-ignore
	const tableName = await DataService._getTableName(mockContract1.contractId, mockEvent2.eventId);
	expect(tableName).toEqual('data.contract_id_1_event_id_2');
});

test('_getTableOptions', async () => {

	// @ts-ignore
	const tableOptions = await DataService._getTableOptions(mockContract1, mockEvent2);

	expect(tableOptions).toEqual({
		columns: [{
			"generationStrategy": "increment",
			"isGenerated": true,
			"isPrimary": true,
			"name": "id",
			"type": "integer",
		}, {
			"name": "event_id",
			"type": "integer",
		}, {
			"name": "contract_id",
			"type": "integer",
		}, {
			"name": "mh_key",
			"type": "text",
		}, {
			"isNullable": true,
			"name": "data_message",
			"type": "TEXT",
		}],
		"name": "data.contract_id_1_event_id_2",
	});
});