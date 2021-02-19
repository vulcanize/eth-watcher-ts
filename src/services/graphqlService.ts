import GraphqlClient from '../graphqlClient';
import GraphqlRepository from '../repositories/graphqlRepository';
import State from '../models/contract/state';
import Contract from '../models/contract/contract';
import Event from '../models/contract/event';
import DecodeService from '../services/decodeService';

export default class GraphqlService {
	private graphqlRepository: GraphqlRepository;

	constructor (graphqlClient: GraphqlClient) {
		this.graphqlRepository = GraphqlRepository.getRepository(graphqlClient);
	}

	public async getLastBlock(): Promise<{blockNumber}> {
		return this.graphqlRepository.getLastBlock();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidWithTransactionByBlockNumber(blockNumber: string | number): Promise<any> {
		return this.graphqlRepository.ethHeaderCidWithTransactionByBlockNumber(blockNumber);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidWithStateByBlockNumber(blockNumber: string | number): Promise<any> {
		return this.graphqlRepository.ethHeaderCidWithStateByBlockNumber(blockNumber);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidByBlockNumber(blockNumber: number): Promise<any> {
		return this.graphqlRepository.ethHeaderCidByBlockNumber(blockNumber);
	}

	public async subscriptionReceiptCids(contracts: Contract[] | Function, events: Event[] | Function, func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionReceiptCids(async (data) => {
			const relatedNode = data?.data?.listen?.relatedNode;
			const result = await DecodeService.decodeReceiptCid(relatedNode, contracts, events);
			return func(result);
		}, (error) => {console.log(error)});
	}

	public async subscriptionHeaderCids(func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionHeaderCids(func, (error) => {console.log(error)});
	}

	public async subscriptionStateCids(contracts: Contract[] | Function, states: State[] | Function, func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionStateCids(async (data) => {
			const relatedNode = data?.data?.listen?.relatedNode;
			const result = await DecodeService.decodeStateCid(relatedNode, contracts, states);
			return func(result);
		}, (error) => {console.log(error)});
	}

}
