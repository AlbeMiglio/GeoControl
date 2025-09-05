import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import {validate} from "class-validator";
import {BadRequestError} from "@errors/BadRequestError";

export class GatewayRepository {
    private repo: Repository<GatewayDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(GatewayDAO);
    }

    async getAllGatewaysByNetwork(networkCode: string): Promise<GatewayDAO[]> {
        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        const network = findOrThrowNotFound(
            await networkRepo.find({ where: {code: networkCode} }),
            () => true,
            `Network with code '${networkCode}' not found`
        );

        return this.repo.find({
            where: { network: { id: network.id } },
            relations: ["sensors"]
        });
    }

    async createGateway(
        macAddress: string,
        name: string,
        description: string,
        networkCode: string
    ): Promise<GatewayDAO> {
        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        const network = findOrThrowNotFound(
            await networkRepo.find({ where: {code: networkCode} }),
            () => true,
            `Network with code '${networkCode}' not found`
        );

        const gatewayEntity = new GatewayDAO();
        gatewayEntity.macAddress = macAddress;
        gatewayEntity.name = name;
        gatewayEntity.description = description;
        gatewayEntity.network = network;

        const errors = await validate(gatewayEntity);
        if (errors.length > 0) {
            const errorMessages = errors
                .map(error => Object.values(error.constraints || {}).join(", "))
                .join("; ");
            throw new BadRequestError(`Invalid gateway data: '${errorMessages}'`);
        }

        throwConflictIfFound(
            await this.repo.find({ where: { macAddress, network: { id: network.id } } }),
            () => true,
            `Gateway with MAC address '${macAddress}' already exists`
        );

        return this.repo.save(gatewayEntity);
    }

    async getGatewayByMacAddress(macAddress: string, networkCode: string): Promise<GatewayDAO> {
        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        const network = findOrThrowNotFound(
            await networkRepo.find({ where: {code: networkCode} }),
            () => true,
            `Network with code '${networkCode}' not found`
        );
        return findOrThrowNotFound(
            await this.repo.find({
                where: { macAddress, network: { id: network.id } },
                relations: ["sensors"]
            }),
            () => true,
            `Gateway with Mac Address '${macAddress}' not found`
        );
    }

    async updateGateway(
        macAddress: string,
        new_macAddress: string,
        name: string,
        description: string,
        networkCode: string
    ): Promise<GatewayDAO> {
        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        const network = findOrThrowNotFound(
            await networkRepo.find({ where: {code: networkCode} }),
            () => true,
            `Network with code '${networkCode}' not found`
        );

        if (new_macAddress !== macAddress && new_macAddress !== undefined) {
            const conflict = await this.repo.find({
                where: {
                    macAddress: new_macAddress,
                    network: { id: network.id }
                }
            });

            throwConflictIfFound(
                conflict,
                () => true,
                `Gateway with MacAddress '${new_macAddress}' already in use`
            );
        }

        const gatewayDAO = await this.getGatewayByMacAddress(macAddress, networkCode);

        if (new_macAddress === undefined && name === undefined && description === undefined) {
            throw new BadRequestError(`Invalid gateway update`);
        }

        if (new_macAddress !== undefined && new_macAddress.trim() !== "") {
            gatewayDAO.macAddress = new_macAddress;
        }
        if (name !== undefined) {
            gatewayDAO.name = name;
        }
        if (description !== undefined) {
            gatewayDAO.description = description;
        }

        return this.repo.save(gatewayDAO);
    }

    async deleteGateway(macAddress: string, networkCode: string): Promise<void> {
        let gw = await this.getGatewayByMacAddress(macAddress, networkCode);
        await this.repo.remove(gw);
    }
}