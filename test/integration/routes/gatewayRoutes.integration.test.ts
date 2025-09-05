import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as gatewayController from "@controllers/gatewayController";
import { GatewayFromJSON } from "@dto/Gateway";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/gatewayController");

describe("GatewayRoutes integration", () => {
  const token = "Bearer faketoken";
  const networkCode = "net1";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("get all gateways by network", async () => {
    const mockGateways = [
      { macAddress: "AA:BB:CC:DD:EE:FF", name: "Gateway 1" },
      { macAddress: "11:22:33:44:55:66", name: "Gateway 2" },
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.getAllGatewaysByNetwork as jest.Mock).mockResolvedValue(mockGateways);

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockGateways);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
      UserType.Viewer,
    ]);
    expect(gatewayController.getAllGatewaysByNetwork).toHaveBeenCalledWith(networkCode);
  });

  it("get all gateways: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create gateway", async () => {
    const newGateway = { macAddress: gatewayMac, name: "Gateway 1" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", token)
      .send(newGateway);

    expect(response.status).toBe(201);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(gatewayController.createGateway).toHaveBeenCalledWith(GatewayFromJSON(newGateway), networkCode);
  });

  it("create gateway: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", "Bearer invalid")
      .send({ macAddress: gatewayMac, name: "Gateway 1" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create gateway: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", token)
      .send({ macAddress: gatewayMac, name: "Gateway 1" });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("get gateway by MAC address", async () => {
    const mockGateway = { macAddress: gatewayMac, name: "Gateway 1" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.getGatewayByMacAddress as jest.Mock).mockResolvedValue(mockGateway);

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockGateway);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
      UserType.Viewer,
    ]);
    expect(gatewayController.getGatewayByMacAddress).toHaveBeenCalledWith(gatewayMac, networkCode);
  });

  it("update gateway", async () => {
    const updatedGateway = { macAddress: gatewayMac, name: "Updated Gateway" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
      .set("Authorization", token)
      .send(updatedGateway);

    expect(response.status).toBe(204);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(gatewayController.updateGateway).toHaveBeenCalledWith(GatewayFromJSON(updatedGateway), gatewayMac, networkCode);
  });

  it("delete gateway", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(gatewayController.deleteGateway).toHaveBeenCalledWith(gatewayMac, networkCode);
  });
});
