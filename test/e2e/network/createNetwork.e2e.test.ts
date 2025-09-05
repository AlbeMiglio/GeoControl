// test/e2e/network/createNetwork.e2e.test.ts
import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { ConflictError } from "@errors/ConflictError";

describe("POST /networks (e2e)", () => {
    let adminToken: string;
    let operatorToken: string;
    let viewerToken: string;

    const newNetwork = {
        code: "NET99",
        name: "Test Network",
        description: "Network for tests",
        //gateways: [{ macAddress: "AA:BB:CC:DD:EE:FF", name: "ShouldBeIgnored" }],
    };

    beforeAll(async () => {
        await beforeAllE2e();
        adminToken    = generateToken(TEST_USERS.admin);
        operatorToken = generateToken(TEST_USERS.operator);
        viewerToken   = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("201 – admin can create a network", async () => {
        const res = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newNetwork);
        //console.log("Body:", res.body);
        expect(res.status).toBe(201);
    });

    it("201 – operator can create a network", async () => {
        const res = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${operatorToken}`)
            .send({ ...newNetwork, code: "NET98" });
        expect(res.status).toBe(201);
    });

    it("400 – missing required fields", async () => {
        const res = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name:"test name"});

        expect(res.status).toBe(400);

        expect(res.body).toEqual(
            expect.objectContaining({
                code:    400,
                name:    "Bad Request",
            }),
        );
    });

    it("401 – unauthenticated requests", async () => {
        const res = await request(app)
            .post("/api/v1/networks")
            .send(newNetwork);

        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                name: "Unauthorized",
            }),
        );
    });

    it("403 – viewer cannot create networks", async () => {
        const res = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${viewerToken}`)
            .send(newNetwork);

        expect(res.status).toBe(403);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 403,
                name: "InsufficientRightsError",
            }),
        );
    });

    it("409 – conflict when code already exists", async () => {
        // Montiamo un mock di repository per forzare il 409
        const spy = jest
            .spyOn(NetworkRepository.prototype, "createNetwork")
            .mockRejectedValueOnce(new ConflictError("Network with code already exists"));

        const res = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ code: "NET99", name: "Dup", description: "Duplicate" });

        console.log(res.body);

        expect(res.status).toBe(409);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 409,
                name: "ConflictError",
            }),
        );

        spy.mockRestore();
    });

    it("500 – internal server error", async () => {

        const spy = jest
            .spyOn(NetworkRepository.prototype, "createNetwork")
            .mockRejectedValueOnce(new Error("DB down"));

        const res = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ code: "NET100", name: "Err", description: "Should trigger 500" });

        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 500,
                message: "DB down",
                name: "InternalServerError",
            }),
        );

        spy.mockRestore();
    });
});
