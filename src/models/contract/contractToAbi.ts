import {
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Abi } from "./abi";
import Contract from "./contract";

@Index("contract_to_abi_pk", ["contractToAbiId"], { unique: true })
@Entity("contract_to_abi", { schema: "contract" })

export class ContractToAbi {
  @PrimaryGeneratedColumn({ type: "integer", name: "contract_to_abi_id" })
  contractToAbiId: number;

  @ManyToOne(() => Abi, (abi) => abi.contractToAbis)
  @JoinColumn([{ name: "abi_id", referencedColumnName: "abiId" }])
  abi: Abi;

  @ManyToOne(() => Contract)
  @JoinColumn([{ name: "contract_id", referencedColumnName: "contractId" }])
  contract: Contract;
}
