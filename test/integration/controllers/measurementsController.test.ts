import * as measurementsController from "@controllers/measurementController";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import * as constants from "@test/e2e/acceptance/constants";

jest.mock("@repositories/MeasurementRepository");
const MockMeasurementRepository = MeasurementRepository as jest.MockedClass<typeof MeasurementRepository>;

describe("measurementsController integration tests", () => {
  const networkCode = "NET001";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const sensorMac = "11:22:33:44:55:66";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("storeMeasurements should store measurements and return DTO with correct stats", async () => {
    const fakeMeasurementsDTO: MeasurementsDTO = {
      sensorMacAddress: sensorMac,
      stats: undefined,
      measurements: [
        { createdAt: new Date("2024-01-01T12:00:00Z"), value: 10 },
        { createdAt: new Date("2024-01-01T12:05:00Z"), value: 12 },
      ],
    };

    const fakeDAO: MeasurementDAO[] = fakeMeasurementsDTO.measurements.map((m, i) => ({
      id: i + 1,
      value: m.value,
      createdAt: m.createdAt,
      sensor: { macAddress: sensorMac } as SensorDAO,
    }));

    MockMeasurementRepository.mockImplementation(() => ({
      storeMeasurements: jest.fn().mockResolvedValue(fakeDAO),
    } as any));

    const result = await measurementsController.storeMeasurements(fakeMeasurementsDTO, networkCode, gatewayMac, sensorMac);

    expect(result.sensorMacAddress).toBe(sensorMac);
    expect(result.measurements).toHaveLength(2);
    expect(result.stats).toBeDefined();
    expect(result.stats!.mean).toBe(11);
    expect(result.measurements.map(m => m.value)).toEqual([10, 12]);
  });

  it("getMeasurementsBySensor should flag outliers correctly", async () => {
    const dao: MeasurementDAO[] = [
      // Normal measurements
      { id: 1, value: 10, createdAt: new Date("2024-01-01T12:00:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 2, value: 12, createdAt: new Date("2024-01-01T12:01:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 3, value: 11, createdAt: new Date("2024-01-01T12:02:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 4, value: 13, createdAt: new Date("2024-01-01T12:03:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 5, value: 9,  createdAt: new Date("2024-01-01T12:04:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 6, value: 14, createdAt: new Date("2024-01-01T12:06:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 7, value: 10, createdAt: new Date("2024-01-01T12:07:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 8, value: 12, createdAt: new Date("2024-01-01T12:08:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 9, value: 11, createdAt: new Date("2024-01-01T12:09:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 10, value: 13, createdAt: new Date("2024-01-01T12:10:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      // Obvious outliers
      { id: 11, value: -100,   createdAt: new Date("2024-01-01T12:11:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
      { id: 12, value: 100, createdAt: new Date("2024-01-01T12:12:00Z"), sensor: { macAddress: sensorMac } as SensorDAO },
    ];

    MockMeasurementRepository.mockImplementation(() => ({
      getMeasurementsBySensor: jest.fn().mockResolvedValue(dao),
    } as any));

    const result = await measurementsController.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac);

    expect(result.sensorMacAddress).toBe(sensorMac);
    expect(result.measurements).toHaveLength(12);
    const { upperThreshold, lowerThreshold } = result.stats!;
    expect(upperThreshold).toBeGreaterThan(lowerThreshold);
    const outliers = result.measurements.filter(m => m.isOutlier);
    expect(outliers).toHaveLength(2);
    expect(outliers.map(m => m.value).sort()).toEqual([-100, 100]);
  });

  it("getMeasurementsBySensors should group measurements by sensor and compute stats", async () => {
    const daoData = [
      {
        macAddress: sensorMac,
        measurements: [
          {
            value: 10,
            createdAt: new Date("2024-01-01T12:00:00Z"),
          },
          {
            value: 20,
            createdAt: new Date("2024-01-01T12:05:00Z"),
          },
        ],
      },
      {
        macAddress: "22:33:44:55:66:77",
        measurements: [
          {
            value: 30,
            createdAt: new Date("2024-01-01T12:10:00Z"),
          },
        ],
      },
    ];

    MockMeasurementRepository.mockImplementation(() => ({
      getMeasurementsBySensors: jest.fn().mockResolvedValue(daoData),
    } as any));

    const result = await measurementsController.getMeasurementsBySensors(networkCode, [sensorMac, "22:33:44:55:66:77"]);

    expect(Array.isArray(result)).toBe(true);
    const sensor1 = result.find(r => r.sensorMacAddress === sensorMac)!;
    const sensor2 = result.find(r => r.sensorMacAddress === "22:33:44:55:66:77")!;

    expect(sensor1.measurements).toHaveLength(2);
    expect(sensor1.stats.mean).toBe(15);
    expect(sensor2.measurements).toHaveLength(1);
    expect(sensor2.stats.mean).toBe(30);
  });

  it("getStatsBySensor should compute correct statistics", async () => {
    const dao: MeasurementDAO[] = [
      { id: 1, value: 8, createdAt: new Date(), sensor: {} as SensorDAO },
      { id: 2, value: 12, createdAt: new Date(), sensor: {} as SensorDAO },
    ];

    MockMeasurementRepository.mockImplementation(() => ({
      getMeasurementsBySensor: jest.fn().mockResolvedValue(dao),
    } as any));

    const stats = await measurementsController.getStatsBySensor(networkCode, gatewayMac, sensorMac);

    expect(stats.mean).toBe(10);
    expect(stats.variance).toBe(4);
  });

  it("getOutliersBySensor should return only outlier measurements based on trimming logic", async () => {
    const dao: MeasurementDAO[] = [
      { id: 1, value: 1, createdAt: new Date("2024-01-01T12:00:00Z"), sensor: {} as SensorDAO },
      { id: 2, value: 2, createdAt: new Date("2024-01-01T12:05:00Z"), sensor: {} as SensorDAO },
      { id: 3, value: 100, createdAt: new Date("2024-01-01T12:10:00Z"), sensor: {} as SensorDAO },
    ];

    MockMeasurementRepository.mockImplementation(() => ({
      getMeasurementsBySensor: jest.fn().mockResolvedValue(dao),
    } as any));

    const result = await measurementsController.getOutliersBySensor(networkCode, gatewayMac, sensorMac);

    expect(result.measurements).toHaveLength(2);
  });

  it("getStatsBySensors should return array of sensor stats", async () => {
    const daoData = [
      {
        macAddress: sensorMac,
        measurements: [
          {
            value: 5,
            createdAt: new Date("2024-01-01T00:00:00Z"),
          },
          {
            value: 7,
            createdAt: new Date("2024-01-01T01:00:00Z"),
          },
        ],
      },
      {
        macAddress: "22:33:44:55:66:77",
        measurements: [
          {
            value: 10,
            createdAt: new Date("2024-01-01T02:00:00Z"),
          },
          {
            value: 12,
            createdAt: new Date("2024-01-01T03:00:00Z"),
          },
        ],
      },
    ];
    MockMeasurementRepository.mockImplementation(() => ({
      getMeasurementsBySensors: jest.fn().mockResolvedValue(daoData),
    } as any));

    const result = await measurementsController.getStatsBySensors(networkCode, [sensorMac, "22:33:44:55:66:77"]);

    expect(result).toHaveLength(2);
    const stat1 = result.find(r => r.sensorMacAddress === sensorMac)!;
    const stat2 = result.find(r => r.sensorMacAddress === "22:33:44:55:66:77")!;

    expect(stat1.stats.mean).toBe((5 + 7) / 2);
    expect(stat1.stats.variance).toBe(((5 - 6) ** 2 + (7 - 6) ** 2) / 2);
    expect(stat2.stats.mean).toBe((10 + 12) / 2);
    expect(stat2.stats.variance).toBe(((10 - 11) ** 2 + (12 - 11) ** 2) / 2);
  });

  it("getOutliersBySensors should filter sensors to only those with outliers", async () => {
    const daoData = [
      {
        macAddress: sensorMac,
        measurements: [
          {
            value: 1,
            createdAt: new Date("2024-01-01T00:00:00Z"),
          },
          {
            value: 5,
            createdAt: new Date("2024-01-01T01:00:00Z"),
          },
          {
            value: 100,
            createdAt: new Date("2024-01-01T02:00:00Z"),
          },
          {
            value: 1,
            createdAt: new Date("2024-01-01T00:03:00Z"),
          },
          {
            value: 2,
            createdAt: new Date("2024-01-01T00:04:00Z"),
          },
          {
            value: 3,
            createdAt: new Date("2024-01-01T00:05:00Z"),
          },
        ],
      },
      {
        macAddress: "22:33:44:55:66:77",
        measurements: [
          {
            value: 10,
            createdAt: new Date("2024-01-01T03:00:00Z"),
          },
          {
            value: 12,
            createdAt: new Date("2024-01-01T04:00:00Z"),
          },
          {
            value: 10,
            createdAt: new Date("2024-01-01T04:05:00Z"),
          },
          {
            value: 11,
            createdAt: new Date("2024-01-01T04:10:00Z"),
          },
          {
            value: 12,
            createdAt: new Date("2024-01-01T04:15:00Z"),
          },
          {
            value: 11,
            createdAt: new Date("2024-01-01T04:20:00Z"),
            sensor: { id: 2 } as SensorDAO,
          },
          {
            value: 14,
            createdAt: new Date("2024-01-01T05:00:00Z"),
          },
        ],
      }];
    MockMeasurementRepository.mockImplementation(() => ({
      getMeasurementsBySensors: jest.fn().mockResolvedValue(daoData),
    } as any));

    const result = await measurementsController.getOutliersBySensors(networkCode, [sensorMac, "22:33:44:55:66:77"]);
    expect(Array.isArray(result)).toBe(true);
    result.forEach((measure) => {
      expect(measure).toHaveProperty("sensorMacAddress");

      if (measure.hasOwnProperty("measurements")) {
        let measurements = measure.measurements;
        for (let i = 0; i < measurements.length; i++) {
          expect(measurements[i]).toHaveProperty("createdAt");
          expect(measurements[i]).toHaveProperty("value");
          expect(measurements[i]).toHaveProperty("isOutlier");
          expect(measurements[i].isOutlier).toBeTruthy();
        }
      }
    });
  });
});
