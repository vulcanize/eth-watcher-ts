import Contract from "../models/contract/contract";

export const getContractsFromLogs = (contracts: Contract[], logs: string[]): Contract[] => {
    return contracts.filter((contract) => logs.map((log) => log.toLowerCase()).includes(contract.address.toLowerCase()));
}