import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("states_pk", ["stateId"], { unique: true })
@Entity("state", { schema: "contract" })

export default class State {
	@PrimaryGeneratedColumn({ type: "integer", name: "state_id" })
	stateId: number;

	@Column("integer", { name: "slot" })
	slot: number;

	@Column("character varying", { name: "type" })
	type: string;

	@Column("character varying", { name: "variable" })
	variable: string;
}
