import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("methods_pk", ["methodId"], { unique: true })
@Entity("methods", { schema: "contract" })

export default class Method {
	@PrimaryGeneratedColumn({ type: "integer", name: "method_id" })
	methodId: number;

	@Column("character varying", { name: "name" })
	name: string;
}
