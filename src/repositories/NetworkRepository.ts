import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { Gateway } from "@models/dto/Gateway";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import {validate} from "class-validator";
import {BadRequestError} from "@errors/BadRequestError";

export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find({
      relations: ["gateways", "gateways.sensors"]
    });
  }

  async getNetworkByCode(code: string): Promise<NetworkDAO> {
    // Validazione del campo 'code' tramite decorator su NetworkDAO
    const codeDTO = new NetworkDAO();
    codeDTO.code = code;
    const errors = await validate(codeDTO, { skipMissingProperties: true });
    if (errors.length > 0) {
      const errorMessages = errors
        .map(error => Object.values(error.constraints || {}).join(", "))
        .join("; ");
      throw new BadRequestError(`Invalid network code: ${errorMessages}`);
    }
    return findOrThrowNotFound(
      await this.repo.find({
        where: { code },
        relations: ["gateways", "gateways.sensors"]
      }),
      () => true,
      `Network with code '${code}' not found`
    );
  }

  async createNetwork(
    code: string,
    name: string,
    description: string,
    gateways: Array<Gateway>
  ): Promise<NetworkDAO> {
    if (!code) {
      throw new BadRequestError("Missing required fields");
    }
    throwConflictIfFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with code '${code}' already exists`
    );

    const networkDAO = new NetworkDAO();
    networkDAO.code = code;
    networkDAO.name = name;
    networkDAO.description = description;

    const errors = await validate(networkDAO);
    if (errors.length > 0) {
      const errorMessages = errors.map((error) => Object.values(error.constraints || {}).join(", ")).join("; ");
      throw new BadRequestError(`Invalid network data: '${errorMessages}'`);
    }

    return this.repo.save(networkDAO);
  }

  async updateNetwork(
    code: string,
    new_code: string,
    name: string,
    description: string
  ): Promise<NetworkDAO> {
    const networkDAO = await this.getNetworkByCode(code);

    if (new_code === undefined && name === undefined && description === undefined) {
      throw new BadRequestError(`Invalid network update`);
    }

    if (new_code !== undefined && new_code.trim() !== "" && new_code !== code) {
      throwConflictIfFound(
        await this.repo.find({ where: { code: new_code } }),
        () => true,
        `Network with code '${new_code}' already exists`
      );
      networkDAO.code = new_code;
    }
    if (name !== undefined) {
      networkDAO.name = name;
    }
    if (description !== undefined) {
      networkDAO.description = description;
    }

    return this.repo.save(networkDAO);
  }

  async deleteNetwork(code: string): Promise<void> {
    // Validazione del campo 'code' tramite decorator su NetworkDAO
    const codeDTO = new NetworkDAO();
    codeDTO.code = code;
    const errors = await validate(codeDTO, { skipMissingProperties: true });
    if (errors.length > 0) {
      const errorMessages = errors
        .map(error => Object.values(error.constraints || {}).join(", "))
        .join("; ");
      throw new BadRequestError(`Invalid network code: ${errorMessages}`);
    }
    await this.repo.remove(await this.getNetworkByCode(code));
  }
}