import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { UserDAO } from "@models/dao/UserDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";
import { Network as NetworkDTO } from "@dto/Network";
import { Gateway as GatewayDTO } from "@dto/Gateway";
import { Sensor as SensorDTO } from "@dto/Sensor";
import { Measurement as MeasurementDTO } from "@dto/Measurement";
import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { Stats as StatsDTO } from "@dto/Stats";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import {throwConflictIfFound} from "@utils";

export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}

export function createUserDTO(
  username: string,
  type: UserType,
  password?: string
): UserDTO {
  return removeNullAttributes({
    username: username,
    password: password,
    type: type
  }) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type, );
}

export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): NetworkDTO {
  return createNetworkDTO(networkDAO.code, networkDAO.name, networkDAO.description, networkDAO.gateways);
}

export function mapGatewayDAOToDTO(gatewayDAO: GatewayDAO): GatewayDTO {
  return createGatewayDTO(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description, gatewayDAO.sensors);
}

export function mapSensorDAOToDTO(sensorDAO: SensorDAO): SensorDTO {
  return createSensorDTO(sensorDAO.macAddress, sensorDAO.name, sensorDAO.description, sensorDAO.variable, sensorDAO.unit, sensorDAO.measurements);
}

export function mapMeasurementDAOToDTO(measurementDAO: MeasurementDAO): MeasurementDTO {
  return createMeasurementDTO(measurementDAO.value, measurementDAO.createdAt);
}

export function mapMeasurementsDAOToDTO(measurementsDAO: MeasurementDAO[], stats: StatsDTO, sensorMac: string): MeasurementsDTO {
  return createMeasurementsDTO(sensorMac, stats, measurementsDAO);
}

export function createNetworkDTO(
  code: string,
  name?: string,
  description?: string,
  gateways?: GatewayDAO[]
): NetworkDTO {
  return removeNullAttributes({
    code: code,
    name: name,
    description: description,
    gateways: gateways?.map(mapGatewayDAOToDTO) ?? []
  }) as NetworkDTO;
}

export function createGatewayDTO(
    macAddress: string,
    name?: string,
    description?: string,
    sensors?: SensorDTO[]
): GatewayDTO {
  return removeNullAttributes({
    macAddress: macAddress,
    name: name,
    description: description,
    sensors: sensors?.map(mapSensorDAOToDTO) ?? []
  }) as GatewayDTO;
}

export function createSensorDTO(
    macAddress: string,
    name?: string,
    description?: string,
    variable?: string,
    unit?: string,
    measurements?: MeasurementDAO[]
): SensorDTO {
  return removeNullAttributes({
    macAddress: macAddress,
    name: name,
    description: description,
    variable: variable,
    unit: unit,
    measurements: measurements
  }) as SensorDTO;
}

export function createMeasurementDTO(
    value: number,
    createdAt: Date,
    isOutlier?: boolean
): MeasurementDTO {
  return removeNullAttributes({
    createdAt: createdAt,
    value: value,
    isOutlier: isOutlier
  }) as MeasurementDTO;
}

export function createMeasurementsDTO(
    sensorMacAddress: string,
    stats: StatsDTO,
    measurementsDAO: MeasurementDAO[]
): MeasurementsDTO {
  const measurementsDTO: MeasurementDTO[] = measurementsDAO.map(mapMeasurementDAOToDTO);

  return removeNullAttributes({
    sensorMacAddress: sensorMacAddress,
    stats: stats,
    measurements: measurementsDTO
  }) as MeasurementsDTO;
}

function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}
