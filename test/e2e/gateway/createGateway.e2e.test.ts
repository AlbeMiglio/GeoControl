import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("POST /networks/:networkCode/gateways (e2e)", () => {
  let token: string
  let networkCode: string

  beforeAll(async () => {
    await beforeAllE2e()
    token = generateToken(TEST_USERS.admin)

    // Create a test network
    const networkRes = await request(app).post("/api/v1/networks").set("Authorization", `Bearer ${token}`).send({
      code: "NET001",
      name: "Test Network",
      description: "Test Description",
    })
    networkCode = "NET001"
  })

  afterAll(async () => {
    await afterAllE2e()
  })

  it("create gateway successfully", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "AA:BB:CC:DD:EE:FF",
        name: "Test Gateway",
      })

    expect(res.status).toBe(201)
  })

  it("create gateway: conflict", async () => {
    // First create a gateway
    await request(app).post(`/api/v1/networks/${networkCode}/gateways`).set("Authorization", `Bearer ${token}`).send({
      macAddress: "11:22:33:44:55:66",
      name: "First Gateway",
    })

    // Try to create another gateway with the same MAC address
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "Second Gateway",
      })

    expect(res.status).toBe(409) // Conflict
  })

  it("create gateway: network not found", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/NONEXISTENT/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "AA:BB:CC:DD:EE:00",
        name: "Test Gateway",
      })

    expect(res.status).toBe(404) // Not Found
  })

  it("create gateway: unauthorized", async () => {
    const res = await request(app).post(`/api/v1/networks/${networkCode}/gateways`).send({
      macAddress: "AA:BB:CC:DD:EE:00",
      name: "Test Gateway",
    })

    expect(res.status).toBe(401) // Unauthorized
  })

  it("create gateway: validation error", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        // Missing macAddress
        name: "Test Gateway",
      })

    expect(res.status).toBe(400) // Bad Request
  })
})
