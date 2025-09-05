import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("GET /networks/:networkCode/gateways (e2e)", () => {
  let token: string
  let networkCode: string

  beforeAll(async () => {
    await beforeAllE2e()
    token = generateToken(TEST_USERS.admin)

    // Create a test network
    await request(app).post("/api/v1/networks").set("Authorization", `Bearer ${token}`).send({
      code: "NET001",
      name: "Test Network",
      description: "Test Description",
    })

    networkCode = "NET001"

    // Create test gateways
    await request(app).post(`/api/v1/networks/${networkCode}/gateways`).set("Authorization", `Bearer ${token}`).send({
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Gateway 1",
    })

    await request(app).post(`/api/v1/networks/${networkCode}/gateways`).set("Authorization", `Bearer ${token}`).send({
      macAddress: "11:22:33:44:55:66",
      name: "Gateway 2",
    })
  })

  afterAll(async () => {
    await afterAllE2e()
  })

  it("get all gateways by network", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body).toHaveLength(2)

    const macAddresses = res.body.map((g: any) => g.macAddress).sort()
    expect(macAddresses).toEqual(["11:22:33:44:55:66", "AA:BB:CC:DD:EE:FF"])
  })

  it("get all gateways by network: network not found", async () => {
    const res = await request(app).get(`/api/v1/networks/NONEXISTENT/gateways`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(404) // Not Found
  })

  it("get all gateways by network: unauthorized", async () => {
    const res = await request(app).get(`/api/v1/networks/${networkCode}/gateways`)

    expect(res.status).toBe(401) // Unauthorized
  })
})
