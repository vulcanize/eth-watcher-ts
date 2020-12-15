import GraphqlService from "./services/graphqlService";
import GraphqlClient from "./graphqlClient";

class ContractWatcher  {
    private graphqlService: GraphqlService;
    private store;

    public constructor(url: string, store) {
        const graphqlClient = new GraphqlClient(url, null);
        this.graphqlService = new GraphqlService(graphqlClient);

        this.store = store;
    }

    public async ethHeaderCidById(block: number): Promise<any> {
        return this.graphqlService.ethHeaderCidById(block);
    }

    public async subscriptionHeaderCids(func: (value: any) => void): Promise<void> {
        return this.graphqlService.subscriptionHeaderCids(func);
    }

    public async subscriptionReceiptCids(func: (value: any) => void): Promise<void> {
        return this.graphqlService.subscriptionReceiptCids(this.store, func);
    }

    public async subscriptionStateCids(func: (value: any) => void): Promise<void> {
        return this.graphqlService.subscriptionStateCids(func);
    }
    
}



module.exports = ContractWatcher;
