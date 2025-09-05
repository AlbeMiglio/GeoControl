import {Between, In, LessThanOrEqual, MoreThanOrEqual, Repository} from "typeorm";
import {AppDataSource} from "@database";
import {MeasurementDAO} from "@dao/MeasurementDAO";
import {NetworkDAO} from "@dao/NetworkDAO";
import {GatewayDAO} from "@dao/GatewayDAO";
import {SensorDAO} from "@dao/SensorDAO";
import {findOrThrowNotFound, throwConflictIfFound} from "@utils";
import {Measurements as MeasurementsDTO} from "@dto/Measurements";
import {BadRequestError} from "@errors/BadRequestError";
import {isValid} from "date-fns";

export class MeasurementRepository {
    private repo: Repository<MeasurementDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementDAO);
    }

    // Retrieve measurements for a specific sensor
    async getMeasurementsBySensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        startDate?: Date,
        endDate?: Date): Promise<MeasurementDAO[]> {
        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        const network = findOrThrowNotFound(
            await networkRepo.find({where: {code: networkCode}}),
            () => true,
            `Network with code '${networkCode}' not found`
        );

        const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
        const gateway = findOrThrowNotFound(
            await gatewayRepo.find({where: {macAddress: gatewayMac, network: {id: network.id}}}),
            () => true,
            `Gateway with MAC address '${gatewayMac}' not found in network with code '${networkCode}'`
        );

        const sensorRepo = AppDataSource.getRepository(SensorDAO);
        const sensor = findOrThrowNotFound(
            await sensorRepo.find({
                where: {
                    macAddress: sensorMac,
                    gateway: {macAddress: gateway.macAddress, network: {id: network.id}}
                }
            }),
            () => true,
            `Sensor with MAC address '${sensorMac}' not found in gateway with MAC address '${gatewayMac}'`
        );

        const condition: any = {
            sensor: {
                macAddress: sensorMac,
                gateway: {
                    macAddress: gatewayMac,
                    network: {id: network.id}
                }
            }
        };

        if (startDate || endDate) {
            if (startDate && endDate) {
                if (!(startDate instanceof Date) || !isValid(startDate) || !(endDate instanceof Date) || !isValid(endDate)) {
                    throw new BadRequestError("request/query/startDate and request/query/endDate must match format 'date-time'");
                }
                condition.createdAt = Between(startDate, endDate);
            } else if (startDate) {
                if (!(startDate instanceof Date) || !isValid(startDate)) {
                    throw new BadRequestError("request/query/startDate must match format 'date-time'");
                }
                condition.createdAt = MoreThanOrEqual(startDate);
            } else {
                if (!(endDate instanceof Date) || !isValid(endDate)) {
                    throw new BadRequestError("request/query/endDate must match format 'date-time'");
                }
                condition.createdAt = LessThanOrEqual(endDate);
            }
        }

        return this.repo.find({where: condition});
    }

    // Retrieve measurements for a set of sensors of a specific network, with sensors and measurements included
    async getMeasurementsBySensors(
        networkCode: string,
        sensorMacs?: string[],
        startDate?: Date,
        endDate?: Date
    ): Promise<SensorDAO[]> {
        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        findOrThrowNotFound(
            await networkRepo.find({ where: { code: networkCode } }),
            () => true,
            `Network con code='${networkCode}' non trovata`
        );

        const sensorRepo = AppDataSource.getRepository(SensorDAO);
        const qbBase = sensorRepo
            .createQueryBuilder("sensor")
            .innerJoin("sensor.gateway", "gateway")
            .innerJoin("gateway.network", "network", "network.code = :networkCode", {
                networkCode,
            });

        if (sensorMacs && sensorMacs.length > 0) {
            qbBase.andWhere("sensor.macAddress IN (:...sensorMacs)", { sensorMacs });
        }

        if (startDate || endDate) {
            if (startDate && endDate) {
                if (
                    !(startDate instanceof Date) ||
                    !isValid(startDate) ||
                    !(endDate instanceof Date) ||
                    !isValid(endDate)
                ) {
                    throw new BadRequestError(
                        "startDate e endDate devono essere date valide in ISO 8601"
                    );
                }
                qbBase.leftJoinAndSelect(
                    "sensor.measurements",
                    "measurement",
                    "measurement.createdAt BETWEEN :start AND :end",
                    { start: startDate, end: endDate }
                );
            } else if (startDate) {
                if (!(startDate instanceof Date) || !isValid(startDate)) {
                    throw new BadRequestError(
                        "startDate deve essere una data valida in ISO 8601"
                    );
                }
                qbBase.leftJoinAndSelect(
                    "sensor.measurements",
                    "measurement",
                    "measurement.createdAt >= :startDate",
                    { startDate }
                );
            } else {
                if (!(endDate instanceof Date) || !isValid(endDate)) {
                    throw new BadRequestError(
                        "endDate deve essere una data valida in ISO 8601"
                    );
                }
                qbBase.leftJoinAndSelect(
                    "sensor.measurements",
                    "measurement",
                    "measurement.createdAt <= :endDate",
                    { endDate }
                );
            }
        } else {
            qbBase.leftJoinAndSelect("sensor.measurements", "measurement");
        }

        qbBase.orderBy("sensor.id", "ASC").addOrderBy("measurement.createdAt", "ASC");
        return qbBase.getMany();
    }

    // Store measurements for a sensor
    async storeMeasurements(
        measurements: MeasurementsDTO,
        networkCode: string,
        gatewayMac: string,
        sensorMac: string): Promise<MeasurementDAO[]> {
        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        const network = findOrThrowNotFound(
            await networkRepo.find({ where: { code: networkCode } }),
            () => true,
            `Network with code '${networkCode}' not found`
        );

        const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
        const gateway = findOrThrowNotFound(
            await gatewayRepo.find({ where: { macAddress: gatewayMac, network: { id: network.id } } }),
            () => true,
            `Gateway with MAC address '${gatewayMac}' not found in network with code '${networkCode}'`
        );

        const sensorRepo = AppDataSource.getRepository(SensorDAO);
        const sensor = findOrThrowNotFound(
            await sensorRepo.find({ where: { macAddress: sensorMac, gateway: { macAddress : gateway.macAddress, network: { id: network.id } } } }),
            () => true,
            `Sensor with MAC address '${sensorMac}' not found in gateway with MAC address '${gatewayMac}'`
        );

        const newMeasurements: MeasurementDAO[] = [];

        for (const m of measurements.measurements) {
            const value = m.value;
            const createdAt = m.createdAt;

            if (value === undefined || value === null) {
                throw new BadRequestError("'/body/value' must have required property 'value'");
            }
            if (isNaN(value)) {
                throw new BadRequestError("'/body/value' must be a finite valid number");
            }
            if (!createdAt) {
                throw new BadRequestError("'/body/createdAt' must have required property 'createdAt'");
            }
            if (!(createdAt instanceof Date) || !isValid(createdAt)) {
                throw new BadRequestError("'/body/createdAt' must be a valid date in ISO 8601 format");
            }

            throwConflictIfFound(
                await this.repo.find({ where: { sensor, value, createdAt } }),
                () => true,
                `Measurement with value '${value}' and created at '${createdAt}' already exists in sensor with MAC address '${sensorMac}'`
            );

            newMeasurements.push(this.repo.create({ value, createdAt, sensor }));
        }

        return this.repo.save(newMeasurements);
    }
}