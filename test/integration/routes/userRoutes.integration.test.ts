import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as userController from "@controllers/userController";
import { UserType } from "@models/UserType";
import { User as UserDTO } from "@dto/User";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/userController");

describe("UserRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("get all users", async () => {
    const mockUsers: UserDTO[] = [
      { username: "admin", type: UserType.Admin },
      { username: "viewer", type: UserType.Viewer }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin
    ]);
    expect(userController.getAllUsers).toHaveBeenCalled();
  });

  it("get all users: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get all users: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("create user", async () => {
    const newUser: UserDTO = { username: "newuser", password: "newpass", type: UserType.Viewer };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.createUser as jest.Mock).mockResolvedValue(newUser);

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", token)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin
    ]);
    expect(userController.createUser).toHaveBeenCalledWith(newUser);
  });

  it("create user: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", "Bearer invalid")
      .send({ username: "newuser", password: "newpass", type: UserType.Viewer });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create user: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", token)
      .send({ username: "newuser", password: "newpass", type: UserType.Viewer });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("delete user", async () => {
    const username = "userToDelete";

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.deleteUser as jest.Mock).mockResolvedValue({ success: true });

    const response = await request(app)
      .delete(`/api/v1/users/${username}`)
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin
    ]);
    expect(userController.deleteUser).toHaveBeenCalledWith(username);
  });

  it("delete user: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .delete("/api/v1/users/userToDelete")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("delete user: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .delete("/api/v1/users/userToDelete")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

 it("get user by username", async () => {
    const username = "testuser";
    const mockUser: UserDTO = { username, type: UserType.Viewer };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getUser as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app)
      .get(`/api/v1/users/${username}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin
    ]);
    expect(userController.getUser).toHaveBeenCalledWith(username);
  });

  it("get user by username: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get("/api/v1/users/testuser")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get user by username: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get("/api/v1/users/testuser")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("get all users: 500 Internal Server Error", async () => {
  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (userController.getAllUsers as jest.Mock).mockImplementation(() => {
    throw new Error("Database error");
  });

  const response = await request(app)
    .get("/api/v1/users")
    .set("Authorization", token);

  expect(response.status).toBe(500);
  expect(response.body.message).toMatch(/Database error/);
});

it("returns 404 for unknown route", async () => {
  const response = await request(app).get("/api/v1/nonexistent");
  expect(response.status).toBe(404);
});


});
