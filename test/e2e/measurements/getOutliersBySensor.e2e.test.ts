import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { generateToken } from "@services/authService";
import {MeasurementRepository} from "@repositories/MeasurementRepository";

describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers", () => {
    let token: string;
    let adminToken: string;

    const networkCode = "TESTNET1";
    const gatewayMac = "94:3F:BE:4C:4A:79";
    const sensorMac = "71:B1:CE:01:C6:A9";
    const newNetwork = {
        code: networkCode,
        name: "Test Network",
        description: "Network for tests",
    };
    const newGateway = {
        macAddress: gatewayMac,
        name: "Test Gateway",
        description: "Gateway for tests",
    }
    const newSensor = {
        macAddress: sensorMac,
        name: "Test Sensor",
        description: "Sensor for tests",
        variable: "temperature",
        unit: "Celsius",
    }
    const m1 = [
        {
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 21.5
        }
    ];
    const m2 = [
        {
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 1.8567
        }
    ];
    const m3 = [
        {
            createdAt: "2021-02-18T17:01:00+01:00",
            value: 16.5
        }
    ];
    const mOutlier1 = [
        {
            createdAt: "2025-02-18T17:02:00+01:00",
            value: 300.5,
            isOutlier: true
        }
    ];
    const mOutlier2 = [
        {
            createdAt: "2025-02-18T17:03:00+01:00",
            value: -240,
            isOutlier: true
        }
    ];

    const query = {
        startDate: "2025-02-18T15:00:00+01:00",
        endDate: "2025-02-18T18:00:00+01:00",
    };

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.viewer);
        adminToken = generateToken(TEST_USERS.admin);
        await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newNetwork);
        await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newGateway);
        await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newSensor);
        await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(m1);
        await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(m2);
        await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(m3);
        await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(mOutlier1);
        await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(mOutlier2);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("200 – returns outlier measurements for sensor",
        async () => {
            const res = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
                .set("Authorization", `Bearer ${token}`)
                .query(query);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                sensorMacAddress: sensorMac,
                stats: expect.objectContaining({
                    startDate: expect.any(String),
                    endDate: expect.any(String),
                    mean: expect.any(Number),
                    variance: expect.any(Number),
                    upperThreshold: expect.any(Number),
                    lowerThreshold: expect.any(Number),
                }),
                measurements: expect.any(Array),
            });
            // Ensure measurements is an array of outliers
            expect(Array.isArray(res.body.measurements)).toBe(true);
            expect(res.body.measurements.every((m: any) => m.isOutlier === true)).toBe(true);
            expect(res.body.measurements).toHaveLength(2);
        });

    it("400 – returns error for invalid startDate format", async () => {
        const res = await request(app)
            .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
            .set("Authorization", `Bearer ${token}`)
            .query({
                startDate: "invalid-date",
                endDate: query.endDate,
            });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe(400);
        expect(res.body.name).toBe("Bad Request");
    });

    it("401 – returns error if no auth token", async () => {
        const res = await request(app)
            .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
            .query(query);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe(401);
        expect(res.body.name).toBe("Unauthorized");
    });

    it("404 – returns error if sensor/gateway/network not found", async () => {
        const res = await request(app)
            .get(`/api/v1/networks/UNKNOWN/gateways/00:00:00:00:00:00/sensors/00:00:00:00:00:00/outliers`)
            .set("Authorization", `Bearer ${token}`)
            .query(query);

        expect(res.status).toBe(404);
        expect(res.body.code).toBe(404);
        expect(res.body.name).toBe("NotFoundError");
    });

    it("500 - internal server error (getAllOutliersBySensor)", async () => {
        const spy = jest
            .spyOn(MeasurementRepository.prototype, "getMeasurementsBySensor")
            .mockRejectedValueOnce(new Error("Computation failure"));

        const res = await request(app)
            .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 500,
                message: "Computation failure",
                name: "InternalServerError",
            }),
        );

        spy.mockRestore();
    });
});