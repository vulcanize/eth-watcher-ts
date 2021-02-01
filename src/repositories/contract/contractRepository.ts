import {EntityRepository, In, Repository} from 'typeorm';
import Contract from '../../models/contract/contract';

@EntityRepository(Contract)
export default class ContractRepository extends Repository<Contract> {

	public findAll(): Promise<Contract[]> {
		return this.find();
	}

	public findByIds(ids: number[]): Promise<Contract[]> {
		return this.find({
			where: {
				contractId: In(ids),
			}
		});
	}
}
