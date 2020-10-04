import {EntityRepository, Repository} from 'typeorm';
import Method from '../../models/contract/method';

@EntityRepository(Method)
export default class MethodRepository extends Repository<Method> {

	public findAll(): Promise<Method[]> {
		return this.find();
	}
}
