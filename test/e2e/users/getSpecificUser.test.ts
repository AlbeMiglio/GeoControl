import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "../lifecycle";
import { UserRepository } from "@repositories/UserRepository";
import { UserDAO } from "@dao/UserDAO";


describe("GET /users/:userName (e2e)", () => {
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

    it("200 – admin can retrieve a user", async () => {
        const res = await request(app)
            .get(`/api/v1/users/${TEST_USERS.operator.username}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                username: TEST_USERS.operator.username,
                type: TEST_USERS.operator.type,
            })
        );
    });

    it("401 – no token provided", async () => {
        const res = await request(app).get(`/api/v1/users/${TEST_USERS.viewer.username}`);
        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 401,
                name: "Unauthorized"
            })
        );
    });

    it("403 – operator cannot retrieve user info", async () => {
        const res = await request(app)
            .get(`/api/v1/users/${TEST_USERS.viewer.username}`)
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
            .get("/api/v1/users/ghost")
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

    it("500 – internal server error on getUserByUsername", async () => {
        const fakeAdminDao = new UserDAO();
        fakeAdminDao.username = TEST_USERS.admin.username;
        fakeAdminDao.password = TEST_USERS.admin.password;
        fakeAdminDao.type = TEST_USERS.admin.type;
        const spy = jest
            .spyOn(UserRepository.prototype, "getUserByUsername")

            .mockImplementationOnce(async () => fakeAdminDao)

            .mockImplementationOnce(async () => {
                throw new Error("Simulated DB failure");
            });
        const res = await request(app)
            .get(`/api/v1/users/${TEST_USERS.operator.username}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({
                code: 500,
                name: "InternalServerError",
                //message: expect.stringMatching(/internal server error/i),
            })
        );
        spy.mockRestore();
    });

});
