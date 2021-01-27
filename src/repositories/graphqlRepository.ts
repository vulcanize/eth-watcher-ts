import GraphqlClient from '../graphqlClient';

export default class GraphqlRepository {

	private static repository: GraphqlRepository;

	private graphqlClient: GraphqlClient;

	public static getRepository(graphqlClient: GraphqlClient): GraphqlRepository {
		if (!GraphqlRepository.repository) {
			GraphqlRepository.repository = new GraphqlRepository(graphqlClient);
		}

		return GraphqlRepository.repository;
	}

	public constructor(graphqlClient: GraphqlClient) {
		this.graphqlClient = graphqlClient;
	}

	public ethHeaderCidWithTransactionByBlockNumber(blockNumber: string | number): Promise<unknown> {
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

	public ethHeaderCidWithStateByBlockNumber(blockNumber: string | number): Promise<unknown> {
		return this.graphqlClient.query(`
			query MyQuery {
				ethHeaderCidByBlockNumber(n: "${blockNumber}") {
					nodes {
						stateCidsByHeaderId {
							nodes {
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
								ethHeaderCidByHeaderId {
									blockNumber
								}
							}
						}
					}
				}
			}
		`);
	}

	public async ethHeaderCidByBlockNumber(blockNumber: number): Promise<unknown> {
		const data = await this.graphqlClient.query(`
			query MyQuery {
				ethHeaderCidByBlockNumber(n: "${blockNumber}") {
					nodes {
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
		`);

		if (!data || !data.ethHeaderCidByBlockNumber.nodes || data.ethHeaderCidByBlockNumber.nodes.length === 0) {
			return null;
		}

		return data.ethHeaderCidByBlockNumber.nodes[0];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public subscriptionReceiptCids(onNext: (value: any) => void, onError: (error: any) => void): Promise<void> {
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
		`, onNext, onError);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public subscriptionHeaderCids(onNext: (value: any) => void, onError: (error: any) => void): Promise<void> {
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
		`, onNext, onError);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public subscriptionStateCids(onNext: (value: any) => void, onError?: (error: any) => void): Promise<void> {
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
						ethHeaderCidByHeaderId {
							blockNumber
						}
					}
					}
				}
			}
		`, onNext, onError);
	}

}

