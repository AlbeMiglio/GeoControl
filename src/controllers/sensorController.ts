import { SensorRepository } from "@repositories/SensorRepository";
import { Sensor as SensorDTO } from "@dto/Sensor";
import { mapSensorDAOToDTO } from "@services/mapperService";

export async function getAllSensorsByGateway(networkCode: string, gatewayMac: string): Promise<SensorDTO[]> {
    const sensorRepo = new SensorRepository();
    return (await sensorRepo.getAllSensorsByGateway(networkCode, gatewayMac)).map(mapSensorDAOToDTO);
}

export async function createSensor(SensorDTO: SensorDTO, networkCode: string, gatewayMac: string): Promise<SensorDTO> {
    const sensorRepo = new SensorRepository();
    return mapSensorDAOToDTO(await sensorRepo.createSensor(SensorDTO.macAddress, SensorDTO.name, SensorDTO.description, SensorDTO.variable, SensorDTO.unit, networkCode, gatewayMac));
}

export async function getSensorByMacAddress(macAddress: string, networkCode: string, gatewayMac: string): Promise<SensorDTO> {
    const sensorRepo = new SensorRepository();
    return mapSensorDAOToDTO(await sensorRepo.getSensorByMacAddress(macAddress, networkCode, gatewayMac));
}

export async function updateSensor(SensorDTO: SensorDTO, macAddress: string, networkCode: string, gatewayMac: string): Promise<SensorDTO> {
    const sensorRepo = new SensorRepository();
    return mapSensorDAOToDTO(await sensorRepo.updateSensor(macAddress, SensorDTO.macAddress, SensorDTO.name, SensorDTO.description, SensorDTO.variable, SensorDTO.unit, networkCode, gatewayMac));
}

export async function deleteSensor(macAddress: string, networkCode: string, gatewayMac: string): Promise<void> {
    const sensorRepo = new SensorRepository();
    await sensorRepo.deleteSensor(macAddress, networkCode, gatewayMac);
}