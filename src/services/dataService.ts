
import to from 'await-to-js';
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
					type: this._getPgType(line.internalType),
					isNullable: true,
				});
			});

			await queryRunner.createTable(new Table(tableOptions), true);
		}

		const sql = `INSERT INTO ${tableName}
(event_id, contract_id, mh_key, ${data.map((line) => 'data_' + line.name.toLowerCase().trim()).join(',')})
VALUES
(${eventId}, ${contractId}, '${mhKey}', '${data.map((line) => line.value.toString().replace(/\0/g, '')).join('\',\'')}');`;

		console.log(sql);

		const [err] = await to(queryRunner.query(sql));
		if (err) {
			console.log(err);	
		}
	}

	private _getPgType(abiType: string): string {
		let pgType = 'TEXT';

		// Fill in pg type based on abi type
		switch (abiType.replace(/\d+/g, '')) {
			case 'address':
				pgType = 'CHARACTER VARYING(66)';
				break;
			case 'int':
			case 'uint':
				pgType = 'NUMERIC';
				break;
			case 'bool':
				pgType = 'BOOLEAN';
				break;
			case 'bytes':
				pgType = "BYTEA";
				break;
			// case abi.ArrayTy:
			// 	pgType = "TEXT[]";
			// 	break;
			// case abi.FixedPointTy:
			// 	pgType = "MONEY" // use shopspring/decimal for fixed point numbers in go and money type in postgres?
			// 	break;
			default:
				pgType = "TEXT";
		}

		return pgType;
	}

}
