/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import DataService from '../src/services/dataService';
import Event from '../src/models/contract/event';
import Contract from '../src/models/contract/contract';
// import GraphqlService from '../src/services/graphqlService';
// import ProgressRepository from '../src/repositories/data/progressRepository';

jest.mock("typeorm");


const mockEvent1 = new Event();
mockEvent1.eventId = 1;
mockEvent1.name = 'TestEvent1';

const mockContract1 = { contractId: 1, name: 'Contract1', startingBlock: 0 } as Contract;

const mockGraphqlService = {

} as any;

const mockDataService = {
  processEvent: (a) => Promise.resolve(console.log(a)),
} as any;

jest.mock('typeorm', () => ({
  Index: () => jest.fn(),
	Entity: () => jest.fn(),
	Column: () => jest.fn(),
	OneToOne: () => jest.fn(),
  JoinColumn: () => jest.fn(),
	PrimaryGeneratedColumn: () => jest.fn(),
	createConnection: jest.fn(() => Promise.resolve({
		close: jest.fn().mockReturnValue(Promise.resolve()),
		getRepository: jest.fn(() => Promise.resolve({
			// find: jest.fn(() => Promise.resolve(events)),
			// findOneOrFail: jest.fn((id: number) => Promise.resolve(mockEvent1)),
			save: jest.fn().mockReturnValue(Promise.resolve()),
			remove: jest.fn().mockReturnValue(Promise.resolve())
		})),
	})),
	Connection: jest.fn(() =>
		Promise.resolve({
			getRepository: jest.fn().mockReturnValue(
				Promise.resolve({
					// find: jest.fn(() => Promise.resolve(events)),
					// findOneOrFail: jest.fn((id: number) => Promise.resolve(mockEvent1)),
					save: jest.fn().mockReturnValue(Promise.resolve()),
					remove: jest.fn().mockReturnValue(Promise.resolve())
				})
			),
			close: jest.fn().mockReturnValue(Promise.resolve())
		})
	),
	getRepository: jest.fn().mockReturnValue(
		Promise.resolve({
			// find: jest.fn(() => Promise.resolve(events)),
			// findOneOrFail: jest.fn((id: number) => Promise.resolve(mockEvent1)),
			save: jest.fn().mockReturnValue(Promise.resolve()),
			remove: jest.fn().mockReturnValue(Promise.resolve())
		})
	)
}));


test('syncEventForContractPage Test 1', async () => {

	const mockProgressRepository = { findSyncedBlocks: jest.fn().mockResolvedValueOnce([1,2,3,4,5]) } as any;

	const res = await DataService._syncEventForContractPage({
		graphqlService: mockGraphqlService,
		dataService: mockDataService,
		progressRepository: mockProgressRepository, 
	}, mockEvent1, mockContract1, 0, 100, 1);

  console.log(res);
  // TODO: Do a real test
	expect(1 + 2).toBe(3);
});
