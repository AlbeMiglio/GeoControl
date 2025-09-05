import request from "supertest";
import { app } from "@app";
import * as measurementController from "@controllers/measurementController";
import * as authService from "@services/authService";
import { UserType } from "@models/UserType";

jest.mock("@controllers/measurementController");
jest.mock("@services/authService");

describe("MeasurementRoutes integration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const networkCode = "net123";
  const gatewayMac = "gw001";
  const sensorMac = "sensor001";
  const basePath = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`;
  const token = "Bearer faketoken";

  const measurementsPayload = [
    { createdAt: "2025-05-27T10:00:00Z", value: 10 },
    { createdAt: "2025-05-27T11:00:00Z", value: 20 }
  ];

  it("POST /sensors/:sensorMac/measurements should store measurements", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.storeMeasurements as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post(`${basePath}/${sensorMac}/measurements`)
      .set("Authorization", token)
      .send(measurementsPayload);

    expect(response.status).toBe(201);
    expect(measurementController.storeMeasurements).toHaveBeenCalled();
    expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin, UserType.Operator]);
  });

  it("GET /sensors/:sensorMac/measurements should return measurements", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    const fakeMeasurements = [
      { createdAt: "2025-05-27T10:00:00Z", value: 10 }
    ];
    const fakeData = {
      sensorMacAddress: sensorMac,
      measurements: fakeMeasurements,
    };
    (measurementController.getMeasurementsBySensor as jest.Mock).mockResolvedValue(fakeData);

    const response = await request(app)
      .get(`${basePath}/${sensorMac}/measurements`)
      .set("Authorization", token)
      .query({ startDate: "2025-05-01T00:00:00Z", endDate: "2025-05-30T00:00:00Z" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(fakeData);
    expect(measurementController.getMeasurementsBySensor).toHaveBeenCalledWith(
      expect.anything(), // networkCode
      expect.anything(), // gatewayMac
      sensorMac,
      new Date("2025-05-01"),
      new Date("2025-05-30")
    );
    expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin, UserType.Operator, UserType.Viewer]);
  });

  it("GET /sensors/:sensorMac/stats should return stats", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    const fakeStats = { mean: 15, max: 20, min: 10, variance: 5, upperThreshold: 100, lowerThreshold: -100 };
    (measurementController.getStatsBySensor as jest.Mock).mockResolvedValue(fakeStats);

    const response = await request(app)
      .get(`${basePath}/${sensorMac}/stats`)
      .set("Authorization", token)
      .query({ startDate: "2025-05-01T00:00:00Z", endDate: "2025-05-30T00:00:00Z" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(fakeStats);
    expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin, UserType.Operator, UserType.Viewer]);
  });

  it("GET /sensors/:sensorMac/outliers should return outliers", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    const fakeMeasurements = [{ createdAt: "2025-05-27T11:00:00Z", value: 100 }];
    const fakeData = {
      sensorMacAddress: sensorMac,
      measurements: fakeMeasurements,
    };
    (measurementController.getOutliersBySensor as jest.Mock).mockResolvedValue(fakeData);

    const response = await request(app)
      .get(`${basePath}/${sensorMac}/outliers`)
      .set("Authorization", token)
      .query({ startDate: "2025-05-01T00:00:00Z", endDate: "2025-05-30T00:00:00Z" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(fakeData);
    expect(measurementController.getOutliersBySensor).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      sensorMac,
      new Date("2025-05-01"),
      new Date("2025-05-30")
    );
    expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin, UserType.Operator, UserType.Viewer]);
  });

  it("GET /networks/:networkCode/measurements should return measurements for multiple sensors", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    const fakeData = [{ sensorMacAddress: "sensor001", measurements: [] }];
    (measurementController.getMeasurementsBySensors as jest.Mock).mockResolvedValue(fakeData);

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/measurements`)
      .set("Authorization", token)
      .query({ sensorMacs: "sensor001,sensor002", startDate: "2025-05-01T00:00:00Z", endDate: "2025-05-30T00:00:00Z" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(fakeData);
    expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin, UserType.Operator, UserType.Viewer]);
  });
});
