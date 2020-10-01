
import { getConnection } from 'typeorm';
import EventData from '../models/data/eventData';
import EventDataRepository from '../repositories/data/eventDataRepository';

export default class DataService {

	public async addEvent (eventId: number, contractId: number, data: object, mhKey: string): Promise<EventData> {
		const eventDataRepository: EventDataRepository = getConnection().getCustomRepository(EventDataRepository);
		return eventDataRepository.add(eventId, contractId, data, mhKey);
	}

}
