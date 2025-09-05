import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { ConflictError } from "@errors/ConflictError";
import { UserRepository } from "@repositories/UserRepository";

describe("POST /users (e2e)", () => {
    let adminToken: string;
    let operatorToken: string;

    const validUser = {
        username: "s0123465",
        password: "FR90!5g@+ni",
        type: "admin"
    };

    beforeAll(async () => {
        await beforeAllE2e();
        adminToken = generateToken(TEST_USERS.admin);
        operatorToken = generateToken(TEST_USERS.operator);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("201 – admin can create a user", async () => {
        const res = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validUser);

        expect(res.status).toBe(201);
    });

    it("400 – missing required fields", async () => {
        const res = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ username: "noPassword" }); // missing password & type

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 400,
                name: "Bad Request",
                //message: expect.stringMatching(/must have required property/i)
            })
        );
    });

    it("401 – unauthorized when no token is provided", async () => {
        const res = await request(app)
            .post("/api/v1/users")
            .send(validUser);

        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                name: "Unauthorized",
                message: expect.stringMatching(/Authorization header required/i)
            })
        );
    });

    it("403 – operator cannot create users", async () => {
        const res = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${operatorToken}`)
            .send({ ...validUser, username: "opuser" });

        expect(res.status).toBe(403);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 403,
                name: "InsufficientRightsError",
                message: expect.stringMatching(/insufficient rights/i)
            })
        );
    });

    it("409 – conflict when username already exists", async () => {
        // Simula conflitto con uno stub
        const spy = jest
            .spyOn(UserRepository.prototype, "createUser")
            .mockRejectedValueOnce(new ConflictError("User with username already exists"));

        const res = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ ...validUser, username: "conflictUser" });

        expect(res.status).toBe(409);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 409,
                name: "ConflictError",
                message: expect.stringMatching(/already exists/i)
            })
        );

        spy.mockRestore();
    });

    it("500 – internal server error", async () => {
        const spy = jest
            .spyOn(UserRepository.prototype, "createUser")
            .mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ ...validUser, username: "trigger500" });

        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 500,
                name: "InternalServerError",
                message: expect.stringMatching(/db error/i)
            })
        );

        spy.mockRestore();
    });
});
