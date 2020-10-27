import Contract from "./models/contract/contract";
import Event from "./models/contract/event";
import Method from "./models/contract/method";
import ContractService from "./services/contractService";
import DataService from "./services/dataService";

import env from './env';

const contractService = new ContractService();
const dataService = new DataService();

export default class Store {
	private static store: Store;

	private contracts: Contract[];
	private events: Event[];
	private methods: Method[];

	private constructor() {
		this.contracts = [];
		this.events = [];
		this.methods = [];
	}

	public static getStore(): Store {
		if (!Store.store) {
			Store.store = new Store();
		}

		return Store.store;
	}
	
	public static init(autoUpdate = true): void {
		const store = this.getStore();

		Store.store.syncData();
		if (autoUpdate) {
			setInterval(store.syncData, env.CONFIG_RELOAD_INTERVAL);
		}
	}

	public getContracts(): Contract[] {
		return this.contracts;
	}

	public getEvents(): Event[] {
		return this.events;
	}

	public getEventsByContractId(contractId: number): Event[] {
		const contract = (this.contracts || []).find((contract) => contract.contractId === contractId);
		if (!contract || !contract.events) {
			return [];
		}

		return (this.events || []).filter((event) => contract.events.includes(event.eventId));
	}

	public getMethods(): Method[] {
		return this.methods;
	}

	public async syncData(): Promise<void> {
		[this.contracts, this.events, this.methods] = await Promise.all([
			contractService.loadContracts(),
			contractService.loadEvents(),
			contractService.loadMethods()
		])

		await dataService.createTables(this.contracts);

		console.log(`Loaded ${this.contracts.length} contracts config and ${this.events.length} events and ${this.methods.length} methods`);
	}

}