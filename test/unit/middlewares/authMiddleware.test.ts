import { Response, NextFunction } from "express";
import { authenticateUser, AuthenticatedRequest } from "@middlewares/authMiddleware";
import { processToken } from "@services/authService";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { InsufficientRightsError } from "@errors/InsufficientRightsError";

// Mock dependencies
jest.mock("@services/authService");

describe("AuthMiddleware", () => {
  let mockProcessToken: jest.MockedFunction<typeof processToken>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProcessToken = processToken as jest.MockedFunction<typeof processToken>;
    
    mockRequest = {
      headers: {}
    };
    
    mockResponse = {};
    
    mockNext = jest.fn();
  });

  describe("authenticateUser", () => {
    it("should call next() when authentication succeeds with no role restrictions", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer valid-token" };
      mockProcessToken.mockResolvedValue(undefined);
      
      const middleware = authenticateUser();

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer valid-token", []);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should call next() when authentication succeeds with role restrictions", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer admin-token" };
      mockProcessToken.mockResolvedValue(undefined);
      
      const allowedRoles = [UserType.Admin, UserType.Operator];
      const middleware = authenticateUser(allowedRoles);

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer admin-token", allowedRoles);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should call next() with default empty array when no roles specified", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer token" };
      mockProcessToken.mockResolvedValue(undefined);
      
      const middleware = authenticateUser();

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer token", []);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next() with error when processToken throws UnauthorizedError", async () => {
      // Arrange
      const unauthorizedError = new UnauthorizedError("Invalid token");
      mockRequest.headers = { authorization: "Bearer invalid-token" };
      mockProcessToken.mockRejectedValue(unauthorizedError);
      
      const middleware = authenticateUser();

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer invalid-token", []);
      expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should call next() with error when processToken throws InsufficientRightsError", async () => {
      // Arrange
      const insufficientRightsError = new InsufficientRightsError("Forbidden: Insufficient rights");
      mockRequest.headers = { authorization: "Bearer viewer-token" };
      mockProcessToken.mockRejectedValue(insufficientRightsError);
      
      const middleware = authenticateUser([UserType.Admin]);

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer viewer-token", [UserType.Admin]);
      expect(mockNext).toHaveBeenCalledWith(insufficientRightsError);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle missing authorization header", async () => {
      // Arrange
      const unauthorizedError = new UnauthorizedError("Unauthorized: No token provided");
      mockRequest.headers = {}; // No authorization header
      mockProcessToken.mockRejectedValue(unauthorizedError);
      
      const middleware = authenticateUser();

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith(undefined, []);
      expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
    });

    it("should handle malformed authorization header", async () => {
      // Arrange
      const unauthorizedError = new UnauthorizedError("Unauthorized: Invalid token format");
      mockRequest.headers = { authorization: "InvalidFormat" };
      mockProcessToken.mockRejectedValue(unauthorizedError);
      
      const middleware = authenticateUser();

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("InvalidFormat", []);
      expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
    });

    it("should handle all user types in allowed roles", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer multi-role-token" };
      mockProcessToken.mockResolvedValue(undefined);
      
      const allRoles = [UserType.Admin, UserType.Operator, UserType.Viewer];
      const middleware = authenticateUser(allRoles);

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer multi-role-token", allRoles);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle single role restriction", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer admin-only-token" };
      mockProcessToken.mockResolvedValue(undefined);
      
      const adminOnly = [UserType.Admin];
      const middleware = authenticateUser(adminOnly);

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer admin-only-token", adminOnly);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle generic Error from processToken", async () => {
      // Arrange
      const genericError = new Error("Database connection failed");
      mockRequest.headers = { authorization: "Bearer token" };
      mockProcessToken.mockRejectedValue(genericError);
      
      const middleware = authenticateUser();

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer token", []);
      expect(mockNext).toHaveBeenCalledWith(genericError);
    });

    it("should handle empty authorization header value", async () => {
      // Arrange
      const unauthorizedError = new UnauthorizedError("Unauthorized: No token provided");
      mockRequest.headers = { authorization: "" };
      mockProcessToken.mockRejectedValue(unauthorizedError);
      
      const middleware = authenticateUser();

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockProcessToken).toHaveBeenCalledWith("", []);
      expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
    });

    it("should preserve request object properties", async () => {
      // Arrange
      mockRequest = {
        headers: { authorization: "Bearer token" },
        body: { test: "data" },
        params: { id: "123" },
        query: { filter: "active" }
      };
      mockProcessToken.mockResolvedValue(undefined);
      
      const middleware = authenticateUser();

      // Act
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.body).toEqual({ test: "data" });
      expect(mockRequest.params).toEqual({ id: "123" });
      expect(mockRequest.query).toEqual({ filter: "active" });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle multiple role combinations", async () => {
      // Test Admin + Operator
      mockRequest.headers = { authorization: "Bearer token1" };
      mockProcessToken.mockResolvedValue(undefined);
      
      let middleware = authenticateUser([UserType.Admin, UserType.Operator]);
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer token1", [UserType.Admin, UserType.Operator]);
      
      // Reset mocks
      jest.clearAllMocks();
      mockProcessToken.mockResolvedValue(undefined);
      
      // Test Operator + Viewer
      mockRequest.headers = { authorization: "Bearer token2" };
      middleware = authenticateUser([UserType.Operator, UserType.Viewer]);
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockProcessToken).toHaveBeenCalledWith("Bearer token2", [UserType.Operator, UserType.Viewer]);
    });
  });

  describe("AuthenticatedRequest interface", () => {
    it("should extend Request interface correctly", () => {
      // This is a compile-time test to ensure the interface is properly defined
      const mockAuthRequest: AuthenticatedRequest = {
        headers: { authorization: "Bearer token" },
        user: {
          username: "testuser",
          type: UserType.Admin
        }
      } as AuthenticatedRequest;

      expect(mockAuthRequest.user).toBeDefined();
      expect(mockAuthRequest.headers).toBeDefined();
    });
  });
});
