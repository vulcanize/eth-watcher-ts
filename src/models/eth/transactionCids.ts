import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import ReceiptCids from "./receiptCids";
import HeaderCids from "./headerCids";
import Block from "./block";

@Index("transaction_cids_header_id_tx_hash_key", ["headerId", "txHash"], {
	unique: true,
})
@Index("transaction_cids_pkey", ["id"], { unique: true })
@Entity("transaction_cids", { schema: "eth" })
export default class TransactionCids {
	@PrimaryGeneratedColumn({ type: "integer", name: "id" })
	id: number;

	@Column("integer", { name: "header_id", unique: true })
	headerId: number;

	@Column("character varying", { name: "tx_hash", unique: true, length: 66 })
	txHash: string;

	@Column("integer", { name: "index" })
	index: number;

	@Column("text", { name: "cid" })
	cid: string;

	@Column("text", { name: "mh_key" })
	mhKey: string;

	@OneToOne(() => Block, (block) => block.key)
	@JoinColumn([{ name: "mh_key", referencedColumnName: "key" }])
	block: Block;

	@Column("character varying", { name: "dst", length: 66 })
	dst: string;

	@Column("character varying", { name: "src", length: 66 })
	src: string;

	@Column("bytea", { name: "tx_data", nullable: true })
	txData: Buffer | null;

	@OneToOne(() => ReceiptCids, (receiptCids) => receiptCids.tx)
	receiptCids: ReceiptCids;

	@ManyToOne(() => HeaderCids, (headerCids) => headerCids.transactionCids, {
		onDelete: "CASCADE",
	})
	@JoinColumn([{ name: "header_id", referencedColumnName: "id" }])
	header: HeaderCids;
}
