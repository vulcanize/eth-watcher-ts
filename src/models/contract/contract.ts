import {Column, Entity, Index, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {ABI} from "../../types";
import { Abi as AbiTable } from "./abi";
import {ContractToAbi} from "../../../output/entities/ContractToAbi";

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

	@Column("int4", { name: "abis", nullable: true, array: true })
	abis: number[] | null;

	@Column("integer", { name: "starting_block" })
	startingBlock: number;

	@ManyToMany(() => AbiTable)
	@JoinTable({name: "contract_to_abi", joinColumn: {name: "contract_id"}, inverseJoinColumn: {name: "abi_id"}})
	allAbis: ABI[];

	//@OneToMany(() => ContractToAbi, (contractToAbi) => contractToAbi.contract)
	//contractToAbis: ContractToAbi[];
}
