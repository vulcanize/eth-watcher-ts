import GraphqlClient from '../graphqlClient';
import GraphqlRepository from '../repositories/graphqlRepository';

export default class GraphqlService {
	private graphqlRepository: GraphqlRepository;

	constructor (graphqlClient: GraphqlClient) {
		this.graphqlRepository = GraphqlRepository.getRepository(graphqlClient);
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

	public async subscriptionReceiptCids(func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionReceiptCids(func);
	}

	public async subscriptionHeaderCids(func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionHeaderCids(func);
	}

	public async subscriptionStateCids(func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionStateCids(func);
	}

}
