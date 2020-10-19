
import { getConnection } from 'typeorm';
import Contract from '../models/contract/contract';
import Event from '../models/contract/event';
import Method from '../models/contract/method';
import ContractRepository from '../repositories/contract/contractRepository';
import EventRepository from '../repositories/contract/eventRepository';
import MethodRepository from '../repositories/contract/methodRepository';

export default class ContractService {

	public async loadContracts (): Promise<Contract[]> {
		const contractRepository: ContractRepository = getConnection().getCustomRepository(ContractRepository);
		const contracts = await contractRepository.findAll();

		return contracts;
	}

	public async loadEvents (): Promise<Event[]> {
		const eventRepository: EventRepository = getConnection().getCustomRepository(EventRepository);
		const events = await eventRepository.findAll();

		return events;
	}

	public async loadMethods (): Promise<Method[]> {
		const methodRepository: MethodRepository = getConnection().getCustomRepository(MethodRepository);
		const methods = await methodRepository.findAll();

		return methods;
	}

}
