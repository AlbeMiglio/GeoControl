import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("GET /gateways/:gatewayMacAddress/sensors (e2e)", () => {
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
      description: "Test Location",
    })

    networkCode = "NET001"

    // Create a test gateway
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "AA:BB:CC:DD:EE:FF",
        name: "Test Gateway",
        description: "Test Gateway Description",
      })

    gatewayMac = "AA:BB:CC:DD:EE:FF"

    // Create test sensors
    await request(app).post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`).set("Authorization", `Bearer ${token}`).send({
      macAddress: "11:22:33:44:55:66",
      name: "Sensor 1",
      variable: "temperature",
      unit: "Celsius",
      description: "Test Sensor Description",
    })

    await request(app).post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`).set("Authorization", `Bearer ${token}`).send({
      macAddress: "AA:BB:CC:DD:EE:00",
      name: "Sensor 2",
      variable: "humidity",
      unit: "Percentage",
      description: "Test Sensor Description",
    })
  })

  afterAll(async () => {
    await afterAllE2e()
  })

  it("get all sensors by gateway", async () => {
    const res = await request(app).get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body).toHaveLength(2)

    const macAddresses = res.body.map((s: any) => s.macAddress).sort()
    expect(macAddresses).toEqual(["11:22:33:44:55:66", "AA:BB:CC:DD:EE:00"])

    const variables = res.body.map((s: any) => s.variable).sort()
    expect(variables).toContain("temperature")
    expect(variables).toContain("humidity")
  })

  it("get all sensors by gateway: gateway not found", async () => {
    const res = await request(app).get(`/api/v1/gateways/NONEXISTENT/sensors`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(404) // Not Found
  })

  it("get all sensors by gateway: unauthorized", async () => {
    const res = await request(app).get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)

    expect(res.status).toBe(401) // Unauthorized
  })
})
