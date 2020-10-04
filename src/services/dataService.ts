
import { getConnection, Table } from 'typeorm';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';

export default class DataService {

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async addEvent (eventId: number, contractId: number, data: { name: string; internalType: string; value: any }[], mhKey: string): Promise<void> {

		const tableName = `data.event_for_contract_id_${contractId}`;

		if (!data) {
			return;
		}

		const queryRunner = getConnection().createQueryRunner();
		const table = await queryRunner.getTable(tableName);

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

			data.forEach((line) => {
				tableOptions.columns.push({
					name: `data_${line.name.toLowerCase().trim()}`,
					type: 'text', // TODO: use line.type
				});
			});

			await queryRunner.createTable(new Table(tableOptions), true);
		}

		await queryRunner.query(`
			INSERT INTO ${tableName}
				(event_id, contract_id, mh_key, ${data.map((line) => 'data_' + line.name.toLowerCase().trim()).join(',')})
			VALUES
				(${eventId}, ${contractId}, '${mhKey}', ${data.map((line) => "'" + line.value + "'").join(',')});
		`);
	}

}
