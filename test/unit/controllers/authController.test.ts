import * as authController from "@controllers/authController";
import { UserRepository } from "@repositories/UserRepository";
import { generateToken } from "@services/authService";
import { createTokenDTO, createUserDTO } from "@services/mapperService";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { NotFoundError } from "@errors/NotFoundError";
import { UserDAO } from "@dao/UserDAO";
import { UserType } from "@models/UserType";
import { User as UserDTO } from "@dto/User";

// Mock dependencies
jest.mock("@repositories/UserRepository");
jest.mock("@services/authService");
jest.mock("@services/mapperService");

describe("AuthController", () => {
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockGenerateToken: jest.MockedFunction<typeof generateToken>;
  let mockCreateTokenDTO: jest.MockedFunction<typeof createTokenDTO>;
  let mockCreateUserDTO: jest.MockedFunction<typeof createUserDTO>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserRepository = {
      getUserByUsername: jest.fn(),
    } as any;
    
    (UserRepository as jest.Mock).mockImplementation(() => mockUserRepository);
    
    mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;
    mockCreateTokenDTO = createTokenDTO as jest.MockedFunction<typeof createTokenDTO>;
    mockCreateUserDTO = createUserDTO as jest.MockedFunction<typeof createUserDTO>;
  });

  describe("getToken", () => {
    const mockUserDto: UserDTO = {
      username: "testuser",
      password: "testpassword"
    };

    const mockUserDao: UserDAO = {
      username: "testuser",
      password: "testpassword",
      type: UserType.Admin
    };

    const mockUserDtoForToken = {
      username: "testuser",
      type: UserType.Admin,
      password: "testpassword"
    };

    const mockToken = "mock-jwt-token";
    const mockTokenDto = { token: mockToken };

    it("should successfully authenticate user and return token", async () => {
      // Arrange
      mockUserRepository.getUserByUsername.mockResolvedValue(mockUserDao);
      mockCreateUserDTO.mockReturnValue(mockUserDtoForToken);
      mockGenerateToken.mockReturnValue(mockToken);
      mockCreateTokenDTO.mockReturnValue(mockTokenDto);

      // Act
      const result = await authController.getToken(mockUserDto);

      // Assert
      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith("testuser");
      expect(mockCreateUserDTO).toHaveBeenCalledWith(
        mockUserDao.username,
        mockUserDao.type,
        mockUserDao.password
      );
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUserDtoForToken);
      expect(mockCreateTokenDTO).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockTokenDto);
    });

    it("should throw UnauthorizedError when password does not match", async () => {
      // Arrange
      const wrongPasswordUserDto: UserDTO = {
        username: "testuser",
        password: "wrongpassword"
      };
      
      mockUserRepository.getUserByUsername.mockResolvedValue(mockUserDao);

      // Act & Assert
      await expect(authController.getToken(wrongPasswordUserDto))
        .rejects
        .toThrow(UnauthorizedError);
      
      await expect(authController.getToken(wrongPasswordUserDto))
        .rejects
        .toThrow("Invalid password");

      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith("testuser");
      expect(mockCreateUserDTO).not.toHaveBeenCalled();
      expect(mockGenerateToken).not.toHaveBeenCalled();
      expect(mockCreateTokenDTO).not.toHaveBeenCalled();
    });

    it("should propagate NotFoundError when user does not exist", async () => {
      // Arrange
      const notFoundError = new NotFoundError("User not found");
      mockUserRepository.getUserByUsername.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(authController.getToken(mockUserDto))
        .rejects
        .toThrow(NotFoundError);
      
      await expect(authController.getToken(mockUserDto))
        .rejects
        .toThrow("User not found");

      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith("testuser");
      expect(mockCreateUserDTO).not.toHaveBeenCalled();
      expect(mockGenerateToken).not.toHaveBeenCalled();
      expect(mockCreateTokenDTO).not.toHaveBeenCalled();
    });

    it("should work with different user types", async () => {
      // Arrange - Test with Operator
      const operatorUserDao: UserDAO = {
        username: "operator",
        password: "operatorpass",
        type: UserType.Operator
      };

      const operatorUserDto: UserDTO = {
        username: "operator",
        password: "operatorpass"
      };

      const mockOperatorUserDtoForToken = {
        username: "operator",
        type: UserType.Operator,
        password: "operatorpass"
      };

      mockUserRepository.getUserByUsername.mockResolvedValue(operatorUserDao);
      mockCreateUserDTO.mockReturnValue(mockOperatorUserDtoForToken);
      mockGenerateToken.mockReturnValue(mockToken);
      mockCreateTokenDTO.mockReturnValue(mockTokenDto);

      // Act
      const result = await authController.getToken(operatorUserDto);

      // Assert
      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith("operator");
      expect(mockCreateUserDTO).toHaveBeenCalledWith(
        operatorUserDao.username,
        operatorUserDao.type,
        operatorUserDao.password
      );
      expect(result).toEqual(mockTokenDto);
    });

    it("should work with Viewer user type", async () => {
      // Arrange - Test with Viewer
      const viewerUserDao: UserDAO = {
        username: "viewer",
        password: "viewerpass",
        type: UserType.Viewer
      };

      const viewerUserDto: UserDTO = {
        username: "viewer",
        password: "viewerpass"
      };

      const mockViewerUserDtoForToken = {
        username: "viewer",
        type: UserType.Viewer,
        password: "viewerpass"
      };

      mockUserRepository.getUserByUsername.mockResolvedValue(viewerUserDao);
      mockCreateUserDTO.mockReturnValue(mockViewerUserDtoForToken);
      mockGenerateToken.mockReturnValue(mockToken);
      mockCreateTokenDTO.mockReturnValue(mockTokenDto);

      // Act
      const result = await authController.getToken(viewerUserDto);

      // Assert
      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith("viewer");
      expect(mockCreateUserDTO).toHaveBeenCalledWith(
        viewerUserDao.username,
        viewerUserDao.type,
        viewerUserDao.password
      );
      expect(result).toEqual(mockTokenDto);
    });

    it("should handle empty password correctly", async () => {
      // Arrange
      const emptyPasswordUserDto: UserDTO = {
        username: "testuser",
        password: ""
      };
      
      const userDaoWithPassword: UserDAO = {
        username: "testuser",
        password: "actualpassword",
        type: UserType.Admin
      };
      
      mockUserRepository.getUserByUsername.mockResolvedValue(userDaoWithPassword);

      // Act & Assert
      await expect(authController.getToken(emptyPasswordUserDto))
        .rejects
        .toThrow(UnauthorizedError);
      
      await expect(authController.getToken(emptyPasswordUserDto))
        .rejects
        .toThrow("Invalid password");
    });

    it("should handle undefined password in DTO", async () => {
      // Arrange
      const undefinedPasswordUserDto: UserDTO = {
        username: "testuser",
        password: undefined as any
      };
      
      const userDaoWithPassword: UserDAO = {
        username: "testuser",
        password: "actualpassword",
        type: UserType.Admin
      };
      
      mockUserRepository.getUserByUsername.mockResolvedValue(userDaoWithPassword);

      // Act & Assert
      await expect(authController.getToken(undefinedPasswordUserDto))
        .rejects
        .toThrow(UnauthorizedError);
      
      await expect(authController.getToken(undefinedPasswordUserDto))
        .rejects
        .toThrow("Invalid password");
    });

    it("should handle case-sensitive password comparison", async () => {
      // Arrange
      const caseUserDto: UserDTO = {
        username: "testuser",
        password: "TestPassword"
      };
      
      const userDaoWithLowercase: UserDAO = {
        username: "testuser",
        password: "testpassword",
        type: UserType.Admin
      };
      
      mockUserRepository.getUserByUsername.mockResolvedValue(userDaoWithLowercase);

      // Act & Assert
      await expect(authController.getToken(caseUserDto))
        .rejects
        .toThrow(UnauthorizedError);
      
      await expect(authController.getToken(caseUserDto))
        .rejects
        .toThrow("Invalid password");
    });

    it("should propagate repository errors other than NotFoundError", async () => {
      // Arrange
      const databaseError = new Error("Database connection failed");
      mockUserRepository.getUserByUsername.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(authController.getToken(mockUserDto))
        .rejects
        .toThrow("Database connection failed");

      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith("testuser");
      expect(mockCreateUserDTO).not.toHaveBeenCalled();
      expect(mockGenerateToken).not.toHaveBeenCalled();
      expect(mockCreateTokenDTO).not.toHaveBeenCalled();
    });
  });
});
