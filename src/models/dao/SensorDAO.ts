import {Entity, Column, ManyToOne, PrimaryGeneratedColumn, OneToMany} from "typeorm";
import {IsNotEmpty, Matches, ValidateIf} from "class-validator";
import { GatewayDAO } from "./GatewayDAO";
import { MeasurementDAO } from "./MeasurementDAO";

@Entity("sensors")
export class SensorDAO {
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

    @Column({ nullable: true })
    variable: string;

    @Column({ nullable: true })
    unit: string;

    @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, {
        nullable: false, onDelete: "CASCADE"
    })
    gateway: GatewayDAO;

    @OneToMany(() => MeasurementDAO, (measurement) => measurement.sensor, {
        nullable: true, cascade: true, onDelete: "CASCADE"
    })
    measurements: MeasurementDAO[];
}