import GraphqlService from "./services/graphqlService";
import GraphqlClient from "./graphqlClient";
import Contract from "./models/contract/contract";
import State from "./models/contract/state";
import Event from "./models/contract/event";

type ContractConfig = {
	address: string;
    events?: Event[];
    states?: State[];
    abi?: any; // eslint-disable-line
}[]

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

    public async subscriptionReceiptCids(contractConfig: ContractConfig, func: (value: any) => void): Promise<void> {
        const contracts: Contract[] = [];
        const events: Event[] = [];
        let eventId = 1;

        for(const c of contractConfig) {
            const eventIds = [];
            for (const e of c.events) {
                events.push({
                    eventId,
                    name: e.name,
                });
                eventIds.push(eventId);
                eventId++;
            }
            contracts.push({
                address: c.address,
                abi: c.abi,
                events: eventIds,
            } as Contract);
        }
        return this.graphqlService.subscriptionReceiptCids(contracts, events, func);
    }

    public async subscriptionStateCids(contractConfig: ContractConfig, func: (value: any) => void): Promise<void> {
        const contracts: Contract[] = [];
        const states: State[] = [];
        let stateId = 1;

        for(const c of contractConfig) {
            const stateIds = [];
            for (const e of c.states) {
                states.push({
                    stateId,
                    slot: e.slot,
                    type: e.type,
                    variable: e.variable
                });
                stateIds.push(stateId);
                stateId++;
            }
            contracts.push({
                address: c.address,
                states: stateIds,
            } as Contract);
        }
        return this.graphqlService.subscriptionStateCids(contracts, states, func);
    }
    
}



module.exports = ContractWatcher;
