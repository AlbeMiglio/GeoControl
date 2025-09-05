// src/controllers/networkController.ts
import { NetworkRepository } from "@repositories/NetworkRepository";
import { Network as NetworkDTO } from "@dto/Network";
import { mapNetworkDAOToDTO } from "@services/mapperService";

export async function getAllNetworks(): Promise<NetworkDTO[]> {
  const networkRepo = new NetworkRepository();
  return (await networkRepo.getAllNetworks()).map(mapNetworkDAOToDTO);
}

export async function getNetworkByCode(code: string): Promise<NetworkDTO> {
  const networkRepo = new NetworkRepository();
  return mapNetworkDAOToDTO(await networkRepo.getNetworkByCode(code));
}

export async function createNetwork(NetworkDTO: NetworkDTO): Promise<NetworkDTO> {
  const networkRepo = new NetworkRepository();
  return mapNetworkDAOToDTO(await networkRepo.createNetwork(NetworkDTO.code, NetworkDTO.name, NetworkDTO.description, NetworkDTO.gateways));
}

export async function updateNetwork(NetworkDTO: NetworkDTO, code: string): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.updateNetwork(code, NetworkDTO.code, NetworkDTO.name, NetworkDTO.description);
}

export async function deleteNetwork( code: string): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.deleteNetwork(code);
}
