import {EntityRepository, In, Repository} from 'typeorm';
import Contract from '../../models/contract/contract';

@EntityRepository(Contract)
export default class ContractRepository extends Repository<Contract> {

	public async add({ name, address, abi, startingBlock }): Promise<Contract> {
		const contract = await this.findOne({
			where: {
				address
			}
		});

		if (contract) {
			return contract;
		}

		return this.save({
			name,
			address,
			abi,
			startingBlock,
		});
	}

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
