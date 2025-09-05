import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";
import {UserRepository} from "@repositories/UserRepository";

describe("GET /users (e2e)", () => {
  let token: string;
  let operatorToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
    operatorToken = generateToken(TEST_USERS.operator);
    viewerToken = generateToken(TEST_USERS.viewer);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("200 - get all users", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const usernames = res.body.map((u: any) => u.username).sort();
    const types = res.body.map((u: any) => u.type).sort();

    expect(usernames).toEqual(["admin", "operator", "viewer"]);
    expect(types).toEqual(["admin", "operator", "viewer"]);
  });

  it("401 – missing or malformed token", async () => {
    const res = await request(app)
        .get("/api/v1/users");

    expect(res.status).toBe(401);
    expect(res.body).toEqual(
        expect.objectContaining({
          code: 401,
          name: "Unauthorized",
          message: expect.stringMatching(/Authorization header required/i),
        })
    );
  });

  it("403 – viewer cannot access users list", async () => {
    const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual(
        expect.objectContaining({
          code: 403,
          name: "InsufficientRightsError",
          message: expect.stringMatching(/insufficient rights/i),
        })
    );
  });

  it("403 – operator cannot access users list", async () => {
    const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual(
        expect.objectContaining({
          code: 403,
          name: "InsufficientRightsError",
          message: expect.stringMatching(/insufficient rights/i),
        })
    );
  });

  it("500 – internal server error", async () => {
    const spy = jest
        .spyOn(UserRepository.prototype, "getAllUsers")
        .mockRejectedValueOnce(new Error("DB down"));

    const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual(
        expect.objectContaining({
          code: 500,
          name: "InternalServerError",
          message: "DB down",
        })
    );

    spy.mockRestore();
  });
});
