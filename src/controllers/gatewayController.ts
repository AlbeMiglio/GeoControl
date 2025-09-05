import {mapGatewayDAOToDTO} from "@services/mapperService";
import {GatewayRepository} from "@repositories/GatewayRepository";
import { Gateway as GatewayDTO } from "@dto/Gateway";

export async function getAllGatewaysByNetwork(networkCode: string): Promise<GatewayDTO[]> {
    const gatewayRepo = new GatewayRepository();
    return (await gatewayRepo.getAllGatewaysByNetwork(networkCode)).map(mapGatewayDAOToDTO);
}

export async function createGateway(GatewayDTO: GatewayDTO, networkCode: string): Promise<GatewayDTO> {
    const gatewayRepo = new GatewayRepository();
    return mapGatewayDAOToDTO(await gatewayRepo.createGateway(GatewayDTO.macAddress, GatewayDTO.name, GatewayDTO.description, networkCode));
}

export async function getGatewayByMacAddress(macAddress: string, networkCode: string): Promise<GatewayDTO> {
    const gatewayRepo = new GatewayRepository();
    return mapGatewayDAOToDTO(await gatewayRepo.getGatewayByMacAddress(macAddress, networkCode));
}

export async function updateGateway(GatewayDTO: GatewayDTO, macAddress: string, networkCode: string): Promise<GatewayDTO> {
    const gatewayRepo = new GatewayRepository();
    return mapGatewayDAOToDTO(await gatewayRepo.updateGateway(macAddress, GatewayDTO.macAddress, GatewayDTO.name, GatewayDTO.description, networkCode));
}

export async function deleteGateway(macAddress: string, networkCode: string): Promise<void> {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.deleteGateway(macAddress, networkCode);
}