import { PrimaryColumn, Column, Entity, Index } from "typeorm";

@Index("blocks_key_key", ["key"], { unique: true })
@Entity("blocks", { schema: "public" })
export default class Block {
	@PrimaryColumn("text", { name: "key", unique: true })
	key: string;

	@Column("bytea", { name: "data" })
	data: Buffer;
}
