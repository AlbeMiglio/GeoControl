import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsNotEmpty, Matches, ValidateIf } from "class-validator";
import { GatewayDAO } from "./GatewayDAO";

@Entity("networks")
export class NetworkDAO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false , unique: true })
  @IsNotEmpty({ message: "Code is required" })
  @Matches(/^[a-zA-Z0-9]+$/, { message: "Code must contain only alphanumeric characters" })
  code: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => GatewayDAO, (gateway) => gateway.network, {
    nullable: true, cascade: true, onDelete: "CASCADE"
  })
  gateways: GatewayDAO[];
}
