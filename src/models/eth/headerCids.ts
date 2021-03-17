import {
	Column,
	Entity,
	Index, JoinColumn,
	OneToMany, OneToOne,
	PrimaryGeneratedColumn, Unique,
} from "typeorm";
import StateCids from "./stateCids";
import TransactionCids from "./transactionCids";
import UncleCids from "./uncleCids";
import Block from "./block";

@Index(
	"header_cids_block_number_block_hash_key",
	["blockHash", "blockNumber"],
	{ unique: true }
)
@Index("header_cids_pkey", ["id"], { unique: true })
@Entity("header_cids", { schema: "eth" })
@Unique(["blockNumber", "blockHash"])
export default class HeaderCids {
	@PrimaryGeneratedColumn({ type: "integer", name: "id" })
	id: number;

	@Column("bigint", { name: "block_number", unique: true })
	blockNumber: string;

	@Column("character varying", { name: "block_hash", unique: true, length: 66 })
	blockHash: string;

	@Column("character varying", { name: "parent_hash", length: 66 })
	parentHash: string;

	@Column("text", { name: "cid" })
	cid: string;

	@Column("text", { name: "mh_key" })
	mhKey: string;

	@OneToOne(() => Block, (block) => block.key)
	@JoinColumn([{ name: "mh_key", referencedColumnName: "key" }])
	block: Block;

	@Column("numeric", { name: "td" })
	td: string;

	@Column("integer", { name: "node_id" })
	nodeId: number;

	@Column("numeric", { name: "reward" })
	reward: string;

	@Column("character varying", { name: "state_root", length: 66 })
	stateRoot: string;

	@Column("character varying", { name: "tx_root", length: 66 })
	txRoot: string;

	@Column("character varying", { name: "receipt_root", length: 66 })
	receiptRoot: string;

	@Column("character varying", { name: "uncle_root", length: 66 })
	uncleRoot: string;

	@Column("bytea", { name: "bloom" })
	bloom: Buffer;

	@Column("numeric", { name: "timestamp" })
	timestamp: string;

	@Column("integer", { name: "times_validated", default: () => "1" })
	timesValidated: number;

	@OneToMany(() => StateCids, (stateCids) => stateCids.header)
	stateCids: StateCids[];

	@OneToMany(() => TransactionCids, (transactionCids) => transactionCids.header)
	transactionCids: TransactionCids[];

	@OneToMany(() => UncleCids, (uncleCids) => uncleCids.header)
	uncleCids: UncleCids[];
}
