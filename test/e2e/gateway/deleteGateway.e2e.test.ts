import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("DELETE /gateways/:macAddress (e2e)", () => {
  let token: string
  let networkCode: string
  let gatewayMac: string

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

    // Create a test gateway
    const gatewayRes = await request(app)
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

  it("delete gateway", async () => {
    const res = await request(app).delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(204) // No Content

    // Verify gateway is deleted
    const getRes = await request(app).get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`).set("Authorization", `Bearer ${token}`)

    expect(getRes.status).toBe(404) // Not Found
  })

  it("delete gateway: not found", async () => {
    const res = await request(app).delete(`/api/v1/networks/${networkCode}/gateways/NONEXISTENT`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(404) // Not Found
  })

  it("delete gateway: unauthorized", async () => {
    // Create a new gateway for this test
    const newGatewayRes = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "Another Gateway",
      })

    const newGatewayMac = newGatewayRes.body.macAddress

    const res = await request(app).delete(`/api/v1/networks/${networkCode}/gateways/${newGatewayMac}`)

    expect(res.status).toBe(401) // Unauthorized
  })
})
