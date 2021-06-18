import Contract from "../models/contract/contract";
import {decodeStorageCid, extractMinerFromExtra, getContractsFromLogs, increaseHexByOne, mhDataToBuffer} from "./index";
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

    test('extractMinerFromExtra', () => {
        // block 8647996 on Rinkeby
        const blockRlp = "f9025ca00a84ebb80b8616551e251a42273bc0860e1db619affc009a7d17b96b8dba6cbaa01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347940000000000000000000000000000000000000000a0d7ce7224e063acb68e6dd5ba4e0ef90d4c6e61d4e30cdc6b6b5ef5adfc32a8c6a09db0cbfa54f72435c8f15326d01924bb0b9c1aa4ffa1b05eef9e4dbafc4179a1a0e9602d458a57dd10df00ac06b014da188c1bfb2276fd8b39cde58a82cf78169eb9010000020100400000100000400040008800000000100404008000000000004000000000820100000800210000400080200000010000800000000800000000a00240000000820000000800000008008000000000000800000401100000400000001430000000200000000000000010808000200090000000001520080010400000000100000100042000001840000100000080000040104088000000010000040000228000000000400040200000040000040000084000100020000000004000800000104002200000000000000000000047012080010000040040001000000000a00010000000000040000000020000120000000080000006008000100001000000018383f53c8398c5278324527d8460ad1423b861d883010a04846765746888676f312e31362e33856c696e7578000000000000009e5b0e7ed267a159861a0c8a5b982adb1c3d4cfd12cd85eed6389e113ba614e23350342cd4cfeb8ea0d34bcaacadfa1a108be9c204ea5c95642fb8c03b6493df01a00000000000000000000000000000000000000000000000000000000000000000880000000000000000";
        const miner = "0x7ffc57839b00206d1ad20c69a1981b489f772031";

        expect(extractMinerFromExtra(blockRlp)).toEqual(miner);
    });
});
