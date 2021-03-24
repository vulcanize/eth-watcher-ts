import GraphqlClient from '../graphqlClient';
import GraphqlRepository from '../repositories/graphqlRepository';
import State from '../models/contract/state';
import Contract from '../models/contract/contract';
import Event from '../models/contract/event';
import DecodeService from '../services/decodeService';
import {ContractFunction, DecodeReceiptResult, DecodeStateResult, EventFunction, StateFunction} from "../types";

export default class GraphqlService {
	private graphqlRepository: GraphqlRepository;

	constructor (graphqlClient: GraphqlClient) {
		this.graphqlRepository = GraphqlRepository.getRepository(graphqlClient);
	}

	public async getLastBlock(): Promise<{headerId; blockNumber}> {
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
	public async ethHeaderCidById(headerId: number): Promise<any> {
		return this.graphqlRepository.ethHeaderCidById(headerId);
	}

	public async subscriptionReceiptCids(contracts: Contract[] | ContractFunction, events: Event[] | EventFunction, func: (value: DecodeReceiptResult) => void): Promise<void> {
		return this.graphqlRepository.subscriptionReceiptCids(async (data) => {
			const relatedNode = data?.data?.listen?.relatedNode;
			const result: DecodeReceiptResult = await DecodeService.decodeReceiptCid(relatedNode, contracts, events);
			return func(result);
		}, (error) => {console.log(error)});
	}

	public async subscriptionHeaderCids(func: (value) => void): Promise<void> {
		return this.graphqlRepository.subscriptionHeaderCids(func, (error) => {console.log(error)});
	}

	public async subscriptionStateCids(contracts: Contract[] | ContractFunction, states: State[] | StateFunction, func: (value: DecodeStateResult) => void): Promise<void> {
		return this.graphqlRepository.subscriptionStateCids(async (data) => {
			const relatedNode = data?.data?.listen?.relatedNode;
			console.log(`State id: ${relatedNode.id}`)
			const result: DecodeStateResult = await DecodeService.decodeStateCid(relatedNode, contracts, states);
			return func(result);
		}, (error) => {console.log(error)});
	}

}
