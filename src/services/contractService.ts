
import { getConnection } from 'typeorm';
import Contract from '../models/contract/contract';
import Event from '../models/contract/event';
import ContractRepository from '../repositories/contract/contractRepository';
import EventRepository from '../repositories/contract/eventRepository';

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

}
