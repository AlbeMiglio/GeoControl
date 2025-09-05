import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { UserRepository } from "@repositories/UserRepository";


describe("DELETE /users/:userName (e2e)", () => {
    let adminToken: string;
    let operatorToken: string;

    beforeAll(async () => {
        await beforeAllE2e();
        adminToken = generateToken(TEST_USERS.admin);
        operatorToken = generateToken(TEST_USERS.operator);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("204 – admin can delete a user", async () => {
        // Prima creiamo l’utente da eliminare
        const createRes = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                username: "tobedeleted",
                password: "password123!",
                type: "viewer"
            });
        expect(createRes.status).toBe(201);

        const res = await request(app)
            .delete("/api/v1/users/tobedeleted")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });

    it("401 – no token provided", async () => {
        const res = await request(app).delete("/api/v1/users/viewer");
        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                name: "Unauthorized",
                message: expect.stringMatching(/Authorization header required/i)
            })
        );
    });

    it("403 – operator cannot delete user", async () => {
        const res = await request(app)
            .delete(`/api/v1/users/${TEST_USERS.viewer.username}`)
            .set("Authorization", `Bearer ${operatorToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 403,
                name: "InsufficientRightsError",
                message: expect.stringMatching(/insufficient rights/i)
            })
        );
    });

    it("404 – user not found", async () => {
        const res = await request(app)
            .delete("/api/v1/users/notexist")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 404,
                name: "NotFoundError",
                message: expect.stringMatching(/not found/i)
            })
        );
    });

    it("500 – internal server error", async () => {
        const spy = jest
            .spyOn(UserRepository.prototype, "deleteUser")
            .mockRejectedValueOnce(new Error("unexpected error"));

        const res = await request(app)
            .delete("/api/v1/users/internalfail")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 500,
                name: "InternalServerError",
                message: expect.stringMatching(/unexpected error/i)
            })
        );

        spy.mockRestore();
    });
});
