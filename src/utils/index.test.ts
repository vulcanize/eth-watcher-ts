import Contract from "../models/contract/contract";
import {decodeStorageCid, getContractsFromLogs, increaseHexByOne, mhDataToBuffer} from "./index";
import {EthStorageCid} from "../types";

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

describe('utils', () => {
    test('getContractFromLogs: single contract', () => {
        const contracts: Contract[] = [
            dummyContract("0x1"),
            dummyContract("0x2"),
        ];
        const logs = ["0x2", "0x3", "0x4"];
        expect(getContractsFromLogs(contracts, logs)).not.toBeNull();
        expect(getContractsFromLogs(contracts, logs).length).toEqual(1);
        expect(getContractsFromLogs(contracts, logs)[0].address).toEqual("0x2");

    })
    test('getContractFromLogs: multiple contract', () => {
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
    test('getContractFromLogs: lower case', () => {
        const contracts = [
            dummyContract("0x1AbC"),
            dummyContract("0x2ZeUq"),
        ];
        const logs = ["0x2zEUQ", "0x3", "0x4"];
        expect(getContractsFromLogs(contracts, logs).length).toEqual(1);
        expect(getContractsFromLogs(contracts, logs)[0].address).toEqual("0x2ZeUq");
    });

    test('increaseHexByOne: zero', () => {
        const a = "0x00";
        const b = "0x01";
        expect(increaseHexByOne(a)).toEqual(b);
    });
    test('increaseHexByOne: zero', () => {
        const a = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const b = "0x0000000000000000000000000000000000000000000000000000000000000001";
        expect(increaseHexByOne(a)).toEqual(b);
    });
    test('increaseHexByOne: big int', () => {
        const a = "0x69b38749f0a8ed5d505c8474f7fb62c7828aad8a7627f1c67e07af1d2368cad4";
        const b = "0x69b38749f0a8ed5d505c8474f7fb62c7828aad8a7627f1c67e07af1d2368cad5";
        expect(increaseHexByOne(a)).toEqual(b);
    });

    test('mhDataToBuffer: empty', () => {
        const a = "";
        expect(mhDataToBuffer(a)).toEqual(new Buffer([]));
    });
    test('mhDataToBuffer: not empty', () => {
        const a = "\\xE2A0390DECD9548B62A8D60345";
        expect(mhDataToBuffer(a)).toEqual(Buffer.from([0xe2, 0xa0, 0x39, 0x0d, 0xec, 0xd9, 0x54, 0x8b, 0x62, 0xa8,
            0xd6, 0x03, 0x45]));
    });

    test('decodeStorageCid. short string', () => {
        const storage: EthStorageCid = {
            storageLeafKey: "",
            storagePath: "",
            mhKey: "",
            blockByMhKey: {
                key: "",
                data: "\\xf844a120290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563a1a0616263313233000000000000000000000000000000000000000000000000000c"
            }
        };

        expect(decodeStorageCid(storage)).toEqual(Buffer.from([0x61, 0x62, 0x63, 0x31, 0x32, 0x33, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0c]));
    });
});
