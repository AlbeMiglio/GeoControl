import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("GET /gateways/:macAddress (e2e)", () => {
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

  it("get gateway by MAC address", async () => {
    const res = await request(app).get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`).set("Authorization", `Bearer ${token}`)

    console.log(res.body)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("macAddress", gatewayMac)
    expect(res.body).toHaveProperty("name", "Test Gateway")
  })

  it("get gateway by MAC address: not found", async () => {
    const res = await request(app).get(`/api/v1/networks/${networkCode}/gateways/NONEXISTENT`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(404) // Not Found
  })

  it("get gateway by MAC address: unauthorized", async () => {
    const res = await request(app).get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)

    expect(res.status).toBe(401) // Unauthorized
  })
})
