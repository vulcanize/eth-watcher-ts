import {EntityRepository, Repository} from 'typeorm';
import Event from '../../models/contract/event';

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {

	public async add({ name }): Promise<Event> {
		const event = await this.findOne({
			where: {
				name,
			}
		});

		if (event) {
			return event;
		}

		return this.save({
			name,
		});
	}

	public findAll(): Promise<Event[]> {
		return this.find();
	}
}
