import {EntityRepository, Repository} from 'typeorm';
import Contract from '../../models/contract/contract';

@EntityRepository(Contract)
export default class ContractRepository extends Repository<Contract> {

	public findAll(): Promise<Contract[]> {
		return this.find();
	}
}
