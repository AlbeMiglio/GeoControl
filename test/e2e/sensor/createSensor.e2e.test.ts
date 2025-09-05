import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("POST /gateways/:gatewayMacAddress/sensors (e2e)", () => {
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
      description: "Test Desc"
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

  it("create sensor successfully", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "Test Sensor",
        variable: "temperature",
        unit: "Celsius",
        description: "Test Sensor Description",
      })

    expect(res.status).toBe(201)
  })

  it("create sensor: conflict", async () => {
    // First create a sensor
    await request(app).post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`).set("Authorization", `Bearer ${token}`).send({
      macAddress: "AA:BB:CC:DD:EE:00",
      name: "First Sensor",
      variable: "humidity",
        unit: "Percent",
        description: "Test Sensor Description"
    })

    // Try to create another sensor with the same MAC address
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "AA:BB:CC:DD:EE:00",
        name: "Second Sensor",
        variable: "temperature",
        unit: "Celsius",
        description: "Test Sensor Description",
      })

    expect(res.status).toBe(409) // Conflict
  })

  it("create sensor: gateway not found", async () => {
    const res = await request(app)
      .post(`/api/v1/gateways/NONEXISTENT/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "AA:BB:CC:DD:EE:01",
        name: "Test Sensor",
        variable: "temperature",
        unit: "Celsius",
        description: "Test Sensor Description",
      })

    expect(res.status).toBe(404) // Not Found
  })

  it("create sensor: unauthorized", async () => {
    const res = await request(app).post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`).send({
      macAddress: "AA:BB:CC:DD:EE:01",
      name: "Test Sensor",
      variable: "temperature",
        unit: "Celsius",
        description: "Test Sensor Description",
    })

    expect(res.status).toBe(401) // Unauthorized
  })

  it("create sensor: validation error", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        // Missing macAddress
        name: "Test Sensor",
        variable: "temperature",
      })

    expect(res.status).toBe(400) // Bad Request
  })
})
