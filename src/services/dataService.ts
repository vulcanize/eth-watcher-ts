
import to from 'await-to-js';
import { getConnection, Table } from 'typeorm';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';
import * as abi from 'ethereumjs-abi';
import { keccak256, rlp } from 'ethereumjs-util'
import Store from '../store';
import Event from '../models/contract/event';
import ProgressRepository from '../repositories/data/progressRepository';

export default class DataService {

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async addEvent (eventId: number, contractId: number, data: { name: string; internalType: string; value: any }[], mhKey: string, blockNumber: number): Promise<void> {

		const tableName = `data.event_for_contract_id_${contractId}`;

		if (!data) {
			return;
		}

		return getConnection().transaction(async (entityManager) => {

			const progressRepository: ProgressRepository = entityManager.getCustomRepository(ProgressRepository);

			const table = await entityManager.queryRunner.getTable(tableName);

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

				await entityManager.queryRunner.createTable(new Table(tableOptions), true);
			}

			const sql = `INSERT INTO ${tableName}
(event_id, contract_id, mh_key, ${data.map((line) => 'data_' + line.name.toLowerCase().trim()).join(',')})
VALUES
(${eventId}, ${contractId}, '${mhKey}', '${data.map((line) => line.value.toString().replace(/\0/g, '')).join('\',\'')}');`;

			console.log(sql);

			const [err] = await to(entityManager.queryRunner.query(sql));
			if (err) {
				// TODO: throw err
				console.log(err);	
			}

			await progressRepository.add(contractId, eventId, blockNumber);
		});
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

	public async processEvent(relatedNode): Promise<void> {

		if (!relatedNode || !relatedNode.logContracts || !relatedNode.logContracts.length) {
			// TODO: mark as done?
			return;
		}

		const target = Store.getStore().getContracts().find((contract) => contract.address === relatedNode.logContracts[0]);
		if (!target) {
			return;
		}

		const events: Event[] = Store.getStore().getEvents();
		for (const e of events) {
			const contractAbi = target.abi as Array<{ name: string; type: string; inputs: { name; type; indexed; internalType }[] }>;
			const event = contractAbi.find((a) => a.name === e.name);

			if (!event) {
				continue;
			}

			const payload = `${event.name}(${event.inputs.map(input => input.internalType).join(',')})`;
			const hash = '0x' + keccak256(Buffer.from(payload)).toString('hex');

			console.log('payload', payload);
			console.log('hash', hash);

			if (relatedNode.topic0S && relatedNode.topic0S.length && (relatedNode.topic0S as Array<string>).includes(hash)) {
				const index = (relatedNode.topic0S as Array<string>).findIndex((topic) => topic === hash);

				if (relatedNode.blockByMhKey && relatedNode.blockByMhKey.data) {
					const buffer = Buffer.from(relatedNode.blockByMhKey.data.replace('\\x',''), 'hex');
					const decoded: any = rlp.decode(buffer); // eslint-disable-line

					// console.log(decoded[0].toString('hex'));
					// console.log(decoded[1].toString('hex'));
					// console.log(decoded[2].toString('hex'));

					const addressFromBlock = decoded[3][index][0].toString('hex');
					console.log('address', addressFromBlock);

					const hashFromBlock = decoded[3][index][1][0].toString('hex');
					console.log(hashFromBlock);

					const notIndexedEvents = event.inputs.filter(input => !input.indexed);
					const indexedEvents = event.inputs.filter(input => input.indexed);

					const messages = abi.rawDecode(notIndexedEvents.map(input => input.internalType), decoded[3][index][2]);

					const array = [];
					indexedEvents.forEach((event, index) => {
						const topic = relatedNode[`topic${index + 1}S`][0].replace('0x','');

						try {
							array.push({
								name: event.name,
								value: abi.rawDecode([ event.internalType ], Buffer.from(topic, 'hex'))[0],
								internalType: event.internalType,
							});
						} catch (e) {
							console.log('Error wtih', event.name, event.internalType, e.message);
						}
					});
			
					notIndexedEvents.forEach((event, index) => {
						array.push({
							name: event.name,
							value: messages[index],
							internalType: event.internalType,
						});
					});

					await this.addEvent(
						e.eventId,
						target.contractId,
						array,
						relatedNode.mhKey,
						relatedNode.ethTransactionCidByTxId.ethHeaderCidByHeaderId.blockNumber
					);
					console.log('Event saved');
				}
			}
		}
	}

}
