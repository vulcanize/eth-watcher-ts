import {EntityRepository, Repository} from 'typeorm';
import Event from '../../models/contract/event';

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {

	public findAll(): Promise<Event[]> {
		return this.find();
	}
}
