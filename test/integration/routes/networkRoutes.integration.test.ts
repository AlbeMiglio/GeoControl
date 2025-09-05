import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as networkController from "@controllers/networkController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { BadRequestError } from "@models/errors/BadRequestError";


jest.mock("@services/authService");
jest.mock("@controllers/networkController");

describe("NetworkRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("get all networks", async () => {
    const mockNetworks = [
      { code: "net1", name: "Network 1" },
      { code: "net2", name: "Network 2" },
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

    const response = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetworks);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
      UserType.Viewer,
    ]);
    expect(networkController.getAllNetworks).toHaveBeenCalled();
  });

  it("get all networks: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create network", async () => {
    const newNetwork = { code: "net3", name: "Network 3" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send(newNetwork);

    expect(response.status).toBe(201);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(networkController.createNetwork).toHaveBeenCalledWith(expect.any(Object)); // JSON convertito da NetworkFromJSON
  });

  it("create network: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", "Bearer invalid")
      .send({ code: "net3", name: "Network 3" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create network: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ code: "net3", name: "Network 3" });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("get network by code", async () => {
    const networkCode = "net1";
    const mockNetwork = { networkCode, name: "Network 1" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getNetworkByCode as jest.Mock).mockResolvedValue(mockNetwork);

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetwork);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
      UserType.Viewer,
    ]);
    expect(networkController.getNetworkByCode).toHaveBeenCalledWith(networkCode);
  });

  it("update network", async () => {
    const networkCode = "net1";
    const updatedNetwork = { networkCode, name: "Updated Network" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .patch(`/api/v1/networks/${networkCode}`)
      .set("Authorization", token)
      .send(updatedNetwork);

    expect(response.status).toBe(204);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(networkController.updateNetwork).toHaveBeenCalledWith(expect.any(Object), networkCode);
  });

  it("delete network", async () => {
    const networkCode = "net1";

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/v1/networks/${networkCode}`)
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
    ]);
    expect(networkController.deleteNetwork).toHaveBeenCalledWith(networkCode);
  });

  // ----------- CASI LIMITE ------------

  it("get network by code: 404 NotFoundError", async () => {
    const networkCode = "nonexistent";

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getNetworkByCode as jest.Mock).mockImplementation(() => {
      throw new NotFoundError(`Network with code ${networkCode} not found`);
    });

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}`)
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/not found/i),
      })
    );
  });

  it("create network: 400 BadRequestError (invalid payload)", async () => {
    const invalidNetwork = { wrongField: "value" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNetwork as jest.Mock).mockImplementation(() => {
      throw new BadRequestError("Invalid network data");
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send(invalidNetwork);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: expect.stringMatching(/Bad Request/i)
      })
    );
  });

  it("update network: 404 NotFoundError", async () => {
    const networkCode = "nonexistent";
    const updateData = { networkCode, name: "Updated Name" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
      throw new NotFoundError(`Network with code ${networkCode} not found`);
    });

    const response = await request(app)
      .patch(`/api/v1/networks/${networkCode}`)
      .set("Authorization", token)
      .send(updateData);

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/not found/i),
      })
    );
  });

  it("delete network: 404 NotFoundError", async () => {
    const networkCode = "nonexistent";

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.deleteNetwork as jest.Mock).mockImplementation(() => {
      throw new NotFoundError(`Network with code ${networkCode} not found`);
    });

    const response = await request(app)
      .delete(`/api/v1/networks/${networkCode}`)
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/not found/i),
      })
    );
  });

    it("returns 404 for unknown route", async () => {
        const response = await request(app).get("/api/v1/nonexistent");
        expect(response.status).toBe(404);
    });

    

});
