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
    blockByMhKey: BlockByMhKey;
};

export type ethTransactionCids = {
    nodes: EthTransactionCid[];
}

export type EthHeaderCid = {
    td: string;
    cid: string;
    blockHash: string;
    parentHash: string;
    blockNumber: string;
    blockByMhKey: BlockByMhKey;
    bloom: Buffer;
    mhKey: string;
    reward: string;
    stateRoot: string;
    txRoot: string;
    receiptRoot: string;
    uncleRoot: string;
    timesValidated: number;
    timestamp: string;
    ethTransactionCidsByHeaderId: ethTransactionCids;
}

export type EthStateCid = {
    mhKey: string;
    headerId: number;
    blockByMhKey: BlockByMhKey;
    ethHeaderCidByHeaderId: EthHeaderCid;
    stateLeafKey: string;
    statePath: string;
    storageCidsByStateId: {
        nodes: EthStorageCid[];
    };
};

export type EthStorageCid = {
    mhKey: string;
    blockByMhKey: BlockByMhKey;
    storageLeafKey: string;
    storagePath: string;

};

export type BlockByMhKey = {
    key: string;
    data: string;
};