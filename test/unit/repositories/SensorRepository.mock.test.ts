import { SensorRepository } from "@repositories/SensorRepository"
import { SensorDAO } from "@dao/SensorDAO"
import { GatewayDAO } from "@dao/GatewayDAO"
import { NetworkDAO } from "@dao/NetworkDAO"
import { ConflictError } from "@models/errors/ConflictError"
import { NotFoundError } from "@models/errors/NotFoundError"
import { jest } from '@jest/globals'
import {DeepPartial} from "typeorm";

const mockGetNetworkByCode = jest.fn<(code: string) => Promise<NetworkDAO>>();
const mockFindNetwork = jest.fn<() => Promise<NetworkDAO[]>>();

const mockGetGatewayByMacAddress = jest.fn<(macAddress: string) => Promise<GatewayDAO>>();
const mockFindGateway = jest.fn<() => Promise<GatewayDAO[]>>();

const mockCreate = jest.fn<(sensor: DeepPartial<SensorDAO>) => SensorDAO>();
const mockFind = jest.fn<() => Promise<SensorDAO[]>>();
const mockSave = jest.fn<(sensor: SensorDAO) => Promise<SensorDAO>>();
const mockRemove = jest.fn<(sensor: SensorDAO) => Promise<void>>();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: jest.fn().mockImplementation((entity) => {
      if (entity === NetworkDAO) {
        return { find: mockFindNetwork };
      }
      if (entity === GatewayDAO) {
        return { find: mockFindGateway };
      }
      if (entity === SensorDAO) {
        return {
          create: mockCreate,
          find: mockFind,
          save: mockSave,
          remove: mockRemove,
        };
      }
      return {};
    }),
  },
}));



describe("SensorRepository: mocked database", () => {
  const repo = new SensorRepository()

  beforeEach(() => {
    jest.clearAllMocks()
    const defaultNetwork = new NetworkDAO()
    defaultNetwork.code = "NET001"
    defaultNetwork.name = "Test Network"

    const defaultGateway = new GatewayDAO()
    defaultGateway.macAddress = "AA:BB:CC:DD:EE:FF"
    defaultGateway.name = "Test Gateway"
    defaultGateway.network = defaultNetwork

    defaultNetwork.gateways = [defaultGateway]
    mockGetGatewayByMacAddress.mockResolvedValue(defaultGateway)
    mockFindGateway.mockResolvedValue([defaultGateway])
    mockFindNetwork.mockResolvedValue([defaultNetwork])
    mockGetNetworkByCode.mockResolvedValue(defaultNetwork)
  })

  it("create sensor", async () => {
    // Mock network and gateway
    const network = new NetworkDAO()
    network.code = "NET001"
    network.name = "Test Network"


    const gateway = new GatewayDAO()
    gateway.macAddress = "AA:BB:CC:DD:EE:FF"
    gateway.name = "Test Gateway"
    gateway.network = network
    network.gateways = [gateway]

    mockGetGatewayByMacAddress.mockResolvedValue(gateway)

    // Mock sensor lookup (not found)
    mockFind.mockResolvedValue([])

    // Mock sensor save
    const savedSensor = new SensorDAO()
    savedSensor.macAddress = "11:22:33:44:55:66"
    savedSensor.name = "Test Sensor"
    savedSensor.variable = "temperature"
    savedSensor.gateway = gateway
    mockSave.mockResolvedValue(savedSensor)
    mockCreate.mockReturnValue(savedSensor)

    const result = await repo.createSensor("11:22:33:44:55:66", "Test Sensor", "Test Sensor", "temperature", "Celsius", network.code, gateway.macAddress)

    expect(result).toBeInstanceOf(SensorDAO)
    expect(result.macAddress).toBe("11:22:33:44:55:66")
    expect(result.name).toBe("Test Sensor")
    expect(result.variable).toBe("temperature")
    expect(result.gateway).toBe(gateway)
    expect(mockSave).toHaveBeenCalledWith({
      macAddress: "11:22:33:44:55:66",
      name: "Test Sensor",
      variable: "temperature",
      gateway: gateway,
    })
  })

  it("create sensor: conflict", async () => {
    // Mock gateway
    const gateway = new GatewayDAO()
    gateway.macAddress = "AA:BB:CC:DD:EE:FF"
    mockGetGatewayByMacAddress.mockResolvedValue(gateway)

    // Mock sensor lookup (found)
    const existingSensor = new SensorDAO()
    existingSensor.macAddress = "11:22:33:44:55:66"
    existingSensor.name = "Existing Sensor"
    existingSensor.variable = "humidity"
    existingSensor.gateway = gateway
    mockFind.mockResolvedValue([existingSensor])

    await expect(
      repo.createSensor("11:22:33:44:55:66", "New Sensor", "New", "temperature", "Celsius", "NET001", "AA:BB:CC:DD:EE:FF"),
    ).rejects.toThrow(ConflictError)
  })

  it("find sensor by MAC address", async () => {
    const gateway = new GatewayDAO()
    gateway.macAddress = "AA:BB:CC:DD:EE:FF"

    const foundSensor = new SensorDAO()
    foundSensor.macAddress = "11:22:33:44:55:66"
    foundSensor.name = "Test Sensor"
    foundSensor.variable = "temperature"
    foundSensor.gateway = gateway

    mockFind.mockResolvedValue([foundSensor])

    const result = await repo.getSensorByMacAddress("11:22:33:44:55:66", "NET001", "AA:BB:CC:DD:EE:FF")
    expect(result).toBe(foundSensor)
    expect(result.name).toBe("Test Sensor")
    expect(result.variable).toBe("temperature")
    expect(result.gateway).toBe(gateway)
  })

  it("find sensor by MAC address: not found", async () => {
    mockFind.mockResolvedValue([])

    await expect(repo.getSensorByMacAddress("NONEXISTENT", "NONEXISTENT", "NONEXISTENT")).rejects.toThrow(NotFoundError)
  })

  it("get all sensors by gateway", async () => {
    const gateway = new GatewayDAO()
    gateway.macAddress = "AA:BB:CC:DD:EE:FF"
    mockGetGatewayByMacAddress.mockResolvedValue(gateway)

    const sensor1 = new SensorDAO()
    sensor1.macAddress = "11:22:33:44:55:66"
    sensor1.name = "Sensor 1"
    sensor1.variable = "temperature"
    sensor1.gateway = gateway

    const sensor2 = new SensorDAO()
    sensor2.macAddress = "AA:BB:CC:DD:EE:00"
    sensor2.name = "Sensor 2"
    sensor2.variable = "humidity"
    sensor2.gateway = gateway

    mockFind.mockResolvedValue([sensor1, sensor2])

    const result = await repo.getAllSensorsByGateway("NET001", "AA:BB:CC:DD:EE:FF")
    expect(result).toHaveLength(2)
    expect(result[0].macAddress).toBe("11:22:33:44:55:66")
    expect(result[1].macAddress).toBe("AA:BB:CC:DD:EE:00")
  })

  it("update sensor", async () => {
    const gateway = new GatewayDAO()
    gateway.macAddress = "AA:BB:CC:DD:EE:FF"
    // Ensure gateway belongs to network
    const networkForGateway = new NetworkDAO()
    networkForGateway.code = "NET001"
    networkForGateway.name = "Test Network"
    gateway.network = networkForGateway

    mockGetGatewayByMacAddress.mockResolvedValue(gateway)

    const existingSensor = new SensorDAO()
    existingSensor.macAddress = "11:22:33:44:55:66"
    existingSensor.name = "Old Name"
    existingSensor.variable = "temperature"
    existingSensor.gateway = gateway

    mockFind.mockResolvedValue([existingSensor])

    const updatedSensor = new SensorDAO()
    updatedSensor.macAddress = "11:22:33:44:55:66"
    updatedSensor.name = "New Name"
    updatedSensor.variable = "humidity"
    updatedSensor.gateway = gateway

    mockSave.mockResolvedValue(updatedSensor)

    const result = await repo.updateSensor("11:22:33:44:55:66", "11:22:33:44:55:66", "New Name", "Desc", "humidity", "", "NET001", "AA:BB:CC:DD:EE:FF")

    expect(result).toBeInstanceOf(SensorDAO)
    expect(result.macAddress).toBe("11:22:33:44:55:66")
    expect(result.name).toBe("New Name")
    expect(result.variable).toBe("humidity")
    expect(result.gateway).toBe(gateway)
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: undefined,
        macAddress: "11:22:33:44:55:66",
        name: "New Name",
        variable: "humidity",
        description: "Desc",
        measurements: undefined,
        unit: "",
        gateway: gateway,
      }),
    )
  })

  it("update sensor: not found", async () => {
    const gateway = new GatewayDAO()
    gateway.macAddress = "AA:BB:CC:DD:EE:FF"
    mockGetGatewayByMacAddress.mockResolvedValue(gateway)

    mockFind.mockResolvedValue([])

    await expect(repo.updateSensor("NONEXISTENT", "NONEXISTENT", "New Name", "Desc", "humidity", "", "NET001", "AA:BB:CC:DD:EE:FF")).rejects.toThrow(
      NotFoundError,
    )
  })

  it("delete sensor", async () => {
    const gateway = new GatewayDAO()
    gateway.macAddress = "AA:BB:CC:DD:EE:FF"

    const sensor = new SensorDAO()
    sensor.macAddress = "11:22:33:44:55:66"
    sensor.name = "Test Sensor"
    sensor.variable = "temperature"
    sensor.gateway = gateway

    mockFind.mockResolvedValue([sensor])
    mockRemove.mockResolvedValue(undefined)

    await repo.deleteSensor("11:22:33:44:55:66", "NET001", "AA:BB:CC:DD:EE:FF")

    expect(mockRemove).toHaveBeenCalledWith(sensor)
  })

  it("delete sensor: not found", async () => {
    mockFind.mockResolvedValue([])

    await expect(repo.deleteSensor("NONEXISTENT", "NONEXISTENT", "NONEXISTENT")).rejects.toThrow(NotFoundError)
  })
})
