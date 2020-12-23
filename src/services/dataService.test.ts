/* eslint-disable @typescript-eslint/ban-ts-ignore */
jest.mock('../store');
jest.mock('../repositories/data/addressIdSlotIdRepository');

import DataService from './dataService';
import Event from '../models/contract/event';
import Contract from '../models/contract/contract';
import State from '../models/contract/state';
import HeaderCids from '../models/eth/headerCids';
import TransactionCids from '../models/eth/transactionCids';

//@ts-ignore
import { mockGetEventsByContractId, mockGetStore, mockGetContractByAddressHash, mockGetStatesByContractId, mockGetContracts } from '../store';
import { rlp } from 'ethereumjs-util';

const mockGraphqlService = {
  ethHeaderCidWithTransactionByBlockNumber: () => ({
    ethHeaderCidByBlockNumber: {
      nodes: [{
        ethTransactionCidsByHeaderId: {
          nodes: [{
            id: 1,
          }],
        },
      }],
    },
  }),
} as any;

const mockDataService = {
  processEvent: () => Promise.resolve(),
} as any;

const mockContract = {
  contractId: 1,
  name: 'Contract1',
  startingBlock: 0,
  abi: [{
    "anonymous": false,
    "inputs": [{
      "indexed": false,
      "internalType": "string",
      "name": "message",
      "type": "string"
    }],
    "name": "MessageChanged",
    "type": "event"
  }, {
    "inputs": [],
    "name": "getMessage",
    "outputs": [{
      "internalType": "string",
      "name": "_message",
      "type": "string"
    }],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "message",
    "outputs": [{
      "internalType": "string",
      "name": "",
      "type": "string"
    }],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{
      "internalType": "string",
      "name": "_message",
      "type": "string"
    }],
    "name": "setMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }],
} as Contract;

test('_getPgType', async function () {
  // @ts-ignore
  expect(await DataService._getPgType('bool')).toEqual('boolean');
  // @ts-ignore
  expect(await DataService._getPgType('uint8')).toEqual('numeric');
  // @ts-ignore
  expect(await DataService._getPgType('uint256')).toEqual('numeric');
  // @ts-ignore
  expect(await DataService._getPgType('int8')).toEqual('numeric');
  // @ts-ignore
  expect(await DataService._getPgType('int256')).toEqual('numeric');
  // @ts-ignore
  expect(await DataService._getPgType('address')).toEqual('character varying(66)');
  // @ts-ignore
  expect(await DataService._getPgType('bytes')).toEqual('bytea');
});

describe('_getTableOptions', function () {
  test('_getTableName', async function () {
    // @ts-ignore
    const tableName1 = await DataService._getTableName({ id: 1, contractId: 1 });
    expect(tableName1).toEqual('data.contract_id_1_event_id_1');
    // @ts-ignore
    const tableName2 = await DataService._getTableName({ id: 2, contractId: 1 });
    expect(tableName2).toEqual('data.contract_id_1_event_id_2');
    // @ts-ignore
    const tableName3 = await DataService._getTableName({ id: 1, contractId: 2 });
    expect(tableName3).toEqual('data.contract_id_2_event_id_1');
  });

  test('by event', async function () {
    const event: Event = { eventId: 2, name: 'MessageChanged' };
    // @ts-ignore
    const tableOptions = await DataService._getTableOptions(mockContract, { event });
    expect(tableOptions).toEqual({
      columns: [{
        "generationStrategy": "increment",
        "isGenerated": true,
        "isPrimary": true,
        "name": "id",
        "type": "integer",
      }, {
        "name": "contract_id",
        "type": "integer",
      }, {
        "name": "mh_key",
        "type": "text",
      }, {
        "name": "event_id",
        "type": "integer",
      }, {
        "isNullable": true,
        "name": "data_message",
        "type": "text",
      }],
      "name": "data.contract_id_1_event_id_2",
    });
  });
});

describe('_syncEventForContractPage', function () {
  const mockEvent: Event = {
    eventId: 1,
    name: 'TestEvent1'
  };

  test('full', async function () {
    const mockProgressRepository = {
      findSyncedBlocks: jest.fn().mockResolvedValueOnce(
        [2, 3, 4, 5].map(blockNumber => ({ blockNumber }))
      )
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
    }, mockEvent, mockContract, startBlock, maxBlock, page, limit);

    expect(blocks).toEqual([0, 1, 6, 7, 8, 9,]);
  });

  test('without synced blocks', async function () {
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
    }, mockEvent, mockContract, startBlock, maxBlock, page, limit);

    expect(blocks).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('with all synced blocks', async function () {
    const mockProgressRepository = {
      findSyncedBlocks: jest.fn().mockResolvedValueOnce(
        [0, 1, 2].map((blockNumber) => ({ blockNumber }))
      )
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
    }, mockEvent, mockContract, startBlock, maxBlock, page, limit);

    expect(blocks).toEqual([]);
  });
});

describe('processState', function () {
  let dataService: DataService

  beforeEach(async function () {
    dataService = new DataService();
  });

  test('empty args', async function () {
    expect(await dataService.processState(undefined)).toEqual(undefined);
    expect(await dataService.processState(null)).toEqual(undefined);
    expect(await dataService.processState({})).toEqual(undefined);
  });

  test('no contracts', async function () {
    const stateLeafKey = "emptyStateLeafKey";

    await dataService.processState({ stateLeafKey });

    expect(mockGetStore).toBeCalledTimes(1);
    expect(mockGetContractByAddressHash).toBeCalledTimes(1);
    expect(mockGetContractByAddressHash).toBeCalledWith(stateLeafKey);
    expect(mockGetStatesByContractId).not.toBeCalled();
  });

  // TODO: fix test
  test.skip('check uint', async function () {
    dataService.addState = jest.fn().mockImplementation(function (contractId: number, mhKey: string, state: State, value: any, blockNumber: number): Promise<void> {
      return null
    });

    const stateLeafKey = "someStateLeafKey";
    const relatedNode = {
      stateLeafKey,
      ethHeaderCidByHeaderId: {
        blockNumber: 0,
      },
      storageCidsByStateId: {
        nodes: [{
          storageLeafKey: "0x471ccdcb79bddea38175f8cc115b52365f2c864200fbce48e994511bb9c6006f",
          blockByMhKey: {
            data: "c512c2345678",
          },
        }]
      }
    }

    const stateCids = await dataService.processState(relatedNode);

    expect(mockGetStore).toBeCalledTimes(4);
    expect(mockGetContractByAddressHash).toBeCalledTimes(2);
    expect(mockGetContractByAddressHash).toBeCalledWith(stateLeafKey);
    expect(mockGetStatesByContractId).toBeCalledTimes(1);
    expect(dataService.addState).toBeCalledTimes(2);
  });
});

describe('processEvent', function () {
  let dataService: DataService

  beforeEach(async function () {
    dataService = new DataService();
  });

  test('empty args', async function () {
    expect(await dataService.processEvent(undefined, undefined)).toEqual(undefined);
    expect(await dataService.processEvent(null, null)).toEqual(undefined);
  });

  test('no logContracts and no target', async function () {
    dataService.processHeader = jest.fn().mockImplementation(async function (relatedNode: { td; blockHash; blockNumber; bloom; cid; mhKey; nodeId; ethNodeId; parentHash; receiptRoot; uncleRoot; stateRoot; txRoot; reward; timesValidated; timestamp }): Promise<HeaderCids> {
      return {
        id: 0,
      } as HeaderCids;
    });
    dataService.processTransaction = jest.fn().mockImplementation(function (ethTransaction, headerId: number): Promise<TransactionCids> {
      return null
    });

    const relatedNode1 = {
      ethTransactionCidByTxId: {
        ethHeaderCidByHeaderId: "0xheaderCidByHeaderId",
      }
    };
    const resp1 = await dataService.processEvent(relatedNode1, null);  // TODO

    expect(dataService.processHeader).toBeCalledTimes(1);
    expect(dataService.processHeader).toBeCalledWith(relatedNode1.ethTransactionCidByTxId.ethHeaderCidByHeaderId)
    expect(dataService.processTransaction).toBeCalledTimes(1);
    expect(dataService.processTransaction).toBeCalledWith(relatedNode1.ethTransactionCidByTxId, 0);
    expect(resp1).toEqual(undefined);

    const relatedNode2 = {
      ethTransactionCidByTxId: {
        ethHeaderCidByHeaderId: "0xheaderCidByHeaderId",
      },
      logContracts: [
        "veryUniqueAddress"
      ]
    };
    const resp2 = await dataService.processEvent(relatedNode2, null); // TODO
    expect(mockGetContracts).toBeCalledTimes(1);
    expect(resp2).toEqual(undefined);
  });

  test('check cycle', async function () {
    dataService.processHeader = jest.fn().mockImplementation(async function (relatedNode: { td; blockHash; blockNumber; bloom; cid; mhKey; nodeId; ethNodeId; parentHash; receiptRoot; uncleRoot; stateRoot; txRoot; reward; timesValidated; timestamp }): Promise<HeaderCids> {
      return {
        id: 0,
      } as HeaderCids;
    });
    dataService.processTransaction = jest.fn().mockImplementation(function (ethTransaction, headerId: number): Promise<TransactionCids> {
      return null
    });
    dataService.addEvent = jest.fn().mockImplementation(function (): Promise<void> {
      return null
    })

    await dataService.processEvent({
      ethTransactionCidByTxId: {
        ethHeaderCidByHeaderId: "0xheaderCidByHeaderId",
      },
      logContracts: [
        "address3"
      ],
      topic0S: [
        "0x3655aa002c9e821cc231138d4f8790003402c95dd1c0cfb6378146d16c7ea582"
      ],
      blockByMhKey: {
        data: rlp.encode(["1", "2", "3", [[["1"], ["1"], []]]]).toString("hex"),
      },
    }, null); // TODO

    expect(dataService.processHeader).toBeCalledTimes(1);
    expect(dataService.processHeader).toBeCalledWith("0xheaderCidByHeaderId")
    expect(dataService.processTransaction).toBeCalledTimes(1);
    expect(dataService.processTransaction).toBeCalledWith({ ethHeaderCidByHeaderId: "0xheaderCidByHeaderId" }, 0);
    expect(mockGetContracts).toBeCalledTimes(2);

    expect(mockGetEventsByContractId).toBeCalledTimes(1)
    expect(mockGetEventsByContractId).toBeCalledWith(3)

    expect(dataService.addEvent).toBeCalledTimes(1);
  });
});


test('_getKeyForFixedType', async function () {
  // @ts-ignore
  expect(DataService._getKeyForFixedType(0)).toEqual('0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563');
  // @ts-ignore
  expect(DataService._getKeyForFixedType(1)).toEqual('0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6');
  // @ts-ignore
  expect(DataService._getKeyForFixedType(10)).toEqual('0xc65a7bb8d6351c1cf70c95a316cc6a92839c986682d98bc35f958f4883f9d2a8');
  // @ts-ignore
  expect(DataService._getKeyForFixedType(100)).toEqual(null);
});

describe('processEvent', function () {
  const address = "0x117Db93426Ad44cE9774D239389fcB83057Fc88b";

  test('_getKeyForMapping without hot fix', async function () {
    // @ts-ignore
    expect(DataService._getKeyForMapping(address, 0, false)).toEqual('0x7b59136576339ef93bec67603ecd6849a432f97a8db18739858628d63e31e4e6');
    // @ts-ignore
    expect(DataService._getKeyForFixedType(address, 100, false)).toEqual(null);
  });

  test('_getKeyForMapping with hot fix', async function () {
    // @ts-ignore
    expect(DataService._getKeyForMapping(address, 0)).toEqual('0x4d7121c6ebdd9e653e74262fbd95e6b2c834fced8b79a244c406adc41aad8ae4');
  });
});
