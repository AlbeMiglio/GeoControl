import request from "supertest";
import { app } from "@app";
import * as authController from "@controllers/authController";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { NotFoundError } from "@errors/NotFoundError";
import { BadRequestError } from "@errors/BadRequestError";

// Mock the auth controller
jest.mock("@controllers/authController");

describe("AuthenticationRoutes integration", () => {
  const mockGetToken = authController.getToken as jest.MockedFunction<typeof authController.getToken>;

  afterEach(() => {
    jest.clearAllMocks();
  });


    const validUserData = {
      username: "testuser",
      password: "testpassword"
    };

    const mockTokenResponse = {
      token: "mock-jwt-token-12345"
    };

    it("should authenticate user and return token with 200 status", async () => {
      // Arrange
      mockGetToken.mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(validUserData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(mockTokenResponse);
      expect(mockGetToken).toHaveBeenCalledWith({
        username: validUserData.username,
        password: validUserData.password
      });
      expect(mockGetToken).toHaveBeenCalledTimes(1);
    });

    it("should return 401 when credentials are invalid", async () => {
      // Arrange
      const invalidUserData = {
        username: "testuser",
        password: "wrongpassword"
      };

      mockGetToken.mockRejectedValue(new UnauthorizedError("Invalid password"));

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(invalidUserData)
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        code: 401,
        message: "Invalid password",
        name: "UnauthorizedError"
      });
      expect(mockGetToken).toHaveBeenCalledWith({
        username: invalidUserData.username,
        password: invalidUserData.password
      });
    });

    it("should return 404 when user does not exist", async () => {
      // Arrange
      const nonExistentUserData = {
        username: "nonexistent",
        password: "somepassword"
      };

      mockGetToken.mockRejectedValue(new NotFoundError("User not found"));

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(nonExistentUserData)
        .expect(404);

      // Assert
      expect(response.body).toEqual({
        code: 404,
        message: "User not found",
        name: "NotFoundError"
      });
      expect(mockGetToken).toHaveBeenCalledWith({
        username: nonExistentUserData.username,
        password: nonExistentUserData.password
      });
    });

    it("should handle malformed JSON", async () => {
      // Act
      await request(app)
        .post("/api/v1/auth")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(400); // Express should return 400 for malformed JSON
    });

    it("should handle internal server errors", async () => {
      // Arrange
      mockGetToken.mockRejectedValue(new Error("Database connection failed"));

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(validUserData)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        code: 500,
        message: "Database connection failed",
        name: "InternalServerError"
      });
      expect(mockGetToken).toHaveBeenCalledWith({
        username: validUserData.username,
        password: validUserData.password
      });
    });

    it("should handle different user types authentication", async () => {
      // Arrange - Admin user
      const adminUserData = {
        username: "admin",
        password: "adminpass"
      };

      const adminTokenResponse = {
        token: "admin-jwt-token"
      };

      mockGetToken.mockResolvedValue(adminTokenResponse);

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(adminUserData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(adminTokenResponse);
      expect(mockGetToken).toHaveBeenCalledWith({
        username: adminUserData.username,
        password: adminUserData.password
      });
    });

    it("should handle operator user authentication", async () => {
      // Arrange - Operator user
      const operatorUserData = {
        username: "operator",
        password: "operatorpass"
      };

      const operatorTokenResponse = {
        token: "operator-jwt-token"
      };

      mockGetToken.mockResolvedValue(operatorTokenResponse);

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(operatorUserData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(operatorTokenResponse);
      expect(mockGetToken).toHaveBeenCalledWith({
        username: operatorUserData.username,
        password: operatorUserData.password
      });
    });

    it("should handle viewer user authentication", async () => {
      // Arrange - Viewer user
      const viewerUserData = {
        username: "viewer",
        password: "viewerpass"
      };

      const viewerTokenResponse = {
        token: "viewer-jwt-token"
      };

      mockGetToken.mockResolvedValue(viewerTokenResponse);

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(viewerUserData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(viewerTokenResponse);
      expect(mockGetToken).toHaveBeenCalledWith({
        username: viewerUserData.username,
        password: viewerUserData.password
      });
    });

    it("should handle special characters in credentials", async () => {
      // Arrange
      const specialCharUserData = {
        username: "user@example.com",
        password: "p@ssw0rd!123"
      };

      mockGetToken.mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(specialCharUserData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(mockTokenResponse);
      expect(mockGetToken).toHaveBeenCalledWith({
        username: specialCharUserData.username,
        password: specialCharUserData.password
      });
    });

    it("should handle unicode characters in credentials", async () => {
      // Arrange
      const unicodeUserData = {
        username: "usuário",
        password: "señal123"
      };

      mockGetToken.mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(unicodeUserData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(mockTokenResponse);
      expect(mockGetToken).toHaveBeenCalledWith({
        username: unicodeUserData.username,
        password: unicodeUserData.password
      });
    });

    it("should handle very long credentials", async () => {
      // Arrange
      const longUserData = {
        username: "a".repeat(1000),
        password: "b".repeat(1000)
      };

      mockGetToken.mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(longUserData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(mockTokenResponse);
      expect(mockGetToken).toHaveBeenCalledWith({
        username: longUserData.username,
        password: longUserData.password
      });
    });


    it("should handle additional fields in request body", async () => {
      // Arrange
      const extraFieldsUserData = {
        username: "testuser",
        password: "testpassword",
        extraField: "should be ignored",
        anotherField: 123
      };

      mockGetToken.mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(extraFieldsUserData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(mockTokenResponse);
      // UserFromJSON should filter out extra fields
      expect(mockGetToken).toHaveBeenCalledWith({
        username: extraFieldsUserData.username,
        password: extraFieldsUserData.password
      });
    });



    it("should handle BadRequestError", async () => {
      // Arrange
      const userData = {
        username: "testuser",
        password: "testpassword"
      };

      mockGetToken.mockRejectedValue(new BadRequestError("Invalid request format"));

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        code: 400,
        message: "Invalid request format",
        name: "BadRequest"
      });
    });

    it("should handle unexpected error types", async () => {
      // Arrange
      const userData = {
        username: "testuser",
        password: "testpassword"
      };

      mockGetToken.mockRejectedValue(new TypeError("Unexpected type error"));

      // Act
      const response = await request(app)
        .post("/api/v1/auth")
        .send(userData)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        code: 500,
        message: "Unexpected type error",
        name: "InternalServerError"
      });
    });

});
