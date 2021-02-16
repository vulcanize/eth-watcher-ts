import {EntityRepository, Repository} from 'typeorm';
import MethodProgress from '../../models/data/methodProgress';

@EntityRepository(MethodProgress)
export default class MethodProgressRepository extends Repository<MethodProgress> {

	public async add(contractId: number, methodId: number, blockNumber: number): Promise<MethodProgress> {
		return this.save({
			contractId,
			methodId,
			blockNumber,
		});
	}

	public async isSync(contractId: number, methodId: number, blockNumber: number): Promise<boolean> {
		const item = await this.findOne({
			contractId,
			methodId,
			blockNumber,
		});

		if (item) {
			return true;
		}

		return false;
	}

	public async findSyncedBlocks(contractId: number, methodId: number, offset = 0, limit = 1000): Promise<MethodProgress[]> {
		const query = this.createQueryBuilder('method_progress')
			.where(`contract_id=${contractId}`)
			.andWhere(`method_id=${methodId}`)
			.orderBy({
				'method_progress.method_progress_id': 'ASC',
			})
			.take(limit)
			.offset(offset);

		return query.getMany();
	}

}
