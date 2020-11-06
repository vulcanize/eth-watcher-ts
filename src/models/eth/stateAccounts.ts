import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import StateCids from "./stateCids";

@Index("state_accounts_pkey", ["id"], { unique: true })
@Index("state_accounts_state_id_key", ["stateId"], { unique: true })
@Entity("state_accounts", { schema: "eth" })
export default class StateAccounts {
	@PrimaryGeneratedColumn({ type: "integer", name: "id" })
	id: number;

	@Column("integer", { name: "state_id", unique: true })
	stateId: number;

	@Column("numeric", { name: "balance" })
	balance: string;

	@Column("integer", { name: "nonce" })
	nonce: number;

	@Column("bytea", { name: "code_hash" })
	codeHash: Buffer;

	@Column("character varying", { name: "storage_root", length: 66 })
	storageRoot: string;

	@OneToOne(() => StateCids, (stateCids) => stateCids.stateAccounts, {
		onDelete: "CASCADE",
	})
	@JoinColumn([{ name: "state_id", referencedColumnName: "id" }])
	state: StateCids;
}
