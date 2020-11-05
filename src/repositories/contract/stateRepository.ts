import {EntityRepository, Repository} from 'typeorm';
import State from '../../models/contract/state';

@EntityRepository(State)
export default class StateRepository extends Repository<State> {

	public findAll(): Promise<State[]> {
		return this.find();
	}
}
