// test/e2e/network/deleteNetwork.e2e.test.ts
import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { NetworkRepository } from "@repositories/NetworkRepository";

describe("DELETE /networks/:networkCode (e2e)", () => {
    let adminToken: string;
    let operatorToken: string;
    let viewerToken: string;

    beforeAll(async () => {
        await beforeAllE2e();
        adminToken    = generateToken(TEST_USERS.admin);
        operatorToken = generateToken(TEST_USERS.operator);
        viewerToken   = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("204 – admin can delete a network", async () => {
        await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ code: "TMP", name: "Tmp", description: "Tmp" });

        const res = await request(app)
            .delete("/api/v1/networks/TMP")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(204);

        // Verifica opzionale: GET su NET01 ora deve restituire 404
        const getRes = await request(app)
            .get("/api/v1/networks/NET01")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(getRes.status).toBe(404);
    });

    it("204 – operator can delete a network", async () => {
        // Ricreiamo un network temporaneo per il test
        await request(app)
            .post("/api/v1/networks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ code: "TMP", name: "Tmp", description: "Tmp" });

        const res = await request(app)
            .delete("/api/v1/networks/TMP")
            .set("Authorization", `Bearer ${operatorToken}`);

        expect(res.status).toBe(204);
    });

    it("401 – unauthenticated requests", async () => {
        const res = await request(app).delete("/api/v1/networks/NET01");
        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                name: "Unauthorized",
            })
        );
    });

    it("403 – viewer cannot delete networks", async () => {
        const res = await request(app)
            .delete("/api/v1/networks/NET01")
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 403,
                name: "InsufficientRightsError",
            })
        );
    });

    it("404 – network not found", async () => {
        const res = await request(app)
            .delete("/api/v1/networks/UNKNOWN")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 404,
                name: "NotFoundError",
                //message: "Entity not found",
            })
        );
    });

    it("500 – internal server error", async () => {
        // Forziamo un errore in deleteNetwork
        const spy = jest
            .spyOn(NetworkRepository.prototype, "deleteNetwork")
            .mockRejectedValueOnce(new Error("DB failure"));

        const res = await request(app)
            .delete("/api/v1/networks/NET01")
            .set("Authorization", `Bearer ${adminToken}`);

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
