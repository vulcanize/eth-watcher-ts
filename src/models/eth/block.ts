import {
	Column,
	Entity,
	Index,
	PrimaryColumn,
} from "typeorm";

@Index("block_pkey", ["key"], { unique: true })
@Entity("block", { schema: "eth" })
export default class Block {
	@PrimaryColumn({ type: "text", name: "key" })
	key: string;

	@Column("bytea", { name: "data" })
	data: string;
}
