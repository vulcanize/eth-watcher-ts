import {EntityRepository, QueryRunner} from 'typeorm';
import {ABIInputData} from "../../types";

@EntityRepository()
export default class EventRepository {
	private queryRunner: QueryRunner;

	constructor(queryRunner: QueryRunner) {
		this.queryRunner = queryRunner;
    }

	public async add(tableName: string, data: Array<ABIInputData & {isStrict?}>): Promise<number> {
		const sql = `INSERT INTO ${tableName}
		(${data.map((line) => line.isStrict ? line.name : 'data_' + line.name.toLowerCase().trim()).join(',')})
		VALUES
		('${data.map((line) => line.value.toString().replace(/\0/g, '')).join('\',\'')}') RETURNING id;`;

		console.log(sql);

		const res = await this.queryRunner.query(sql);
		if (!res) {
			return null;
		}

		return res[0].id;
	}
}
