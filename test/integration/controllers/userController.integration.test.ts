import * as userController from "@controllers/userController";
import { UserDAO } from "@dao/UserDAO";
import { UserType } from "@models/UserType";
import { UserRepository } from "@repositories/UserRepository";

jest.mock("@repositories/UserRepository");

describe("UserController integration", () => {
  it("get User: mapperService integration", async () => {
    const fakeUserDAO: UserDAO = {
      username: "testuser",
      password: "secret",
      type: UserType.Operator
    };

    const expectedDTO = {
      username: fakeUserDAO.username,
      type: fakeUserDAO.type
    };

    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockResolvedValue(fakeUserDAO)
    }));

    const result = await userController.getUser("testuser");

    expect(result).toEqual({
      username: expectedDTO.username,
      type: expectedDTO.type
    });
    expect(result).not.toHaveProperty("password");
  });
  
  it("get All Users: mapperService integration", async () => {
    const fakeUsersDAO: UserDAO[] = [
      { username: "user1", password: "pass1", type: UserType.Operator },
      { username: "user2", password: "pass2", type: UserType.Admin }
    ];

    const expectedDTOs = fakeUsersDAO.map(user => ({
      username: user.username,
      type: user.type
    }));

    (UserRepository as jest.Mock).mockImplementation(() => ({
      getAllUsers: jest.fn().mockResolvedValue(fakeUsersDAO)
    }));

    const result = await userController.getAllUsers();

    expect(result).toEqual(expectedDTOs);
    result.forEach(user => {
      expect(user).not.toHaveProperty("password");
    });
  });

  it("create User: mapperService integration", async () => {
    const newUserDTO = {
      username: "newuser",
      password: "newpass",
      type: UserType.Operator
    };

    const createdUserDAO: UserDAO = {
      username: newUserDTO.username,
      password: newUserDTO.password,
      type: newUserDTO.type
    };

    const expectedDTO = {
      username: createdUserDAO.username,
      type: createdUserDAO.type
    };

    (UserRepository as jest.Mock).mockImplementation(() => ({
      createUser: jest.fn().mockResolvedValue(createdUserDAO)
    }));

    const result = await userController.createUser(newUserDTO);

    expect(result).toEqual(expectedDTO);
    expect(result).not.toHaveProperty("password");
  });

  it("delete User: mapperService integration", async () => {
    const usernameToDelete = "userToDelete";

    (UserRepository as jest.Mock).mockImplementation(() => ({
      deleteUser: jest.fn().mockResolvedValue(undefined)
    }));

    await expect(userController.deleteUser(usernameToDelete)).resolves.toBeUndefined();
  });

});
