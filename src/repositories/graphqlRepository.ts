import GraphqlClient from '../graphqlClient';

export default class GraphqlRepository {

	private static repository: GraphqlRepository;

	private graphqlClient: GraphqlClient;

	public static getRepository(): GraphqlRepository {
		if (!GraphqlRepository.repository) {
			GraphqlRepository.repository = new GraphqlRepository();
		}

		return GraphqlRepository.repository;
	}
	
	public constructor() {
		this.graphqlClient = new GraphqlClient();
	}

	public ethHeaderCidByBlockNumber(blockNumber: string | number): Promise<unknown> {
		return this.graphqlClient.query(`
			query MyQuery {
				ethHeaderCidByBlockNumber(n: "${blockNumber}") {
					nodes {
						ethTransactionCidsByHeaderId {
							nodes {
								receiptCidByTxId {
									id
									mhKey
									logContracts
									nodeId
									topic0S
									topic1S
									topic2S
									topic3S
									txId
									cid
									contract
									blockByMhKey {
										data
									}
									ethTransactionCidByTxId {
										ethHeaderCidByHeaderId {
											blockNumber
										}
									}
								}
							}
						}
					}
				}
			}
		`);
	}

	public ethHeaderCidById(headerId: number): Promise<unknown> {
		return this.graphqlClient.query(`
			query MyQuery {
				ethHeaderCidById(id: ${headerId}) {
					id
					td
					blockHash
					blockNumber
					bloom
					cid
					mhKey
					nodeId
					ethNodeId
					parentHash
					receiptRoot
					reward
					timesValidated
					timestamp
					txRoot
					uncleRoot
					stateRoot
				}
			}
		`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public subscriptionReceiptCids(onNext: (value: any) => void): Promise<void> {
		return this.graphqlClient.subscribe(`
			subscription MySubscription {
				listen(topic: "receipt_cids") {
					relatedNode {
					... on ReceiptCid {
						id
						mhKey
						logContracts
						nodeId
						topic0S
						topic1S
						topic2S
						topic3S
						txId
						cid
						contract
						blockByMhKey {
							data
						}
						ethTransactionCidByTxId {
							id
							cid
							deployment
							headerId
							index
							mhKey
							nodeId
							dst
							src
							txData
							txHash
							ethHeaderCidByHeaderId {
								id
								td
								blockHash
								blockNumber
								bloom
								cid
								mhKey
								nodeId
								ethNodeId
								parentHash
								receiptRoot
								reward
								timesValidated
								timestamp
								txRoot
								uncleRoot
								stateRoot
							}
						}
					}
					}
				}
			}
		`, onNext);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public subscriptionHeaderCids(onNext: (value: any) => void): Promise<void> {
		return this.graphqlClient.subscribe(`
			subscription MySubscription {
				listen(topic: "header_cids") {
					relatedNode {
					... on EthHeaderCid {
						id
						td
						blockHash
						blockNumber
						bloom
						cid
						mhKey
						nodeId
						ethNodeId
						parentHash
						receiptRoot
						reward
						timesValidated
						timestamp
						txRoot
						uncleRoot
						stateRoot
					}
					}
				}
			}
		`, onNext);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public subscriptionStateCids(onNext: (value: any) => void): Promise<void> {
		return this.graphqlClient.subscribe(`
			subscription MySubscription {
				listen(topic: "state_cids") {
					relatedNode {
					... on StateCid {
						id
						blockByMhKey {
							data
							key
						}
						stateLeafKey
						statePath
						mhKey
						headerId
						storageCidsByStateId {
							nodes {
								storageLeafKey
								storagePath
								mhKey
								id
								stateId
								blockByMhKey {
									data
									key
								}
							}
						}
					}
					}
				}
			}
		`, onNext);
	}
}

