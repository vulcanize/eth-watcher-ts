import Contract from "./models/contract/contract";
import Event from "./models/contract/event";
import Method from "./models/contract/method";
import State from "./models/contract/state";
import Address from "./models/data/address";
import ContractService from "./services/contractService";
import DataService from "./services/dataService";
import env from './env';

export default class Store {
	private static store: Store;

	private contracts: Contract[];
	private events: Event[];
	private methods: Method[];
	private states: State[];
	private addresses: Address[]; // TODO: do not store addresses in memory

	private contractService: ContractService;
	private dataService: DataService;

	private constructor() {
		this.contractService = new ContractService();
		this.dataService = new DataService();

		this.contracts = [];
		this.events = [];
		this.methods = [];
		this.states = [];
		this.addresses = [];
	}

	public static getStore(): Store {
		if (!Store.store) {
			Store.store = new Store();
		}

		return Store.store;
	}

	public static init(autoUpdate = true): void {
		const store = this.getStore();

		store.syncData();
		if (autoUpdate) {
			setInterval(store.syncData, env.CONFIG_RELOAD_INTERVAL);
		}
	}

	public getContracts(): Contract[] {
		return this.contracts;
	}

	// TODO: move to repository and make sql request
	public getContractByAddressHash(hash: string): Contract {
		const address = this.getAddressByHash(hash);
		if (!address) {
			return null;
		}

		return (this.contracts || []).find((contract) => contract.address === address.address);
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

	public getStates(): State[] {
		return this.states;
	}

	public getStatesByContractId(contractId: number): State[] {
		const contract = (this.contracts || []).find((contract) => contract.contractId === contractId);
		if (!contract || !contract.states) {
			return [];
		}

		return (this.states || []).filter((state) => contract.states.includes(state.stateId));
	}

	public getAddresses(): Address[] {
		return this.addresses;
	}

	public getAddressById(addressId: number): Address {
		return (this.addresses || []).find((a) => a.addressId === addressId);
	}

	public getAddress(addressString: string): Address {
		return (this.addresses || []).find((a) => a.address === addressString);
	}

	public getAddressByHash(hash: string): Address {
		return (this.addresses || []).find((a) => a.hash === hash);
	}

	public addAddress(address: Address): void {
		this.addresses.push(address);
	}

	public add(address: Address): void {
		this.addresses.push(address);
	}

	public async syncData(contractIds?: number[]): Promise<void> {
		[Store.store.contracts, Store.store.events, Store.store.methods, Store.store.states, Store.store.addresses] = await Promise.all([
			Store.store.contractService?.loadContracts(contractIds),
			Store.store.contractService?.loadEvents(),
			Store.store.contractService?.loadMethods(),
			Store.store.contractService?.loadStates(),
			Store.store.contractService?.loadAddresses(),
		]);

		await Store.store.dataService?.createTables(Store.store.contracts);
		await Store.store.dataService?.prepareAddresses(Store.store.contracts);

		// console.log(`Contracts: \t${Store.store.contracts?.length}`);
		// console.log(`Events: \t${Store.store.events?.length}`);
		// console.log(`Methods: \t${Store.store.methods?.length}`);
		// console.log(`States: \t${Store.store.states?.length}`);
		// console.log(`Addresses: \t${Store.store.addresses?.length}`);
	}

}