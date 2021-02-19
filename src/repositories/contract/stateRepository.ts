import {EntityRepository, Repository} from 'typeorm';
import State from '../../models/contract/state';

@EntityRepository(State)
export default class StateRepository extends Repository<State> {

	public async add({ slot, type, variable }): Promise<State> {
		const state = await this.findOne({
			where: {
				slot,
				type,
				variable,
			}
		});

		if (state) {
			return state;
		}

		return this.save({
			slot,
			type,
			variable,
		});
	}

	public findAll(): Promise<State[]> {
		return this.find();
	}
}
