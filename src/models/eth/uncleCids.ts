import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import HeaderCids from "./headerCids";

@Index("uncle_cids_header_id_block_hash_key", ["blockHash", "headerId"], {
	unique: true,
})
@Index("uncle_cids_pkey", ["id"], { unique: true })
@Entity("uncle_cids", { schema: "eth" })
export default class UncleCids {
	@PrimaryGeneratedColumn({ type: "integer", name: "id" })
	id: number;

	@Column("integer", { name: "header_id", unique: true })
	headerId: number;

	@Column("character varying", { name: "block_hash", unique: true, length: 66 })
	blockHash: string;

	@Column("character varying", { name: "parent_hash", length: 66 })
	parentHash: string;

	@Column("text", { name: "cid" })
	cid: string;

	@Column("text", { name: "mh_key" })
	mhKey: string;

	@Column("numeric", { name: "reward" })
	reward: string;

	@ManyToOne(() => HeaderCids, (headerCids) => headerCids.uncleCids, {
		onDelete: "CASCADE",
	})
	@JoinColumn([{ name: "header_id", referencedColumnName: "id" }])
	header: HeaderCids;
}
