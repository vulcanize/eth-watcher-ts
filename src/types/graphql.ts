export type EthReceiptCid = {
    id: number;
    mhKey: string;
    logContracts: string[] | null;
    topic0S: string[] | null;
    topic1S: string[] | null;
    topic2S: string[] | null;
    topic3S: string[] | null;
    txId: number;
    cid: string;
    contract: string;
    blockByMhKey: BlockByMhKey;
    ethTransactionCidByTxId: EthTransactionCid;
};

export type EthTransactionCid = {
    cid: string;
    headerId: number;
    index: number;
    mhKey: string;
    src: string;
    dst: string;
    txData: Buffer;
    txHash: string;
    ethHeaderCidByHeaderId: EthHeaderCid;
};

export type EthHeaderCid = {
    td: string;
    cid: string;
    blockHash: string;
    parentHash: string;
    blockNumber: string;
    bloom: Buffer;
    mhKey: string;
    reward: string;
    stateRoot: string;
    txRoot: string;
    receiptRoot: string;
    uncleRoot: string;
    timesValidated: number;
    timestamp: string;
}

export type BlockByMhKey = {
    key: string;
    data: string;
};