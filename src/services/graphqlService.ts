import GraphqlRepository from '../repositories/graphqlRepository';
import DataService from './dataService';

export default class GraphqlService {

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidByBlockNumber(blockNumber: string | number): Promise<any> {
		const graphqlRepository: GraphqlRepository = GraphqlRepository.getRepository();
		return graphqlRepository.ethHeaderCidByBlockNumber(blockNumber);
	}

	public async subscriptionReceiptCids(): Promise<void> {
		const dataService = new DataService();

		const graphqlRepository: GraphqlRepository = GraphqlRepository.getRepository();
		return graphqlRepository.subscriptionReceiptCids((data) => dataService.processEvent(data?.data?.listen?.relatedNode))
	}

}
