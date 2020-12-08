import GraphqlService from "./services/graphqlService";
import GraphqlClient from "./graphqlClient";

class ContractWatcher  {
    private graphqlService: GraphqlService;

    public constructor(url: string) {
        const graphqlClient = new GraphqlClient(url, null);
        this.graphqlService = new GraphqlService(graphqlClient);
    }

    public async ethHeaderCidById(block: number): Promise<any> {
        return this.graphqlService.ethHeaderCidById(block);
    }

    public async subscriptionHeaderCids(func: (value: any) => void): Promise<void> {
        return this.graphqlService.subscriptionHeaderCids(func);
    }
}



module.exports = ContractWatcher;
