
import { getConnection, Table } from 'typeorm';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';

export default class DataService {

	public async addEvent (eventId: number, contractId: number, data: object, mhKey: string): Promise<void> {

		// TODO: use custom name and data fields
		const tableName = 'data.contract_1';

		const queryRunner = getConnection().createQueryRunner();
		const table = await queryRunner.getTable("data.contract_1");

		if (!table) {
			const tableOptions: TableOptions = {
				name: tableName,
				columns: [
					{
						name: 'event_data_id',
						type: 'integer',
						isPrimary: true,
						isGenerated: true,
						generationStrategy: "increment"
					},{
						name: 'event_id',
						type: 'integer',
					}, {
						name: 'contract_id',
						type: 'integer',
					}, {
						name: 'mh_key',
						type: 'text',
					},
				]
			};

			await queryRunner.createTable(new Table(tableOptions), true);
		}

		await queryRunner.query(`
			INSERT INTO ${tableName}
				(event_id, contract_id, mh_key)
			VALUES
				(${eventId}, ${contractId}, '${mhKey}');
		`);
	}

}
