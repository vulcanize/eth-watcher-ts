import {EntityRepository, Repository} from 'typeorm';
import BackfillProgress from '../../models/data/backfillProgress';

@EntityRepository(BackfillProgress)
export default class BackfillProgressRepository extends Repository<BackfillProgress> {

	public async getProgress(contractId: number): Promise<number> {
		const item = await this.findOne({
			contractId,
		});

		return item?.current || 0;
	}

	public async startProgress(contractId: number, total: number): Promise<BackfillProgress> {
		const item = await this.findOne({
			contractId,
		});

		return this.save({
			backfillProgressId: item?.backfillProgressId,
			contractId,
			current: 0,
			total,
		});
	}

	public async updateProgress(contractId: number, current: number): Promise<unknown> {
		return this.update({
			contractId
		}, {
			current,
		});
	}

}
