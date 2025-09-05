import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { generateToken } from "@services/authService";
import {MeasurementRepository} from "@repositories/MeasurementRepository";

describe("GET /networks/:networkCode/outliers", () => {
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
        sensorMacs: [sensorMac],
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

    it("200 – returns only outlier measurements", async () => {
        const res = await request(app)
            .get(`/api/v1/networks/${networkCode}/outliers`)
            .set("Authorization", `Bearer ${token}`)
            .query(query);
        console.log(res.body);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        for (const sensorData of res.body) {
            expect(sensorData.sensorMac).toBeDefined();
            expect(sensorData.stats).toEqual(
                expect.objectContaining({
                    startDate: expect.any(String),
                    endDate: expect.any(String),
                    mean: expect.any(Number),
                    variance: expect.any(Number),
                })
            );

            for (const m of sensorData.measurements) {
                expect(m.isOutlier).toBe(true);
            }
        }
    });

    it("400 – invalid date format", async () => {
        const res = await request(app)
            .get(`/api/v1/networks/${networkCode}/outliers`)
            .set("Authorization", `Bearer ${token}`)
            .query({
                sensorMacs: [sensorMac],
                startDate: "bad-date",
                endDate: "2025-02-18T18:00:00+01:00",
            });

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 400,
                name: "Bad Request",
            })
        );
    });

    it("401 – no token", async () => {
        const res = await request(app)
            .get(`/api/v1/networks/${networkCode}/outliers`)
            .query(query);

        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                name: "Unauthorized",
            })
        );
    });

    it("404 – network not found", async () => {
        const res = await request(app)
            .get(`/api/v1/networks/INVALID_CODE/outliers`)
            .set("Authorization", `Bearer ${token}`)
            .query(query);

        expect(res.status).toBe(404);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 404,
                name: "NotFoundError",
            })
        );
    });

    it("500 - internal server error (getAllOutliersByNetwork)", async () => {
        const spy = jest
            .spyOn(MeasurementRepository.prototype, "getMeasurementsBySensors")
            .mockRejectedValueOnce(new Error("Failed to compute outliers"));

        const res = await request(app)
            .get(`/api/v1/networks/${networkCode}/outliers`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 500,
                message: "Failed to compute outliers",
                name: "InternalServerError",
            }),
        );

        spy.mockRestore();
    });


})