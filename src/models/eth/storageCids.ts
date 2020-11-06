import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import StateCids from "./stateCids";

@Index("storage_cids_pkey", ["id"], { unique: true })
@Index("storage_cids_state_id_storage_path_key", ["stateId", "storagePath"], {
	unique: true,
})
@Entity("storage_cids", { schema: "eth" })
export default class StorageCids {
	@PrimaryGeneratedColumn({ type: "integer", name: "id" })
	id: number;

	@Column("integer", { name: "state_id", unique: true })
	stateId: number;

	@Column("character varying", {
		name: "storage_leaf_key",
		nullable: true,
		length: 66,
	})
	storageLeafKey: string | null;

	@Column("text", { name: "cid" })
	cid: string;

	@Column("text", { name: "mh_key" })
	mhKey: string;

	@Column("bytea", { name: "storage_path", nullable: true, unique: true })
	storagePath: Buffer | null;

	@Column("integer", { name: "node_type" })
	nodeType: number;

	@Column("boolean", { name: "diff", default: () => "false" })
	diff: boolean;

	@ManyToOne(() => StateCids, (stateCids) => stateCids.storageCids, {
		onDelete: "CASCADE",
	})
	@JoinColumn([{ name: "state_id", referencedColumnName: "id" }])
	state: StateCids;
}
