import Contract from "../models/contract/contract";
import {getContractsFromLogs} from "./index";

describe('utils', function () {
    test('getContractFromLogs: single contract', function () {
        let contracts: Contract[] = [
            dummyContract("0x1"),
            dummyContract("0x2"),
        ];
        let logs = ["0x2", "0x3", "0x4"];
        expect(getContractsFromLogs(contracts, logs)).not.toBeNull();
        expect(getContractsFromLogs(contracts, logs).length).toEqual(1);
        expect(getContractsFromLogs(contracts, logs)[0].address).toEqual("0x2");

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