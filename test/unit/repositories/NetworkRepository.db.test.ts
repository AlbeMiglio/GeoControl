import { NetworkRepository } from "@repositories/NetworkRepository"
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "@test/setup/test-datasource"
import { NetworkDAO } from "@dao/NetworkDAO"
import { NotFoundError } from "@models/errors/NotFoundError"
import { ConflictError } from "@models/errors/ConflictError"
import { BadRequestError } from "@models/errors/BadRequestError"

beforeAll(async () => {
  await initializeTestDataSource()
})

afterAll(async () => {
  await closeTestDataSource()
})

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear()
})

describe("NetworkRepository: SQLite in-memory", () => {
  const repo = new NetworkRepository()

  it("create network", async () => {
    const network = await repo.createNetwork("NET001", "Test Network", "Test Location", []);
    expect(network).toMatchObject({
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
    })

    const found = await repo.getNetworkByCode("NET001")
    expect(found.code).toBe("NET001")
  })

  it("find network by code: not found", async () => {
    await expect(repo.getNetworkByCode("NONEXISTENT")).rejects.toThrow(NotFoundError)
  })

  it("create network: conflict", async () => {
    await repo.createNetwork("NET001", "Test Network", "Test Location", []);
    await expect(repo.createNetwork("NET001", "Another Network", "Another Location", [])).rejects.toThrow(ConflictError)
  })

  it("create network: bad request when code is empty", async () => {
    await expect(repo.createNetwork("", "Test Network", "Test Location", [])).rejects.toThrow(BadRequestError);
    await expect(repo.createNetwork("", "Test Network", "Test Location", [])).rejects.toThrow("Missing required fields");
  })

  it("get all networks", async () => {
    await repo.createNetwork("NET001", "Network 1", "Location 1", []);
    await repo.createNetwork("NET002", "Network 2", "Location 2", []);

    const networks = await repo.getAllNetworks()
    expect(networks).toHaveLength(2)

    const codes = networks.map((n) => n.code).sort()
    expect(codes).toEqual(["NET001", "NET002"])
  })

  it("update network", async () => {
    await repo.createNetwork("NET001", "Original Name", "Original Location", []);

    const updated = await repo.updateNetwork("NET001", "NET001", "Updated Name", "Updated Location")
    expect(updated).toMatchObject({
      code: "NET001",
      name: "Updated Name",
      description: "Updated Location",
    })

    const found = await repo.getNetworkByCode("NET001")
    expect(found.name).toBe("Updated Name")
    expect(found.description).toBe("Updated Location")
  })

  it("update network: not found", async () => {
    await expect(repo.updateNetwork("NONEXISTENT", "NONEXISTENT", "New Name", "New Location")).rejects.toThrow(NotFoundError)
  })

  it("delete network", async () => {
    await repo.createNetwork("NET001", "Test Network", "Test Location", [])
    await repo.deleteNetwork("NET001")

    await expect(repo.getNetworkByCode("NET001")).rejects.toThrow(NotFoundError)
  })

  it("delete network: not found", async () => {
    await expect(repo.deleteNetwork("NONEXISTENT")).rejects.toThrow(NotFoundError)
  })
})
