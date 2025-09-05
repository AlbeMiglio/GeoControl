import { UserRepository } from "@repositories/UserRepository";
import { BadRequestError } from "@errors/BadRequestError";
import { UserDAO } from "@dao/UserDAO";
import { validate as _validate, ValidationError } from "class-validator";

jest.mock("class-validator", () => ({
    ...jest.requireActual("class-validator"),
    validate: jest.fn(),
}));

const validate = _validate as jest.MockedFunction<typeof _validate>;

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
    AppDataSource: {
        getRepository: () => ({
            find: mockFind,
            save: mockSave,
            remove: mockRemove,
        }),
    },
}));

describe("UserRepository: mocked database", () => {
    let repo: UserRepository


    beforeEach(() => {
        jest.clearAllMocks()
        repo = new UserRepository()
    })

    it("getAllUsers returns all users", async () => {
        const user1 = new UserDAO();
        user1.username = "user1";
        user1.password = "pass1";
        user1.type = "Admin" as any;

        const user2 = new UserDAO();
        user2.username = "user2";
        user2.password = "pass2";
        user2.type = "Operator" as any;

        const mockUsers = [user1, user2];

        mockFind.mockResolvedValue(mockUsers);

        const users: UserDAO[] = await repo.getAllUsers();

        expect(mockFind).toHaveBeenCalled();
        expect(users).toEqual(mockUsers);
    });

    it("getUserByUsername throws BadRequestError when username is empty string", async () => {
        await expect(repo.getUserByUsername("")).rejects.toThrow(BadRequestError)
        await expect(repo.getUserByUsername("")).rejects.toThrow("Username is required")
    })

    it("getUserByUsername throws BadRequestError when username is only whitespace", async () => {
        await expect(repo.getUserByUsername("   ")).rejects.toThrow(BadRequestError)
        await expect(repo.getUserByUsername("   ")).rejects.toThrow("Username must not contain spaces")
    })

    it("createUser throws BadRequestError when userDAO validation fails", async () => {
        // Mock find per evitare conflitti
        mockFind.mockResolvedValue([]);

        const validationErrors: ValidationError[] = [
            {
                property: "username",
                constraints: { isNotEmpty: "username should not be empty" },
                children: [],
            } as ValidationError,
            {
                property: "password",
                constraints: { minLength: "password must be at least 6 characters" },
                children: [],
            } as ValidationError,
        ];

        validate.mockResolvedValue(validationErrors);

        await expect(
            repo.createUser("test", "short", "Admin" as any)
        ).rejects.toThrow(BadRequestError);

        await expect(
            repo.createUser("test", "short", "Admin" as any)
        ).rejects.toThrow(
            "Invalid user data: 'username should not be empty; password must be at least 6 characters'"
        );
    });

})
