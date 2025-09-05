import request from "supertest"
import { app } from "@app"
import { generateToken } from "@services/authService"
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle"

describe("DELETE /sensors/:macAddress (e2e)", () => {
  let token: string
  let networkCode: string
  let gatewayMac: string
  let sensorMac: string

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
        name: "Test Sensor",
        variable: "temperature",
        unit: "Celsius",
        description: "Test Sensor Description"
      })

    sensorMac = "11:22:33:44:55:66"
  })

  afterAll(async () => {
    await afterAllE2e()
  })

  it("delete sensor", async () => {
    const res = await request(app).delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(204) // No Content

    // Verify sensor is deleted
    const getRes = await request(app).get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`).set("Authorization", `Bearer ${token}`)

    expect(getRes.status).toBe(404) // Not Found
  })

  it("delete sensor: not found", async () => {
    const res = await request(app).delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/NONEXISTENT`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(404) // Not Found
  })

  it("delete sensor: unauthorized", async () => {
    // Create a new sensor for this test
    const newSensorRes = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "AA:BB:CC:DD:EE:00",
        name: "Another Sensor",
        variable: "humidity",
      })

    const newSensorMac = newSensorRes.body.macAddress

    const res = await request(app).delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${newSensorMac}`)

    expect(res.status).toBe(401) // Unauthorized
  })
})
