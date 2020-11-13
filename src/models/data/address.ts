import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("addresses_pk", ["addressId"], { unique: true })
@Entity("addresses", { schema: "data" })

export default class Address {
	@PrimaryGeneratedColumn({ type: "integer", name: "address_id" })
	addressId: number;

	@Column("character varying", { name: "address" })
	address: string;

	@Column("character varying", { name: "hash" })
	hash: string;
}
