import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { generateToken } from "@services/authService";
import {MeasurementRepository} from "@repositories/MeasurementRepository";

describe("POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    let adminToken: string;
    let operatorToken: string;
    let viewerToken: string;

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
    const payload = [
        {
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 21.5
        }
    ];
    const payload2 = [
        {
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 1.8567
        }
    ];

    beforeAll(async () => {
        await beforeAllE2e();
        adminToken = generateToken(TEST_USERS.admin);
        operatorToken = generateToken(TEST_USERS.operator);
        viewerToken = generateToken(TEST_USERS.viewer);
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

    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("201 – admin can store measurements", async () => {

        const res = await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(payload);
        expect(res.status).toBe(201);
    });

    it("201 – operator can store measurements", async () => {

        const res = await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(payload2);

        expect(res.status).toBe(201);
    });

    it("403 – viewer cannot store measurements", async () => {
        const res = await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${viewerToken}`)
            .send(payload);

        expect(res.status).toBe(403);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 403,
                name: "InsufficientRightsError",
            })
        );
    });

    it("400 – invalid input data", async () => {
        const invalidPayload = [{ createdAt: "invalidDate" , value: ""}];

        const res = await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(invalidPayload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 400,
                name: "Bad Request",
            })
        );
        const invalidPayload2 = [{ createdAt: "2025-03-18T17:00:00+01:00" }];
        const res2 = await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(invalidPayload2);
        expect(res2.status).toBe(400);
        expect(res2.body).toEqual(
            expect.objectContaining({
                code: 400,
                name: "Bad Request",
            })
        );
    });

    it("401 – unauthorized when no token is sent", async () => {
        const res = await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .send(payload);

        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                name: "Unauthorized",
            })
        );
    });

    it("404 – sensor not found", async () => {
        const res = await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/INVALID/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(payload);

        expect(res.status).toBe(404);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 404,
                name: "NotFoundError",
            })
        );
    });

    it("500 - internal server error", async () => {
        const spy = jest
            .spyOn(MeasurementRepository.prototype, "storeMeasurements")
            .mockRejectedValueOnce(new Error("DB down"));

        const res = await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(payload);

        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 500,
                message: "DB down",
                name: "InternalServerError",
            }),
        );

        spy.mockRestore();
    })
});