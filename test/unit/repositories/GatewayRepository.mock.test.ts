import { GatewayRepository } from "@repositories/GatewayRepository"
import { GatewayDAO } from "@dao/GatewayDAO"
import { NetworkDAO } from "@dao/NetworkDAO"
import { ConflictError } from "@models/errors/ConflictError"
import { NotFoundError } from "@models/errors/NotFoundError"
import { jest } from "@jest/globals"

const mockFind: any = jest.fn()
const mockSave: any = jest.fn()
const mockRemove: any = jest.fn()

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity && entity === NetworkDAO) {
        return { find: mockFind };
      }
      return { find: mockFind, save: mockSave, remove: mockRemove };
    }),
  },
}))

describe("GatewayRepository: mocked database", () => {
  const repo = new GatewayRepository()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("create gateway", async () => {
    // Mock network lookup
    const network = new NetworkDAO()
    network.code = "NET001"
    network.name = "Test Network"
    network.description = "Test Location"
    mockFind.mockResolvedValueOnce([network])

    // Mock gateway lookup (not found)
    mockFind.mockResolvedValueOnce([])

    // Mock gateway save
    const savedGateway = new GatewayDAO()
    savedGateway.macAddress = "AA:BB:CC:DD:EE:FF"
    savedGateway.name = "Test Gateway"
    savedGateway.network = network
    savedGateway.description = "Test Description"
    mockSave.mockResolvedValue(savedGateway)

    const result = await repo.createGateway("AA:BB:CC:DD:EE:FF", "Test Gateway", "Test Description", "NET001")

    expect(result).toBeInstanceOf(GatewayDAO)
    expect(result.macAddress).toBe("AA:BB:CC:DD:EE:FF")
    expect(result.name).toBe("Test Gateway")
    expect(result.network).toBe(network)
    expect(result.description).toBe("Test Description")
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        macAddress: "AA:BB:CC:DD:EE:FF",
        name: "Test Gateway",
        description: "Test Description",
        network: network,
      }),
    );
  })

  it("create gateway: conflict", async () => {
    // Mock network lookup
    const network = new NetworkDAO()
    network.code = "NET001"
    mockFind.mockResolvedValueOnce([network])

    // Mock gateway lookup (found)
    const existingGateway = new GatewayDAO()
    existingGateway.macAddress = "AA:BB:CC:DD:EE:FF"
    existingGateway.name = "Existing Gateway"
    existingGateway.network = network
    mockFind.mockResolvedValueOnce([existingGateway])

    await expect(repo.createGateway("AA:BB:CC:DD:EE:FF", "New Gateway", "Description", "NET001")).rejects.toThrow(ConflictError)
  })

  it("find gateway by MAC address", async () => {
    const network = new NetworkDAO()
    network.code = "NET001"

    const foundGateway = new GatewayDAO()
    foundGateway.macAddress = "AA:BB:CC:DD:EE:FF"
    foundGateway.name = "Test Gateway"
    foundGateway.network = network

    mockFind.mockResolvedValue([foundGateway])

    const result = await repo.getGatewayByMacAddress("AA:BB:CC:DD:EE:FF", "NET001")
    expect(result).toBe(foundGateway)
    expect(result.name).toBe("Test Gateway")
    expect(result.network).toBe(network)
  })

  it("find gateway by MAC address: not found", async () => {
    mockFind.mockResolvedValue([])

    await expect(repo.getGatewayByMacAddress("NONEXISTENT", "NET001")).rejects.toThrow(NotFoundError)
  })

  it("get all gateways by network", async () => {
    const network = new NetworkDAO()
    network.code = "NET001"

    const gateway1 = new GatewayDAO()
    gateway1.macAddress = "AA:BB:CC:DD:EE:FF"
    gateway1.name = "Gateway 1"
    gateway1.network = network

    const gateway2 = new GatewayDAO()
    gateway2.macAddress = "11:22:33:44:55:66"
    gateway2.name = "Gateway 2"
    gateway2.network = network

    mockFind.mockResolvedValue([gateway1, gateway2])

    const result = await repo.getAllGatewaysByNetwork("NET001")
    expect(result).toHaveLength(2)
    expect(result[0].macAddress).toBe("AA:BB:CC:DD:EE:FF")
    expect(result[1].macAddress).toBe("11:22:33:44:55:66")
  })

  it("update gateway", async () => {
    const network = new NetworkDAO()
    network.code = "NET001"

    const existingGateway = new GatewayDAO()
    existingGateway.macAddress = "AA:BB:CC:DD:EE:FF"
    existingGateway.name = "Old Name"
    existingGateway.network = network

    mockFind.mockResolvedValue([existingGateway])

    const updatedGateway = new GatewayDAO()
    updatedGateway.macAddress = "AA:BB:CC:DD:EE:FF"
    updatedGateway.name = "New Name"
    updatedGateway.network = network

    mockSave.mockResolvedValue(updatedGateway)

    const result = await repo.updateGateway("AA:BB:CC:DD:EE:FF", "AA:BB:CC:DD:EE:FF", "New Name", "Desc", "NET001")

    expect(result).toBeInstanceOf(GatewayDAO)
    expect(result.macAddress).toBe("AA:BB:CC:DD:EE:FF")
    expect(result.name).toBe("New Name")
    expect(result.network).toBe(network)
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        macAddress: "AA:BB:CC:DD:EE:FF",
        name: "New Name",
        network: network,
      }),
    )
  })

  it("update gateway: not found", async () => {
    const network = new NetworkDAO()
    network.code = "NET001"

    mockFind.mockResolvedValue([])

    await expect(repo.updateGateway("NONEXISTENT", "NONEXISTENT", "New Name", "Desc", "NET001")).rejects.toThrow(NotFoundError)
  })

  it("delete gateway", async () => {
    const network = new NetworkDAO()
    network.code = "NET001"

    const gateway = new GatewayDAO()
    gateway.macAddress = "AA:BB:CC:DD:EE:FF"
    gateway.name = "Test Gateway"
    gateway.network = network

    mockFind.mockResolvedValue([gateway])
    mockRemove.mockResolvedValue(undefined)

    await repo.deleteGateway("AA:BB:CC:DD:EE:FF", network.code)

    expect(mockRemove).toHaveBeenCalledWith(gateway)
  })

  it("delete gateway: not found", async () => {
    mockFind.mockResolvedValue([])

    await expect(repo.deleteGateway("NONEXISTENT", "NET001")).rejects.toThrow(NotFoundError)
  })
})
