import request from "supertest";
import { app } from "@app";
import {afterAllE2e, beforeAllE2e, TEST_USERS} from "@test/e2e/lifecycle";
import {generateToken} from "@services/authService";
import {NetworkRepository} from "@repositories/NetworkRepository";

describe("get /networks ", () => {
    let token: string;
    let networkCode: string
    let gatewayMac: string

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);


        // Create a test network
        await request(app).post("/api/v1/networks").set("Authorization", `Bearer ${token}`).send({
            code: "NET001",
            name: "Test Network",
            description: "Test Location",
        })
        networkCode = "NET001"
        await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "AA:BB:CC:DD:EE:FF",
                name: "Test Gateway",
            })
        gatewayMac = "AA:BB:CC:DD:EE:FF"
        await request(app).post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`).set("Authorization", `Bearer ${token}`).send({
            macAddress: "11:22:33:44:55:66",
            name: "Sensor 1",
            variable: "temperature",
        })

        await request(app).post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`).set("Authorization", `Bearer ${token}`).send({
            macAddress: "AA:BB:CC:DD:EE:00",
            name: "Sensor 2",
            variable: "humidity",
        })

    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("get all networks", async () => {
        const res = await request(app)
            .get("/api/v1/networks")
            .set("Authorization", `Bearer ${token}`)
        console.log(res.body);
        expect(res.status).toBe(200);

        /*
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toMatchObject({
            code: "NET01",
            name: "Alp Monitor",
            description: "Alpine Weather Monitoring Network",
            gateways: [
                {
                    macAddress: "94:3F:BE:4C:4A:79",
                    name: "GW01",
                    description: "on-field aggregation node",
                    sensors: [
                        {
                            macAddress: "71:B1:CE:01:C6:A9",
                            name: "TH01",
                            description: "External thermometer",
                            variable: "temperature",
                            unit: "C"
                        }
                    ]
                }
            ]
        });*/
    });

    it('401 for missing or invalid token', async () => {
        const res = await request(app).get('/api/v1/networks');
        expect(res.statusCode).toBe(401);
        console.log(res.body);

        //expect(res.body).toHaveProperty('code', '401');
        //expect(res.body).toHaveProperty("name", "UnauthorizedError");
        //expect(res.body).toHaveProperty("message", "Unauthorized: Invalid token format");
    });

    it("500 – errore interno del server", async () => {
        const spy = jest
            .spyOn(NetworkRepository.prototype, "getAllNetworks")
            .mockRejectedValueOnce(new Error("DB failure"));

        const res = await request(app)
            .get("/api/v1/networks")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 500,
                name: "InternalServerError",
            })
        );
        spy.mockRestore();
    });

});
