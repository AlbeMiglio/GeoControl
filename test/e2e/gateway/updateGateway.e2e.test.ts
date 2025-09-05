import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("PATCH /gateways/:macAddress (e2e)", () => {
  let token: string
  let networkCode: string
  let gatewayMac: string

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

    // Create a test gateway
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "AA:BB:CC:DD:EE:FF",
        name: "Test Gateway",
        description: "Test Description",
      })

    gatewayMac = "AA:BB:CC:DD:EE:FF"
  })

  afterAll(async () => {
    await afterAllE2e()
  })

  it("update gateway", async () => {
    const res = await request(app).patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`).set("Authorization", `Bearer ${token}`).send({
      name: "Updated Name",
      macAddress: gatewayMac,
      description: "Updated Description",
    })

    expect(res.status).toBe(204)
  })

  it("update gateway: not found", async () => {
    const res = await request(app).patch(`/api/v1/networks/${networkCode}/gateways/NONEXISTENT`).set("Authorization", `Bearer ${token}`).send({
      name: "Updated Name",
      macAddress: "NONEXISTENT",
    })

    expect(res.status).toBe(404) // Not Found
  })

  it("update gateway: network not found", async () => {
    const res = await request(app).patch(`/api/v1/networks/NONEXISTENT/gateways/${gatewayMac}`).set("Authorization", `Bearer ${token}`).send({
      name: "Updated Name",
      macAddress: gatewayMac,
    })

    expect(res.status).toBe(404) // Not Found
  })

  it("update gateway: unauthorized", async () => {
    const res = await request(app).patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`).send({
      name: "Updated Name",
      macAddress: gatewayMac,
    })

    expect(res.status).toBe(401) // Unauthorized
  })
})
