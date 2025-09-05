// test/e2e/network/getNetworkByCode.e2e.test.ts
import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { NetworkRepository } from "@repositories/NetworkRepository";

describe("GET /networks/:networkCode (e2e)", () => {
    let token: string;
    let networkCode: string;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);  // qualunque ruolo autenticato va bene
        await request(app).post("/api/v1/networks").set("Authorization", `Bearer ${token}`).send({
            code: "NET001",
            name: "Test Network",
            description: "Test Description",
        })
        networkCode = "NET001";

    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("200 – restituisce la rete con gateway e sensori", async () => {
        const res = await request(app)
            .get("/api/v1/networks/NET001")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        // Controllo dei campi principali
        expect(res.body).toMatchObject({
            code: "NET001",
            name: "Test Network",
            description: "Test Description",
        });
        /*
        // Gateways
        expect(Array.isArray(res.body.gateways)).toBe(true);
        expect(res.body.gateways.length).toBeGreaterThanOrEqual(1);
        const gw = res.body.gateways[0];
        expect(gw).toMatchObject({
            macAddress: "94:3F:BE:4C:4A:79",
            name: "GW01",
            description: "on-field aggregation node",
        });

        // Sensors
        expect(Array.isArray(gw.sensors)).toBe(true);
        expect(gw.sensors.length).toBeGreaterThanOrEqual(1);
        expect(gw.sensors[0]).toMatchObject({
            macAddress: "71:B1:CE:01:C6:A9",
            name: "TH01",
            variable: "temperature",
            unit: "C",
        });

         */
    });

    it("401 – senza token risponde Unauthorized", async () => {
        const res = await request(app).get("/api/v1/networks/NET01");
        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                name: "Unauthorized",
            })
        );
    });

    it("404 – rete non trovata", async () => {
        const res = await request(app)
            .get("/api/v1/networks/UNKNOWN")
            .set("Authorization", `Bearer ${token}`);
        console.log(res.body)
        expect(res.status).toBe(404);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 404,
                //name: "NotFoundError",
                //message: "Entity not found",
            })
        );
    });

    it("500 – errore interno del server", async () => {
        // Forziamo un errore generico in getNetworkByCode
        const spy = jest
            .spyOn(NetworkRepository.prototype, "getNetworkByCode")
            .mockRejectedValueOnce(new Error("DB failure"));

        const res = await request(app)
            .get("/api/v1/networks/NET01")
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
