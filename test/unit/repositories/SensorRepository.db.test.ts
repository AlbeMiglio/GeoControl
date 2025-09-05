import { SensorRepository } from "@repositories/SensorRepository"
import { GatewayRepository } from "@repositories/GatewayRepository"
import { NetworkRepository } from "@repositories/NetworkRepository"
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "@test/setup/test-datasource"
import { SensorDAO } from "@dao/SensorDAO"
import { GatewayDAO } from "@dao/GatewayDAO"
import { NetworkDAO } from "@dao/NetworkDAO"
import { NotFoundError } from "@models/errors/NotFoundError"
import { ConflictError } from "@models/errors/ConflictError"

beforeAll(async () => {
  await initializeTestDataSource()
})

afterAll(async () => {
  await closeTestDataSource()
})

beforeEach(async () => {
  await TestDataSource.getRepository(SensorDAO).clear()
  await TestDataSource.getRepository(GatewayDAO).clear()
  await TestDataSource.getRepository(NetworkDAO).clear()
})

describe("SensorRepository: SQLite in-memory", () => {
  const sensorRepo = new SensorRepository()
  const gatewayRepo = new GatewayRepository()
  const networkRepo = new NetworkRepository()
  let networkCode: string
  let gatewayMac: string

  beforeEach(async () => {
    // Create a test network and gateway for each test
    const network = await networkRepo.createNetwork("NET001", "Test Network", "Test Location", [])
    networkCode = network.code

    const gateway = await gatewayRepo.createGateway("AA:BB:CC:DD:EE:FF", "Test Gateway", "Test Gateway", networkCode);
    gatewayMac = gateway.macAddress
  })

  it("create sensor", async () => {
    const sensor = await sensorRepo.createSensor(
      "11:22:33:44:55:66",
      "Test Sensor",
      "Test Sensor",
      "temperature",
      "Celsius",
      networkCode,
      gatewayMac,
    );

    expect(sensor).toMatchObject({
      macAddress: "11:22:33:44:55:66",
      name: "Test Sensor",
      variable: "temperature",
    })
    expect(sensor.gateway).toBeDefined()
    expect(sensor.gateway.macAddress).toBe(gatewayMac)

    const found = await sensorRepo.getSensorByMacAddress("11:22:33:44:55:66", networkCode, gatewayMac)
    expect(found.macAddress).toBe("11:22:33:44:55:66")
  })

  it("find sensor by MAC address: not found", async () => {
    await expect(sensorRepo.getSensorByMacAddress("NONEXISTENT", networkCode, gatewayMac)).rejects.toThrow(NotFoundError)
  })

  it("create sensor: conflict", async () => {
    await sensorRepo.createSensor(
      "11:22:33:44:55:66",
      "Test Sensor",
      "Test Sensor",
      "temperature",
      "Celsius",
      networkCode,
      gatewayMac,
    );
    await expect(
      sensorRepo.createSensor(
        "11:22:33:44:55:66",
        "Another Sensor",
        "Another Sensor",
        "humidity",
        "Percent",
        networkCode,
        gatewayMac,
      ),
    ).rejects.toThrow(ConflictError)
  })

  it("get all sensors by gateway", async () => {
    await sensorRepo.createSensor(
      "11:22:33:44:55:66",
      "Sensor 1",
      "Sensor 1",
      "temperature",
      "Celsius",
      networkCode,
      gatewayMac,
    );
    await sensorRepo.createSensor(
      "AA:BB:CC:DD:EE:00",
      "Sensor 2",
      "Sensor 2",
      "humidity",
      "Percent",
      networkCode,
      gatewayMac,
    );

    const sensors = await sensorRepo.getAllSensorsByGateway(networkCode, gatewayMac)
    expect(sensors).toHaveLength(2)

    const macAddresses = sensors.map((s) => s.macAddress).sort()
    expect(macAddresses).toEqual(["11:22:33:44:55:66", "AA:BB:CC:DD:EE:00"])
  })

  it("update sensor", async () => {
    await sensorRepo.createSensor(
      "11:22:33:44:55:66",
      "Original Name",
      "Original Name",
      "temperature",
      "Celsius",
      networkCode,
      gatewayMac,
    );

    const updated = await sensorRepo.updateSensor(
      "11:22:33:44:55:66",
      "11:22:33:44:55:66",
      "Updated Name",
      "Updated Name",
      "humidity",
      "Percent",
      networkCode,
      gatewayMac,
    );

    expect(updated).toMatchObject({
      macAddress: "11:22:33:44:55:66",
      name: "Updated Name",
      variable: "humidity",
    })

    const found = await sensorRepo.getSensorByMacAddress("11:22:33:44:55:66", networkCode, gatewayMac)
    expect(found.name).toBe("Updated Name")
    expect(found.variable).toBe("humidity")
  })

  it("update sensor: not found", async () => {
    await expect(sensorRepo.updateSensor(
      "NONEXISTENT",
      "NONEXISTENT",
      "New Name",
      "New Name",
      "humidity",
      "Percent",
      networkCode,
      gatewayMac,
    )).rejects.toThrow(
      NotFoundError,
    )
  })

  it("delete sensor", async () => {
    await sensorRepo.createSensor(
      "11:22:33:44:55:66",
      "Test Sensor",
      "Test Sensor",
      "temperature",
      "Celsius",
      networkCode,
      gatewayMac,
    );
    await sensorRepo.deleteSensor("11:22:33:44:55:66", networkCode, gatewayMac)

    await expect(sensorRepo.getSensorByMacAddress("11:22:33:44:55:66", networkCode, gatewayMac)).rejects.toThrow(NotFoundError)
  })

  it("delete sensor: not found", async () => {
    await expect(sensorRepo.deleteSensor("NONEXISTENT", networkCode, gatewayMac)).rejects.toThrow(NotFoundError)
  })
})
