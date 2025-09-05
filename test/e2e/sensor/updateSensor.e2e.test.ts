import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("PATCH /sensors/:macAddress (e2e)", () => {
  let token: string
  let networkCode: string
  let gatewayMac: string
  let sensorMac: string

  beforeAll(async () => {
    await beforeAllE2e()
    token = generateToken(TEST_USERS.admin)

    // Create a test network
    const networkRes = await request(app).post("/api/v1/networks").set("Authorization", `Bearer ${token}`).send({
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
    })

    networkCode = "NET001"

    // Create a test gateway
    const gatewayRes = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "AA:BB:CC:DD:EE:FF",
        name: "Test Gateway",
        description: "Test Gateway Description",
      })

    gatewayMac = "AA:BB:CC:DD:EE:FF"

    // Create a test sensor
    const sensorRes = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "Original Name",
        variable: "temperature",
        unit: "Celsius",
        description: "Test Sensor Description",
      })

    sensorMac = "11:22:33:44:55:66"
  })

  afterAll(async () => {
    await afterAllE2e()
  })

  it("update sensor", async () => {
    const res = await request(app).patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`).set("Authorization", `Bearer ${token}`).send({
      macAddress: "11:22:33:44:55:66",
      name: "Updated Name",
      variable: "humidity",
      unit: "Percent",
      description: "Updated Sensor Description",
    })

    expect(res.status).toBe(204)
  })

  it("update sensor: not found", async () => {
    const res = await request(app).patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/NONEXISTENT`).set("Authorization", `Bearer ${token}`).send({
      name: "Updated Name",
      variable: "humidity",
      unit: "Percent",
      description: "Updated Sensor Description",
    })

    expect(res.status).toBe(404) // Not Found
  })

  it("update sensor: gateway not found", async () => {
    const res = await request(app).patch(`/api/v1/networks/${networkCode}/gateways/NONEXISTENT/sensors/${sensorMac}`).set("Authorization", `Bearer ${token}`).send({
      name: "Updated Name",
      variable: "humidity",
    })

    expect(res.status).toBe(404) // Not Found
  })

  it("update sensor: unauthorized", async () => {
    const res = await request(app).patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`).send({
      name: "Updated Name",
      variable: "humidity",
    })

    expect(res.status).toBe(401) // Unauthorized
  })
})
