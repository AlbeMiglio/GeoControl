import { GatewayRepository } from "@repositories/GatewayRepository"
import { NetworkRepository } from "@repositories/NetworkRepository"
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "@test/setup/test-datasource"
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
  await TestDataSource.getRepository(GatewayDAO).clear()
  await TestDataSource.getRepository(NetworkDAO).clear()
})

describe("GatewayRepository: SQLite in-memory", () => {
  const gatewayRepo = new GatewayRepository()
  const networkRepo = new NetworkRepository()
  let networkCode: string

  beforeEach(async () => {
    // Create a test network for each test
    const network = await networkRepo.createNetwork("NET001", "Test Network", "Test Location", []);
    networkCode = network.code
  })

  it("create gateway", async () => {
    const gateway = await gatewayRepo.createGateway("AA:BB:CC:DD:EE:FF", "Test Gateway", "Test Gateway", networkCode);
    expect(gateway).toMatchObject({
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Test Gateway",
    })
    expect(gateway.network).toBeDefined()
    expect(gateway.network.code).toBe(networkCode)

    const found = await gatewayRepo.getGatewayByMacAddress("AA:BB:CC:DD:EE:FF", networkCode)
    expect(found.macAddress).toBe("AA:BB:CC:DD:EE:FF")
  })

  it("find gateway by MAC address: not found", async () => {
    await expect(gatewayRepo.getGatewayByMacAddress("NONEXISTENT", networkCode)).rejects.toThrow(NotFoundError)
  })

  it("create gateway: conflict", async () => {
    await gatewayRepo.createGateway("AA:BB:CC:DD:EE:FF", "Test Gateway", "Test Gateway", networkCode);
    await expect(gatewayRepo.createGateway("AA:BB:CC:DD:EE:FF", "Another Gateway", "Another Gateway", networkCode)).rejects.toThrow(
      ConflictError,
    )
  })

  it("get all gateways by network", async () => {
    await gatewayRepo.createGateway("AA:BB:CC:DD:EE:FF", "Gateway 1", "Gateway 1", networkCode);
    await gatewayRepo.createGateway("11:22:33:44:55:66", "Gateway 2", "Gateway 2", networkCode);

    const gateways = await gatewayRepo.getAllGatewaysByNetwork(networkCode)
    expect(gateways).toHaveLength(2)

    const macAddresses = gateways.map((g) => g.macAddress).sort()
    expect(macAddresses).toEqual(["11:22:33:44:55:66", "AA:BB:CC:DD:EE:FF"])
  })

  it("update gateway", async () => {
    await gatewayRepo.createGateway("AA:BB:CC:DD:EE:FF", "Original Name", "Original Name", networkCode);

    const updated = await gatewayRepo.updateGateway("AA:BB:CC:DD:EE:FF", "AA:BB:CC:DD:EE:FF", "Updated Name", "Updated Name", networkCode);
    expect(updated).toMatchObject({
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Updated Name",
    })

    const found = await gatewayRepo.getGatewayByMacAddress("AA:BB:CC:DD:EE:FF", networkCode)
    expect(found.name).toBe("Updated Name")
  })

  it("update gateway: not found", async () => {
    await expect(gatewayRepo.updateGateway("NONEXISTENT", "NONEXISTENT", "New Name", "New Name", networkCode)).rejects.toThrow(NotFoundError)
  })

  it("delete gateway", async () => {
    await gatewayRepo.createGateway("AA:BB:CC:DD:EE:FF", "Test Gateway", "Test Gateway", networkCode);
    await gatewayRepo.deleteGateway("AA:BB:CC:DD:EE:FF", networkCode);

    await expect(gatewayRepo.getGatewayByMacAddress("AA:BB:CC:DD:EE:FF", networkCode)).rejects.toThrow(NotFoundError)
  })

  it("delete gateway: not found", async () => {
    await expect(gatewayRepo.deleteGateway("NONEXISTENT", networkCode)).rejects.toThrow(NotFoundError)
  })
})
