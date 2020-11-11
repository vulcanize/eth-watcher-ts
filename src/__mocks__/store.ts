import Contract from '../models/contract/contract';

export const contractsByAddrHash = {
  "emptyStateLeafKey": [],
};

export const eventsByContractId = {
  1: {}
}

export const mockGetContractByAddressHash = jest.fn().mockImplementation(function (addrHash: string) {
  return contractsByAddrHash[addrHash];
});

export const mockGetStatesByContractId = jest.fn().mockImplementation(function (contractId: number) {
});

export const mockGetContracts = jest.fn().mockImplementation(function (): Contract[] {
  return [
    { address: 'address1' } as Contract,
    { address: 'address2' } as Contract,
    { address: 'address3' } as Contract,
  ]
});

export const mockGetEventsByContractId = jest.fn().mockImplementation(function (contractId: number) {
  return eventsByContractId[contractId];
});

export const mockGetStore = jest.fn().mockImplementation(() => {
  return {
    getContractByAddressHash: mockGetContractByAddressHash,
    getStatesByContractId: mockGetStatesByContractId,
    getContracts: mockGetContracts,
    getEventsByContractId: mockGetEventsByContractId,
  }
});

export default {
  getStore: mockGetStore
};