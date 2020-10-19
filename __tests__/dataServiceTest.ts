/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import DataService from '../src/services/dataService';
import Event from '../src/models/contract/event';
import Contract from '../src/models/contract/contract';

const mockEvent1 = { eventId: 1, name: 'TestEvent1' } as Event;
const mockContract1 = { contractId: 1, name: 'Contract1', startingBlock: 0 } as Contract;

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

	const blocks = await DataService._syncEventForContractPage({
		graphqlService: mockGraphqlService,
		dataService: mockDataService,
		progressRepository: mockProgressRepository, 
	}, mockEvent1, mockContract1, startBlock, maxBlock, page, limit);

	expect(blocks).toEqual([]);
});