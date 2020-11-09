import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("contracts_pk", ["contractId"], { unique: true })
@Entity("contracts", { schema: "contract" })

export default class Contract {
	@PrimaryGeneratedColumn({ type: "integer", name: "contract_id" })
	contractId: number;

	@Column("character varying", { name: "name" })
	name: string;

	@Column("character varying", { name: "address" })
	address: string;

	@Column("jsonb", { name: "abi" })
	abi: object;

	@Column("int4", { name: "events", nullable: true, array: true })
	events: number[] | null;

	@Column("int4", { name: "methods", nullable: true, array: true })
	methods: number[] | null;

	@Column("int4", { name: "states", nullable: true, array: true })
	states: number[] | null;

	@Column("integer", { name: "starting_block" })
	startingBlock: number;

	// TODO: add to db
	addressHash: string;
}
