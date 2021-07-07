import {rlp, BN, fromRpcSig, keccak, ecrecover, addHexPrefix, pubToAddress} from 'ethereumjs-util';
import Contract from "../models/contract/contract";
import {EthStorageCid} from "../types";

export const getContractsFromLogs = (contracts: Contract[], logs: string[]): Contract[] => {
    return contracts.filter((contract) => logs.map((log) => log.toLowerCase()).includes(contract.address.toLowerCase()));
}

export const increaseHexByOne = (value: string): string => {
    value = value.replace('0x','');
    const x = new BN(value, 'hex');
    const sum = x.addn(1);
    let key = sum.toString(16);
    if (value.length > key.length) {
        key = new Array(value.length - key.length + 1).join('0') + key;
    }

    return '0x' + key;
}

// Convert MultiHash Block data to buffer
export const mhDataToBuffer = (data: string): Buffer => {
    return Buffer.from(data.replace('\\x',''), 'hex');
}

export const decodeStorageCid = (storage: EthStorageCid): Buffer => {
    const buffer = mhDataToBuffer(storage.blockByMhKey.data);
    // array[0] = storage leaf key
    // array[1] = decoded value
    const decodedData = rlp.decode(buffer);
    const decodedValue = rlp.decode(decodedData[1]);

    return decodedValue as Buffer;
}

export const decodeHeaderData = (data: string) => { // eslint-disable-line
    const buffer = mhDataToBuffer(data);
    const decoded: any = rlp.decode(buffer); // eslint-disable-line

    return {
        txHash: decoded[4].toString('hex'),
        time: (new Date(Date.UTC(1970, 0, 1) + parseInt(decoded[11].toString('hex'), 16) * 1000)),
        number: decoded[8].toString('hex'),
        difficulty: decoded[7].toString('hex'),
        gasLimit: decoded[9].toString('hex'),
        gasUsed: decoded[10].toString('hex'),
        uncleHash: decoded[1].toString('hex'),
        parentHash: decoded[0].toString('hex'),
        receiptHash: decoded[5].toString('hex'),
        address: decoded[2].toString('hex'),
        miner: decoded[2].toString('hex'),
        root: decoded[3].toString('hex'),
        bloom: decoded[6].toString('hex'),
        extra: decoded[12].toString('hex'),
        mixDigest: decoded[13].toString('hex'),
        nonce: decoded[14].toString('hex'),
    }
}

export const decodeTransactionData = (data: string) => { // eslint-disable-line
    const buffer = Buffer.from(data.replace('\\x',''), 'hex');
    const decoded: any = rlp.decode(buffer); // eslint-disable-line

    return {
        nonce: decoded[0].toString('hex'),
        gasPrice: decoded[1].toString('hex'),
        gas: decoded[2].toString('hex'), // GasLimit
        to: decoded[3].toString('hex'), // Recipient
        value: decoded[4].toString('hex'), // Amount
        input: decoded[5].toString('hex'), // Payload
        v: decoded[6].toString('hex'),
        r: decoded[7].toString('hex'),
        s: decoded[8].toString('hex'),
    }
}

export const decodeReceiptData = (data: string) => { // eslint-disable-line
    const buffer = Buffer.from(data.replace('\\x',''), 'hex');
    const decoded: any = rlp.decode(buffer); // eslint-disable-line

    return {
        status: decoded[0].toString('hex'),
        gasUsed: decoded[1].toString('hex'),
        data: decoded[2].toString('hex'),
    }
}

export const decodeExtra = (data: string) => {  // eslint-disable-line
    const extra = Buffer.from(data.slice(0, 64), 'hex')
    let right = extra.length - 1
    for (; right >= 0 && extra[right] == 0; right--) {} // eslint-disable-line
    if (right % 2 != 0){
        right++
    }
    const tmp: any = rlp.decode(extra.slice(0, right+1))  // eslint-disable-line
    return tmp.reduce(function(str, value, i){
        if (i === 0) {
            return value.toString('hex')
        }
        return `${str}/${value.toString('utf-8')}`
    }, '');
}

/**
 * Returns miner address for PoA networks. Extract it from block extra field
 *
 * @param blockRlp
 */
export const extractMinerFromExtra = (blockRlp: string): string => {
    const blockRlpBuf = mhDataToBuffer(blockRlp);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = rlp.decode(blockRlpBuf);
    const extra = decoded[12];
    // last 65 bytes are miner signature
    const sig = extra.slice(extra.length - 65);

    // convert hex signature to v, r, s format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signature = fromRpcSig(sig as any as string);

    // to recovery miner address from signature we need to get block hash without this signature
    decoded[12] = extra.slice(0, extra.length - 65);
    const encodedBlock = rlp.encode(decoded);
    const blockHash = keccak(encodedBlock);
    console.log(blockHash, signature);
    const pub = ecrecover(blockHash, signature.v, signature.r, signature.s)
    const address = addHexPrefix(pubToAddress(pub).toString('hex'));

    return address;
}

export const calcBlockSize = (headerRLPStr: string, txsRLPStr: string[], unclesRLPStr: string[]): number => {
    const headerRlp = Buffer.from(headerRLPStr, 'hex');
    const headerDecoded: any = rlp.decode(headerRlp);

    const txRlp = txsRLPStr.map(tx => {
        const txRlp = Buffer.from(tx, 'hex');
        const txDecoded: any = rlp.decode(txRlp);

        return txDecoded;
    });

    const uncleRlp = unclesRLPStr.map(uncle => {
        const uncleRlp = Buffer.from(uncle, 'hex');
        const uncleDecoded: any = rlp.decode(uncleRlp);

        return uncleDecoded;
    });

    const extblock = [headerDecoded, txRlp, uncleRlp];
    const encodedBlock = rlp.encode(extblock);

    return encodedBlock.byteLength;
}