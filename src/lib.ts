import GraphqlService from "./services/graphqlService";
import GraphqlClient from "./graphqlClient";
import Contract from "./models/contract/contract";
import State from "./models/contract/state";
import Event from "./models/contract/event";
import { ABI } from "./types";

type ContractConfig = {
	address: string;
    events?: Event[];
    abi?: ABI;
    states?: State[];
};

class ContractWatcher  {
    private graphqlService: GraphqlService;

    public constructor(url: string) {
        const graphqlClient = new GraphqlClient(url, null);
        this.graphqlService = new GraphqlService(graphqlClient);
    }

    public async ethHeaderCidById(block: number): Promise<unknown> {
        return this.graphqlService.ethHeaderCidById(block);
    }

    public async subscriptionHeaderCids(func: (value) => void): Promise<void> {
        return this.graphqlService.subscriptionHeaderCids(func);
    }

    public async subscriptionReceiptCids(contractConfigs: ContractConfig[], func: (value) => void): Promise<void> {
        const contracts: Contract[] = [];
        const events: Event[] = [];
        let eventId = 1;

        for(const c of contractConfigs) {
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

    public async subscriptionStateCids(contractConfigs: ContractConfig[], func: (value) => void): Promise<void> {
        const contracts: Contract[] = [];
        const states: State[] = [];
        let stateId = 1;

        for(const c of contractConfigs) {
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
