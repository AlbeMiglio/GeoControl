import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as sensorController from "@controllers/sensorController";
import { SensorFromJSON } from "@dto/Sensor";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/sensorController");

describe("SensorRoutes integration", () => {
  const token = "Bearer faketoken";
  const networkCode = "net1";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const sensorMac = "11:22:33:44:55:66";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("get all sensors by gateway", async () => {
    const mockSensors = [
      { macAddress: sensorMac, name: "Sensor 1" },
      { macAddress: "77:88:99:AA:BB:CC", name: "Sensor 2" },
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getAllSensorsByGateway as jest.Mock).mockResolvedValue(mockSensors);

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSensors);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
      UserType.Viewer,
    ]);
    expect(sensorController.getAllSensorsByGateway).toHaveBeenCalledWith(networkCode, gatewayMac);
  });

  it("get all sensors: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create sensor", async () => {
    const newSensor = { macAddress: sensorMac, name: "Sensor 1" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", token)
      .send(newSensor);

    expect(response.status).toBe(201);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(sensorController.createSensor).toHaveBeenCalledWith(SensorFromJSON(newSensor), networkCode, gatewayMac);
  });

  it("create sensor: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", "Bearer invalid")
      .send({ macAddress: sensorMac, name: "Sensor 1" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create sensor: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", token)
      .send({ macAddress: sensorMac, name: "Sensor 1" });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("get sensor by MAC address", async () => {
    const mockSensor = { macAddress: sensorMac, name: "Sensor 1" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getSensorByMacAddress as jest.Mock).mockResolvedValue(mockSensor);

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSensor);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
      UserType.Viewer,
    ]);
    expect(sensorController.getSensorByMacAddress).toHaveBeenCalledWith(sensorMac, networkCode, gatewayMac);
  });

  it("update sensor", async () => {
    const updatedSensor = { macAddress: sensorMac, name: "Updated Sensor" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", token)
      .send(updatedSensor);

    expect(response.status).toBe(204);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(sensorController.updateSensor).toHaveBeenCalledWith(SensorFromJSON(updatedSensor), sensorMac, networkCode, gatewayMac);
  });

  it("delete sensor", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.deleteSensor as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(sensorController.deleteSensor).toHaveBeenCalledWith(sensorMac, networkCode, gatewayMac);
  });
});
