import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { SensorDAO } from "./SensorDAO";

@Entity("measurements")
export class MeasurementDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "float", nullable: false })
    value: number;

    @Column({ type: "datetime", nullable: false })
    createdAt: Date;

    @ManyToOne(() => SensorDAO, (sensor) => sensor.measurements, {
        nullable: true, onDelete: "CASCADE"
    })
    sensor: SensorDAO;
}