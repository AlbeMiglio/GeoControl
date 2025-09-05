import { NetworkRepository } from "@repositories/NetworkRepository"
import { NetworkDAO } from "@dao/NetworkDAO"
import { ConflictError } from "@models/errors/ConflictError"
import { NotFoundError } from "@models/errors/NotFoundError"
import { BadRequestError } from "@models/errors/BadRequestError"
import { jest } from "@jest/globals"

const mockFind: any = jest.fn()
const mockSave: any = jest.fn()
const mockRemove: any = jest.fn()

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
    }),
  },
}))

describe("NetworkRepository: mocked database", () => {
  const repo = new NetworkRepository()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("create network", async () => {
    mockFind.mockResolvedValue([])

    const savedNetwork = new NetworkDAO()
    savedNetwork.code = "NET001"
    savedNetwork.name = "Test Network"

    mockSave.mockResolvedValue(savedNetwork)

    const result = await repo.createNetwork("NET001", "Test Network", "Test Location", [])

    expect(result).toBeInstanceOf(NetworkDAO)
    expect(result.code).toBe("NET001")
    expect(result.name).toBe("Test Network")
    expect(mockSave).toHaveBeenCalledWith({
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
    })
  })

  it("create network: conflict", async () => {
    const existingNetwork = new NetworkDAO()
    existingNetwork.code = "NET001"
    existingNetwork.name = "Existing Network"
    existingNetwork.description = "Existing Location"

    mockFind.mockResolvedValue([existingNetwork])

    await expect(repo.createNetwork("NET001", "New Network", "New Location", [])).rejects.toThrow(ConflictError)
  })

  it("create network: bad request when code is empty", async () => {
    await expect(repo.createNetwork("", "Test Network", "Test Location", [])).rejects.toThrow(BadRequestError);
    await expect(repo.createNetwork("", "Test Network", "Test Location", [])).rejects.toThrow("Missing required fields");
  });

  it("find network by code", async () => {
    const foundNetwork = new NetworkDAO()
    foundNetwork.code = "NET001"
    foundNetwork.name = "Test Network"
    foundNetwork.description = "Test Location"

    mockFind.mockResolvedValue([foundNetwork])

    const result = await repo.getNetworkByCode("NET001")
    expect(result).toBe(foundNetwork)
    expect(result.name).toBe("Test Network")
  })

  it("find network by code: not found", async () => {
    mockFind.mockResolvedValue([])

    await expect(repo.getNetworkByCode("NONEXISTENT")).rejects.toThrow(NotFoundError)
  })

  it("get all networks", async () => {
    const network1 = new NetworkDAO()
    network1.code = "NET001"
    network1.name = "Network 1"
    network1.description = "Location 1"

    const network2 = new NetworkDAO()
    network2.code = "NET002"
    network2.name = "Network 2"
    network2.description = "Location 2"

    mockFind.mockResolvedValue([network1, network2])

    const result = await repo.getAllNetworks()
    expect(result).toHaveLength(2)
    expect(result[0].code).toBe("NET001")
    expect(result[1].code).toBe("NET002")
  })

  it("update network", async () => {
    const existingNetwork = new NetworkDAO()
    existingNetwork.code = "NET001"
    existingNetwork.name = "Old Name"
    existingNetwork.description = "Old Location"

    mockFind.mockResolvedValue([existingNetwork])

    const updatedNetwork = new NetworkDAO()
    updatedNetwork.code = "NET001"
    updatedNetwork.name = "New Name"
    updatedNetwork.description = "New Location"

    mockSave.mockResolvedValue(updatedNetwork)

    const result = await repo.updateNetwork("NET001", "NET001", "New Name", "New Location")

    expect(result).toBeInstanceOf(NetworkDAO)
    expect(result.code).toBe("NET001")
    expect(result.name).toBe("New Name")
    expect(result.description).toBe("New Location")
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "NET001",
        name: "New Name",
        description: "New Location",
      }),
    )
  })

  it("update network: not found", async () => {
    mockFind.mockResolvedValue([])

    await expect(repo.updateNetwork("NONEXISTENT", "NONEXISTENT", "New Name", "New Location")).rejects.toThrow(NotFoundError)
  })

  it("delete network", async () => {
    const network = new NetworkDAO()
    network.code = "NET001"
    network.name = "Test Network"
    network.description = "Test Location"

    mockFind.mockResolvedValue([network])
    mockRemove.mockResolvedValue(undefined)

    await repo.deleteNetwork("NET001")

    expect(mockRemove).toHaveBeenCalledWith(network)
  })

  it("delete network: not found", async () => {
    mockFind.mockResolvedValue([])

    await expect(repo.deleteNetwork("NONEXISTENT")).rejects.toThrow(NotFoundError)
  })
})
