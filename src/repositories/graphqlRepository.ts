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

	public async getLastBlock(): Promise<{headerId; blockNumber}> {
		const data = await this.graphqlClient.query(`
			query LastBlock {
				allEthHeaderCids(last: 1) {
					nodes {
						id
						blockNumber
					}
				}
			}
		`);

		return {
			headerId: Number(data?.allEthHeaderCids.nodes[0]?.id || 0),
			blockNumber: Number(data?.allEthHeaderCids.nodes[0]?.blockNumber || 0),
		}
	}

	public ethHeaderCidWithTransactionByBlockNumber(blockNumber: string | number): Promise<unknown> {
		return this.graphqlClient.query(`
			query QueryHeaderAndReceiptByBlockNumber {
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
				}
			}
		`);
	}

	public ethHeaderCidWithStateByBlockNumber(blockNumber: string | number): Promise<unknown> {
		return this.graphqlClient.query(`
			query QueryHeaderAndStorageByBlockNumber {
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

	public ethHeaderCidById(headerId: number): Promise<unknown> {
		return this.graphqlClient.query(`
			query QueryHeaderById {
				ethHeaderCidById(id: ${headerId}) {
					id
					td
					blockHash
					blockNumber
					blockByMhKey {
						data
					}
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
	public subscriptionReceiptCids(onNext: (value: any) => void, onError: (error: any) => void): Promise<void> {
		return this.graphqlClient.subscribe(`
			subscription SubscriptionReceipt {
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
							blockByMhKey {
							  data
							  key
							}
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
		`, onNext, onError);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public subscriptionHeaderCids(onNext: (value: any) => void, onError: (error: any) => void): Promise<void> {
		return this.graphqlClient.subscribe(`
			subscription SubscriptionHeader {
				listen(topic: "header_cids") {
					relatedNode {
						... on EthHeaderCid {
							id
							td
							blockHash
							blockNumber
							blockByMhKey {
								data
							}
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
							ethTransactionCidsByHeaderId {
								nodes {
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
									blockByMhKey {
										data
									}
									receiptCidByTxId {
										blockByMhKey {
											data
										}
										postStatus
										cid
										contract
										contractHash
										topic0S
										topic1S
										topic2S
										topic3S
										postState
										logContracts
										mhKey
									}
								}
							}
							uncleCidsByHeaderId {
								nodes {
									blockByMhKey {
										data
										key
									}
									blockHash
									parentHash
									cid
									mhKey
									reward
								}
							}
						}
					}
				}
			}
		`, onNext, onError);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public subscriptionStateCids(onNext: (value: any) => void, onError?: (error: any) => void): Promise<void> {
		return this.graphqlClient.subscribe(`
			subscription SubscriptionStorage {
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
								blockByMhKey {
									data
									key
								}
							}
						}
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
							blockByMhKey {
							  data
							  key
							}
						}
					}
					}
				}
			}
		`, onNext, onError);
	}

}

