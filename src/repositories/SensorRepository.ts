import {Repository} from "typeorm";
import {SensorDAO} from "@dao/SensorDAO";
import {AppDataSource} from "@database";
import {GatewayDAO} from "@dao/GatewayDAO";
import {NetworkDAO} from "@dao/NetworkDAO";
import {findOrThrowNotFound, throwConflictIfFound} from "@utils";
import {validate} from "class-validator";
import {BadRequestError} from "@errors/BadRequestError";

export class SensorRepository {
    private repo: Repository<SensorDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(SensorDAO);
    }

    async getAllSensorsByGateway(networkCode: string, gatewayMac: string): Promise<SensorDAO[]> {
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

        return this.repo.find({ where: { gateway: { macAddress: gatewayMac, network: { id: network.id } } } });
    }

    async createSensor(
        macAddress: string,
        name: string,
        description: string,
        variable: string,
        unit: string,
        networkCode: string,
        gatewayMac: string
    ): Promise<SensorDAO> {
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

        const sensorEntity = this.repo.create({
            macAddress,
            name,
            description,
            variable,
            unit,
            gateway
        });

        const errors = await validate(sensorEntity);
        if (errors.length > 0) {
            const errorMessages = errors
                .map(error => Object.values(error.constraints || {}).join(", "))
                .join("; ");
            throw new BadRequestError(`Invalid sensor data: '${errorMessages}'`);
        }

        throwConflictIfFound(
            await this.repo.find({ where: { macAddress, gateway: { macAddress: gateway.macAddress, network : { id : network.id } } } }),
            () => true,
            `Gateway with MAC address '${macAddress}' already exists`
        );

        return this.repo.save(sensorEntity);
    }

    async getSensorByMacAddress(macAddress: string, networkCode: string, gatewayMac: string): Promise<SensorDAO> {
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

        return findOrThrowNotFound(
            await this.repo.find({ where: { macAddress, gateway: { macAddress: gateway.macAddress } } }),
            () => true,
            `Sensor with Mac Address '${macAddress}' not found in gateway with MAC address '${gatewayMac}'`
        );
    }

    async updateSensor(
        macAddress: string,
        new_macAddress: string,
        name: string,
        description: string,
        variable: string,
        unit: string,
        networkCode: string,
        gatewayMac: string
    ): Promise<SensorDAO> {
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

        if (new_macAddress !== macAddress && new_macAddress != undefined) {
            const conflict = await this.repo.find({
                where: {
                    macAddress: new_macAddress,
                    gateway: { macAddress: gateway.macAddress }
                }
            });

            throwConflictIfFound(
                conflict,
                () => true,
                `Sensor with MacAddress '${new_macAddress}' already in use`
            );
        }

        const sensorDAO = await this.getSensorByMacAddress(macAddress, networkCode, gatewayMac);

        if (new_macAddress === undefined && name === undefined && description === undefined && variable === undefined && unit === undefined) {
            throw new BadRequestError(`Invalid sensor update`);
        }

        if (new_macAddress !== undefined && new_macAddress.trim() !== "") {
            sensorDAO.macAddress = new_macAddress;
        }
        if (name !== undefined) {
            sensorDAO.name = name;
        }
        if (description !== undefined) {
            sensorDAO.description = description;
        }
        if (variable !== undefined) {
            sensorDAO.variable = variable;
        }
        if (unit !== undefined) {
            sensorDAO.unit = unit;
        }

        return this.repo.save(sensorDAO);
    }

    async deleteSensor(macAddress: string, networkCode: string, gatewayMac: string): Promise<void> {
        await this.repo.remove(await this.getSensorByMacAddress(macAddress, networkCode, gatewayMac));
    }
}