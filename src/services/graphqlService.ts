import GraphqlRepository from '../repositories/graphqlRepository';
import DataService from './dataService';

export default class GraphqlService {

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidWithTransactionByBlockNumber(blockNumber: string | number): Promise<any> {
		const graphqlRepository: GraphqlRepository = GraphqlRepository.getRepository();
		return graphqlRepository.ethHeaderCidWithTransactionByBlockNumber(blockNumber);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidWithStateByBlockNumber(blockNumber: string | number): Promise<any> {
		const graphqlRepository: GraphqlRepository = GraphqlRepository.getRepository();
		return graphqlRepository.ethHeaderCidWithStateByBlockNumber(blockNumber);
	}


	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidById(headerId: number): Promise<any> {
		const graphqlRepository: GraphqlRepository = GraphqlRepository.getRepository();
		return graphqlRepository.ethHeaderCidById(headerId);
	}

	public async subscriptionReceiptCids(): Promise<void> {
		const dataService = new DataService();

		const graphqlRepository: GraphqlRepository = GraphqlRepository.getRepository();
		return graphqlRepository.subscriptionReceiptCids((data) => dataService.processEvent(data?.data?.listen?.relatedNode))
	}

	public async subscriptionHeaderCids(): Promise<void> {
		const dataService = new DataService();

		const graphqlRepository: GraphqlRepository = GraphqlRepository.getRepository();
		return graphqlRepository.subscriptionHeaderCids((data) => dataService.processHeader(data?.data?.listen?.relatedNode))
	}

	public async subscriptionStateCids(): Promise<void> {
		const dataService = new DataService();

		const graphqlRepository: GraphqlRepository = GraphqlRepository.getRepository();
		return graphqlRepository.subscriptionStateCids((data) => dataService.processState(data?.data?.listen?.relatedNode))
	}

}
