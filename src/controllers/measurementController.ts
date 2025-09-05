import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { Stats as StatsDTO } from "@dto/Stats";
import {mapMeasurementDAOToDTO, mapMeasurementsDAOToDTO} from "@services/mapperService";
import {MeasurementDAO} from "@dao/MeasurementDAO";

export async function getMeasurementsBySensors(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: Date,
    endDate?: Date
): Promise<MeasurementsDTO[]> {
    const measurementRepository = new MeasurementRepository();
    const sensors = await measurementRepository.getMeasurementsBySensors(networkCode, sensorMacs, startDate, endDate);
    return sensors.map(sensor => {
        const rawMeasurements = sensor.measurements;
        const stats = computeStats(rawMeasurements);
        stats.startDate = startDate;
        stats.endDate = endDate;
        const sensorMeasurements = rawMeasurements.map(mdao => {
            const dto = mapMeasurementDAOToDTO(mdao);
            dto.isOutlier = dto.value > (stats.upperThreshold ?? 0) || dto.value < (stats.lowerThreshold ?? 0);
            return dto;
        });
        return {
            sensorMac: sensor.macAddress,
            sensorMacAddress: sensor.macAddress,
            stats: stats,
            measurements: sensorMeasurements
        };
    });
}

export async function storeMeasurements(measurements: MeasurementsDTO, networkCode: string, gatewayMac: string, sensorMac: string): Promise<MeasurementsDTO> {
    const measurementRepository = new MeasurementRepository();
    const measurementsDAO = await measurementRepository.storeMeasurements(measurements, networkCode, gatewayMac, sensorMac);
    return mapMeasurementsDAOToDTO(measurementsDAO, computeStats(measurementsDAO), sensorMac);
}

export async function getMeasurementsBySensor(networkCode: string, gatewayMac: string, sensorMac: string, startDate?: Date, endDate?: Date): Promise<MeasurementsDTO> {
    const measurementRepository = new MeasurementRepository();
    const measurements = await measurementRepository.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate);
    const baseStats = computeStats(measurements);
    const measurementsDTO = mapMeasurementsDAOToDTO(measurements, baseStats, sensorMac);

    measurementsDTO.measurements = measurementsDTO.measurements ?? [];

    if (baseStats.upperThreshold !== undefined && baseStats.lowerThreshold !== undefined) {
        measurementsDTO.measurements = measurementsDTO.measurements.map(m => ({
            ...m,
            isOutlier: m.value > baseStats.upperThreshold || m.value < baseStats.lowerThreshold,
        }));
    }
    const stats = {
        startDate: startDate,
        endDate: endDate,
        mean: baseStats.mean,
        variance: baseStats.variance,
        upperThreshold: baseStats.upperThreshold,
        lowerThreshold: baseStats.lowerThreshold
    }
    measurementsDTO.stats = stats;
    return measurementsDTO;
}

export async function getStatsBySensor(networkCode: string, gatewayMac: string, sensorMac: string, startDate?: Date, endDate?: Date): Promise<StatsDTO> {
    const measurementRepository = new MeasurementRepository();
    const measurements = await measurementRepository.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate);
    return computeStats(measurements);
}

export async function getOutliersBySensor(networkCode: string, gatewayMac: string, sensorMac: string, startDate?: Date, endDate?: Date): Promise<MeasurementsDTO> {
    const measurementRepository = new MeasurementRepository();
    const measurements = await measurementRepository.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate);
    // Calcolo semplificato con trimming dei valori estremi
    const values = measurements.map(m => m.value).sort((a, b) => a - b);
    const trimmedValues = values.length > 2 ? values.slice(1, values.length - 1) : values;
    const mean = trimmedValues.reduce((sum, v) => sum + v, 0) / trimmedValues.length;
    const variance = trimmedValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / trimmedValues.length;
    const upperThreshold = mean + 2 * Math.sqrt(variance);
    const lowerThreshold = mean - 2 * Math.sqrt(variance);
    const baseStats = computeStats(measurements);
    const stats = {
        startDate: baseStats.startDate,
        endDate: baseStats.endDate,
        mean: mean || baseStats.mean,
        variance: variance || baseStats.variance,
        upperThreshold: upperThreshold || baseStats.upperThreshold,
        lowerThreshold: lowerThreshold || baseStats.lowerThreshold,
    };
    const measurementsDTO = mapMeasurementsDAOToDTO(measurements, stats, sensorMac);
    measurementsDTO.measurements = measurementsDTO.measurements || [];
    measurementsDTO.measurements.forEach(m => {
        m.isOutlier = m.value > upperThreshold || m.value < lowerThreshold;
    });
    measurementsDTO.measurements = measurementsDTO.measurements.filter(m => m.isOutlier);
    return measurementsDTO;
}

export async function getStatsBySensors(
  networkCode: string,
  sensorsMacs?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<{ sensorMacAddress: string; stats: StatsDTO }[]> {
  const measurements = await getMeasurementsBySensors(networkCode, sensorsMacs, startDate, endDate);
  return measurements.map(sensorData => ({
    sensorMacAddress: sensorData.sensorMacAddress,
    stats: sensorData.stats
  }));
}

export async function getOutliersBySensors(
  networkCode: string,
  sensorsMacs?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<MeasurementsDTO[]> {
  const measurements = await getMeasurementsBySensors(networkCode, sensorsMacs, startDate, endDate);
  return measurements.map(sensorData => ({
    ...sensorData,
    measurements: sensorData.measurements.filter(m => m.isOutlier)
  }));
}

export async function getOutliersByNetwork(
  networkCode: string,
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<MeasurementsDTO[]> {
  const measurements = await getMeasurementsBySensors(networkCode, sensorMacs, startDate, endDate);
  return measurements.map(sensorData => ({
    sensorMac: sensorData.sensorMacAddress,
    sensorMacAddress: sensorData.sensorMacAddress,
    stats: sensorData.stats,
    measurements: sensorData.measurements.filter(m => m.isOutlier)
  }));
}

function computeStats(measurementsDAO: MeasurementDAO[]): StatsDTO {
    if (measurementsDAO.length === 0) {
        return {
            startDate: undefined,
            endDate: undefined,
            mean: 0,
            variance: 0,
            upperThreshold: 0,
            lowerThreshold: 0
        };
    }

    const values = measurementsDAO.map(m => m.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const upperThreshold = mean + 2 * Math.sqrt(variance);
    const lowerThreshold = mean - 2 * Math.sqrt(variance);
    const timestamps = measurementsDAO.map(m => m.createdAt.getTime());
    const startDate = new Date(Math.min(...timestamps));
    const endDate = new Date(Math.max(...timestamps));

    return {
        startDate: startDate,
        endDate: endDate,
        mean: mean,
        variance: variance,
        upperThreshold: upperThreshold,
        lowerThreshold: lowerThreshold
    }
}