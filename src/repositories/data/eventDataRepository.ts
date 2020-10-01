import {EntityRepository, Repository} from 'typeorm';
import EventData from '../../models/data/eventData';

@EntityRepository(EventData)
export default class EventDataRepository extends Repository<EventData> {

	public add(eventId: number, contractId: number, data: object, mhKey: string): Promise<EventData> {
		return this.save({
			eventId,
			data,
			contractId,
			mhKey
		});
	}
}
