// test/e2e/network/updateNetwork.e2e.test.ts
import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { NetworkRepository } from "@repositories/NetworkRepository";
import {ConflictError} from "@errors/ConflictError";

describe("PATCH /networks/:networkCode (e2e)", () => {
    let adminToken: string;
    let operatorToken: string;
    let viewerToken: string;
    const newNetwork = {
        code: "NET01",
        name: "Test Network",
        description: "Network for tests"
    };
    const updateData = {
        code: "NEWCODE",
        name: "Updated Name",
        description: "Updated Description",
        gateways: [{ macAddress: "AA:BB:CC:DD:EE:FF", name: "IgnoredGW" }],
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

    it("204 – admin can update a network", async () => {
        await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newNetwork);
            
        const res = await request(app)
            .patch("/api/v1/networks/NET01")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(updateData);
        expect(res.status).toBe(204);


        const getRes = await request(app)
            .get("/api/v1/networks/NEWCODE")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body).toMatchObject({
            code: "NEWCODE",
            name: "Updated Name",
            description: "Updated Description",
        });
    });

    it("204 – operator can update a network", async () => {
        await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newNetwork);
        const res = await request(app)
            .patch("/api/v1/networks/NET01")
            .set("Authorization", `Bearer ${operatorToken}`)
            .send({ ...updateData, code: "NEWCODE2" });

        expect(res.status).toBe(204);
    });

    it("400 – missing required fields", async () => {
        await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                code: "NET01",
                name: "Initial Name",
                description: "Initial Description"
            });
        const res = await request(app)
            .patch("/api/v1/networks/NET01")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({});
        console.log(res.body);
        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 400,
                name: "BadRequest",
                //message: expect.stringMatching(/missing required fields/i),
            })
        );
    });

    it("401 – unauthenticated requests", async () => {
        const res = await request(app)
            .patch("/api/v1/networks/NEWCODE2")
            .send(updateData);

        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                //name: "Unauthorized",
            })
        );
    });

    it("403 – viewer cannot update networks", async () => {

        const res = await request(app)
            .patch("/api/v1/networks/NET01")
            .set("Authorization", `Bearer ${viewerToken}`)
            .send(updateData);

        expect(res.status).toBe(403);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 403,
                //name: "InsufficientRightsError",
            })
        );
    });

    it("404 – network not found", async () => {

        const res = await request(app)
            .patch("/api/v1/networks/UNKNOWN")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(updateData);

        expect(res.status).toBe(404);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 404,
                //name: "NotFoundError",
                //message: "Entity not found",
            })
        );
    });

    it("409 – conflict when new code already exists", async () => {
        // Simuliamo che updateNetwork lanci un errore di conflitto
        const spy = jest
            .spyOn(NetworkRepository.prototype, "updateNetwork")
            .mockRejectedValueOnce(new ConflictError("Network with code already exists"));

        const res = await request(app)
            .patch("/api/v1/networks/NEWCODE2")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ code: "NET01", name: "Dup", description: "Dup" });

        expect(res.status).toBe(409);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 409,
                name: "ConflictError",
            })
        );

        spy.mockRestore();
    });

    it("500 – internal server error", async () => {

        const spy = jest
            .spyOn(NetworkRepository.prototype, "updateNetwork")
            .mockRejectedValueOnce(new Error("DB failure"));

        const res = await request(app)
            .patch("/api/v1/networks/NEWCODE2")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(updateData);

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
