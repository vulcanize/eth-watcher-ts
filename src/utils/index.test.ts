import Contract from "../models/contract/contract";
import {getContractsFromLogs} from "./index";

function dummyContract(address: string): Contract {
    return {
        contractId: 1,
        name: "abc",
        address,
        abi: [],
        states: [],
        startingBlock: 1,
        allAbis: [],
        events: [],
        methods: [],
    }
}

describe('utils', function () {
    test('getContractFromLogs: single contract', function () {
        const contracts: Contract[] = [
            dummyContract("0x1"),
            dummyContract("0x2"),
        ];
        const logs = ["0x2", "0x3", "0x4"];
        expect(getContractsFromLogs(contracts, logs)).not.toBeNull();
        expect(getContractsFromLogs(contracts, logs).length).toEqual(1);
        expect(getContractsFromLogs(contracts, logs)[0].address).toEqual("0x2");

    })
    test('getContractFromLogs: multiple contract', function () {
        const contracts: Contract[] = [
            dummyContract("0x1"),
            dummyContract("0x2"),
        ];
        const logs = ["0x1", "0x2", "0x3", "0x4"];
        expect(getContractsFromLogs(contracts, logs)).not.toBeNull();
        expect(getContractsFromLogs(contracts, logs).length).toEqual(2);
        expect(getContractsFromLogs(contracts, logs)[0].address).toEqual("0x1");
        expect(getContractsFromLogs(contracts, logs)[1].address).toEqual("0x2");
    })
    test('getContractFromLogs: lower case', function () {
        const contracts = [
            dummyContract("0x1AbC"),
            dummyContract("0x2ZeUq"),
        ];
        const logs = ["0x2zEUQ", "0x3", "0x4"];
        expect(getContractsFromLogs(contracts, logs).length).toEqual(1);
        expect(getContractsFromLogs(contracts, logs)[0].address).toEqual("0x2ZeUq");
    })
});
