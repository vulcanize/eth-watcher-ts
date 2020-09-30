import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("node_uc", ["genesisBlock", "networkId", "nodeId"], { unique: true })
@Index("nodes_pkey", ["id"], { unique: true })
@Entity("nodes", { schema: "public" })
export default class Node {
	@PrimaryGeneratedColumn({ type: "integer", name: "id" })
	id: number;

	@Column("character varying", { name: "client_name", nullable: true })
	clientName: string | null;

	@Column("character varying", {
		name: "genesis_block",
		nullable: true,
		unique: true,
		length: 66,
	})
	genesisBlock: string | null;

	@Column("character varying", {
		name: "network_id",
		nullable: true,
		unique: true,
	})
	networkId: string | null;

	@Column("character varying", {
		name: "node_id",
		nullable: true,
		unique: true,
		length: 128,
	})
	nodeId: string | null;
}
