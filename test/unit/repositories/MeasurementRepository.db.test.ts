

import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "@test/setup/test-datasource";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { BadRequestError } from "@errors/BadRequestError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(MeasurementDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("MeasurementRepository: SQLite in-memory", () => {
  const measurementRepo = new MeasurementRepository();
  const gatewayRepo = new GatewayRepository();
  const networkRepo = new NetworkRepository();
  const sensorRepo = new SensorRepository();
  let networkCode: string;
  let gatewayMac: string;
  let sensorMac: string;

  beforeEach(async () => {
    const network = await networkRepo.createNetwork("NET001", "Test Network", "Test Location", []);
    networkCode = network.code;

    const gateway = await gatewayRepo.createGateway(
      "AA:BB:CC:DD:EE:FF",
      "Test Gateway",
      "Test Gateway",
      networkCode
    );
    gatewayMac = gateway.macAddress;

    const sensor = await sensorRepo.createSensor(
      "11:22:33:44:55:66",
      "Test Sensor",
      "Test Sensor",
      "temperature",
      "Celsius",
      networkCode,
      gatewayMac
    );
    sensorMac = sensor.macAddress;
  });

  it("store measurements", async () => {
    const t1 = new Date("2025-05-27T10:00:00.000Z");
    const t2 = new Date("2025-05-27T11:00:00.000Z");
    const dto = {
        sensorMacAddress: sensorMac,
        measurements: [
        { value: 23.5, createdAt: t1 },
        { value: 24.1, createdAt: t2 },
      ],
    };

    const saved = await measurementRepo.storeMeasurements(dto, networkCode, gatewayMac, sensorMac);
    expect(saved).toHaveLength(2);
    expect(saved[0]).toMatchObject({ value: 23.5, createdAt: t1 });
    expect(saved[1]).toMatchObject({ value: 24.1, createdAt: t2 });

    const found = await measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac);
    expect(found.map((m) => m.value).sort()).toEqual([23.5, 24.1]);
  });

  it("store measurements: conflict", async () => {
    const t = new Date("2025-05-27T11:00:00.000Z");
    const dto = {
        sensorMacAddress: sensorMac,
        measurements: [{ value: 42, createdAt: t }]
    };

    await measurementRepo.storeMeasurements(dto, networkCode, gatewayMac, sensorMac);
    await expect(
      measurementRepo.storeMeasurements(dto, networkCode, gatewayMac, sensorMac)
    ).rejects.toThrow(ConflictError);
  });

  it("store measurements: validation errors", async () => {
    const now = new Date();
    // missing value
    await expect(
      measurementRepo.storeMeasurements({ sensorMacAddress: sensorMac, measurements: [{ createdAt: now }] } as any, networkCode, gatewayMac, sensorMac)
    ).rejects.toThrow(BadRequestError);

    // invalid (NaN) value
    await expect(
      measurementRepo.storeMeasurements({ sensorMacAddress: sensorMac, measurements: [{ value: NaN, createdAt: now }] }, networkCode, gatewayMac, sensorMac)
    ).rejects.toThrow(BadRequestError);

    // missing createdAt
    await expect(
      measurementRepo.storeMeasurements({ sensorMacAddress: sensorMac, measurements: [{ value: 10 }] } as any, networkCode, gatewayMac, sensorMac)
    ).rejects.toThrow(BadRequestError);

    // invalid createdAt
    await expect(
      measurementRepo.storeMeasurements(
        { sensorMacAddress: sensorMac, measurements: [{ value: 10, createdAt: new Date("invalid-date") }] } as any,
        networkCode,
        gatewayMac,
        sensorMac
      )
    ).rejects.toThrow(BadRequestError);
  });

  describe("getMeasurementsBySensor", () => {
    let t1: Date, t2: Date, t3: Date;
    beforeEach(async () => {
      t1 = new Date("2025-05-26T09:00:00.000Z");
      t2 = new Date("2025-05-26T10:00:00.000Z");
      t3 = new Date("2025-05-26T11:00:00.000Z");
      await measurementRepo.storeMeasurements(
        { sensorMacAddress: sensorMac, measurements: [
            { value: 1, createdAt: t1 },
            { value: 2, createdAt: t2 },
            { value: 3, createdAt: t3 },
          ] },
        networkCode,
        gatewayMac,
        sensorMac
      );
    });

    it("retrieves all when no dates provided", async () => {
      const all = await measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac);
      expect(all).toHaveLength(3);
    });

    it("filters by startDate", async () => {
      const filtered = await measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, t2);
      expect(filtered.map((m) => m.value).sort()).toEqual([2, 3]);
    });

    it("filters by endDate", async () => {
      const filtered = await measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, undefined, t2);
      expect(filtered.map((m) => m.value).sort()).toEqual([1, 2]);
    });

    it("filters by range", async () => {
      const filtered = await measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, t1, t2);
      expect(filtered.map((m) => m.value).sort()).toEqual([1, 2]);
    });

    it("throws on invalid date parameters", async () => {
      await expect(
        measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, new Date("invalid"), t2)
      ).rejects.toThrow(BadRequestError);
      await expect(
        measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, t1, new Date("invalid"))
      ).rejects.toThrow(BadRequestError);
      await expect(
        measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, new Date("invalid"), new Date("invalid"))
      ).rejects.toThrow(BadRequestError);
    });

    it("throws when network/gateway/sensor not found", async () => {
      await expect(
        measurementRepo.getMeasurementsBySensor("WRONG", gatewayMac, sensorMac)
      ).rejects.toThrow(NotFoundError);
      await expect(
        measurementRepo.getMeasurementsBySensor(networkCode, "FF:FF:FF:FF:FF:FF", sensorMac)
      ).rejects.toThrow(NotFoundError);
      await expect(
        measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, "00:00:00:00:00:00")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getMeasurementsBySensors", () => {
    it("retrieves across multiple sensors and loads relations", async () => {
      const sensor2 = await sensorRepo.createSensor(
        "22:33:44:55:66:77",
        "Sensor 2",
        "Sensor 2",
        "humidity",
        "Percent",
        networkCode,
        gatewayMac
      );
      const d1 = new Date("2025-05-26T08:00:00.000Z");
      const d2 = new Date("2025-05-26T09:00:00.000Z");

      await measurementRepo.storeMeasurements(
        { sensorMacAddress: sensorMac, measurements: [{ value: 100, createdAt: d1 }] },
        networkCode,
        gatewayMac,
        sensorMac
      );
      await measurementRepo.storeMeasurements(
        { sensorMacAddress: sensor2.macAddress, measurements: [{ value: 200, createdAt: d2 }] },
        networkCode,
        gatewayMac,
        sensor2.macAddress
      );

      const all = await measurementRepo.getMeasurementsBySensors(networkCode, [sensorMac, sensor2.macAddress]);
      expect(all).toHaveLength(2);
    });

    it("retrieves when no sensor list provided", async () => {
      const dt = new Date("2025-05-26T08:00:00.000Z");
      await measurementRepo.storeMeasurements(
        { sensorMacAddress: sensorMac, measurements: [{ value: 123, createdAt: dt }] },
        networkCode,
        gatewayMac,
        sensorMac
      );
      const all = await measurementRepo.getMeasurementsBySensors(networkCode);
      expect(all).toHaveLength(1);
      expect(all[0].measurements[0].value).toBe(123);
    });

    it("applies date filters and throws on invalid dates", async () => {
      const t1 = new Date("2025-05-26T08:00:00.000Z");
      const t2 = new Date("2025-05-26T09:00:00.000Z");
      await measurementRepo.storeMeasurements(
        { sensorMacAddress: sensorMac, measurements: [{ value: 50, createdAt: t1 }, { value: 60, createdAt: t2 }] },
        networkCode,
        gatewayMac,
        sensorMac
      );

      await expect(
        measurementRepo.getMeasurementsBySensors(networkCode, undefined, new Date("invalid"))
      ).rejects.toThrow(BadRequestError);
      await expect(
        measurementRepo.getMeasurementsBySensors(networkCode, undefined, t1, new Date("invalid"))
      ).rejects.toThrow(BadRequestError);
    });

    it("throws when network not found", async () => {
      await expect(
        measurementRepo.getMeasurementsBySensors("WRONG")
      ).rejects.toThrow(NotFoundError);
    });
  });
});