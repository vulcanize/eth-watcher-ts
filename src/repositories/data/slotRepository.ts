import {EntityRepository, QueryRunner} from 'typeorm';

@EntityRepository()
export default class SlotRepository {
	private queryRunner: QueryRunner;

	constructor(queryRunner: QueryRunner) {
		this.queryRunner = queryRunner;
    }

	public async add(tableName: string, name: string[], value): Promise<number> {
		const sql = `INSERT INTO ${tableName} (${name.join(',')}) VALUES ('${value.map((v) => v.toString().replace(/\0/g, '')).join('\',\'')}') RETURNING id;`;
		console.log(sql);

		const res = await this.queryRunner.query(sql);
		if (!res) {
			return null;
		}

		return res[0].id;
	}
}
