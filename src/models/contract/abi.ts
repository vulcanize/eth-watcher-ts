import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ContractToAbi } from "./contractToAbi";

@Index("abi_pk", ["abiId"], { unique: true })
@Entity("abi", { schema: "contract" })

export class Abi {
  @PrimaryGeneratedColumn({ type: "integer", name: "abi_id" })
  abiId: number;

  @Column("character varying", { name: "name" })
  name: string;

  @Column("jsonb", { name: "abi" })
  abi: object;

  @OneToMany(() => ContractToAbi, (contractToAbi) => contractToAbi.abi)
  contractToAbis: ContractToAbi[];
}
