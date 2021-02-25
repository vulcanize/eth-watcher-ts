import Address from 'models/data/address';
import Contract from '../models/contract/contract';

export const contractsByAddrHash = {
  "emptyStateLeafKey": null,
  "someStateLeafKey": {
    contractId: 1,
    address: "0xAddress",
  }
};

export const eventsByContractId = {
  1: [
  ],
  3: [{
    name: 'ename'
  }],
};

export const statesByContractId = {
  1: [{
    slot: 0,
    type: 'uint pos0;',
    variable: 'pos0'
  }]
};

export const mockGetContractByAddressHash = jest.fn().mockImplementation(function (addrHash: string) {
  return contractsByAddrHash[addrHash];
});

export const mockGetStatesByContractId = jest.fn().mockImplementation(function (contractId: number) {
  return statesByContractId[contractId];
});

export const mockGetContracts = jest.fn().mockImplementation(function (): Contract[] {
  return [
    { address: 'address1' } as Contract,
    { address: 'address2' } as Contract,
    {
      address: 'address3',
      contractId: 3,
      events: [1],
      abi: [{
        name: 'ename',
        inputs: [{
          "anonymous": false,
          "inputs": [{
            "indexed": false,
            "internalType": "string",
            "name": "message",
            "type": "string"
          }],
          "name": "MessageChanged",
          "type": "event"
        }],
      }],
    } as Contract,
  ]
});

export const mockGetEventsByContractId = jest.fn().mockImplementation(function (contractId: number) {
  return eventsByContractId[contractId];
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mockGetAddressById = jest.fn().mockImplementation(function (addressId: number): Address {
  return null;
});

export const mockGetAddress = jest.fn().mockImplementation(function (addressString: string): Address {
  return {
    addressId: 0,
    address: addressString,
    hash: ''
  };
});

export const mockGetStore = jest.fn().mockImplementation(() => {
  return {
    getContractByAddressHash: mockGetContractByAddressHash,
    getStatesByContractId: mockGetStatesByContractId,
    getContracts: mockGetContracts,
    getEventsByContractId: mockGetEventsByContractId,
    getAddressById: mockGetAddressById,
    getAddress: mockGetAddress
  }
});

export default {
  getStore: mockGetStore
};