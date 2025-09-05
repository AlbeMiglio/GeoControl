import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { NetworkDAO } from "./NetworkDAO";
import { SensorDAO } from "./SensorDAO";
import {IsNotEmpty, IsString, Length, IsOptional, Matches, ValidateIf} from "class-validator";

@Entity("gateways")
export class GatewayDAO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  @IsNotEmpty({ message: "MAC address is required" })
  /*
  @Matches(/^([0-9A-Fa-f]{2})([-:])([0-9A-Fa-f]{2}\2){4}[0-9A-Fa-f]{2}$/, {
    message: 'Invalid MAC address format (Expected format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX with hexadecimal digits)'
  })
  */
  macAddress: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => NetworkDAO, (network) => network.gateways, {
    nullable: false, onDelete: "CASCADE"
  })
  network: NetworkDAO;

  @OneToMany(() => SensorDAO, (sensor) => sensor.gateway, {
    nullable: true, cascade: true, onDelete: "CASCADE"
  })
  sensors: SensorDAO[];
}