import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Index(
	"header_block_number_block_hash_key",
	["blockHash", "blockNumber"],
	{ unique: true }
)
@Index("header_pkey", ["id"], { unique: true })
@Entity("header", { schema: "data" })
export default class Header {
	@PrimaryColumn({ type: "integer", name: "id" })
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

	@Column("numeric", { name: "td" })
	td: string;

	@Column("character varying", { name: "node_id", length: 128 })
	nodeId: string | null;

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

	@Column("integer", { name: "eth_node_id", nullable: true })
	ethNodeId: number;
}
