import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import StateAccounts from "./stateAccounts";
import HeaderCids from "./headerCids";
import StorageCids from "./storageCids";

@Index("state_cids_header_id_state_path_key", ["headerId", "statePath"], {
	unique: true,
})
@Index("state_cids_pkey", ["id"], { unique: true })
@Entity("state_cids", { schema: "eth" })
export default class StateCids {
	@PrimaryGeneratedColumn({ type: "integer", name: "id" })
	id: number;

	@Column("integer", { name: "header_id", unique: true })
	headerId: number;

	@Column("character varying", {
		name: "state_leaf_key",
		nullable: true,
		length: 66,
	})
	stateLeafKey: string | null;

	@Column("text", { name: "cid" })
	cid: string;

	@Column("text", { name: "mh_key" })
	mhKey: string;

	@Column("bytea", { name: "state_path", nullable: true, unique: true })
	statePath: Buffer | null;

	@Column("integer", { name: "node_type" })
	nodeType: number;

	@Column("boolean", { name: "diff", default: () => "false" })
	diff: boolean;

	@OneToOne(() => StateAccounts, (stateAccounts) => stateAccounts.state)
	stateAccounts: StateAccounts;

	@ManyToOne(() => HeaderCids, (headerCids) => headerCids.stateCids, {
		onDelete: "CASCADE",
	})
	@JoinColumn([{ name: "header_id", referencedColumnName: "id" }])
	header: HeaderCids;

	@OneToMany(() => StorageCids, (storageCids) => storageCids.state)
	storageCids: StorageCids[];
}
