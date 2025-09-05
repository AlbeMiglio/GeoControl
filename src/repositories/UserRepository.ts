import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { UserDAO } from "@dao/UserDAO";
import { UserType } from "@models/UserType";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import {BadRequestError} from "@errors/BadRequestError";
import {validate} from "class-validator";

export class UserRepository {
  private repo: Repository<UserDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserDAO);
  }

  getAllUsers(): Promise<UserDAO[]> {
    return this.repo.find();
  }

  async getUserByUsername(username: string): Promise<UserDAO> {
    if (!username) {
      throw new BadRequestError("Username is required");
    }

    if (username.trim() === "") {
      throw new BadRequestError("Username must not contain spaces");
    }

    return findOrThrowNotFound(
      await this.repo.find({ where: { username } }),
      () => true,
      `User with username '${username}' not found`
    );
  }

  async createUser(
    username: string,
    password: string,
    userType: UserType
  ): Promise<UserDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { username } }),
      () => true,
      `User with username '${username}' already exists`
    );

    const userDAO = new UserDAO();
    userDAO.username = username;
    userDAO.password = password;
    userDAO.type = userType;

    const errors = await validate(userDAO);
    if (errors.length > 0) {
      const errorMessages = errors.map((error) => Object.values(error.constraints || {}).join(", ")).join("; ");
      throw new BadRequestError(`Invalid user data: '${errorMessages}'`);
    }

    return this.repo.save(userDAO);
  }

  async deleteUser(username: string): Promise<void> {
    await this.repo.remove(await this.getUserByUsername(username));
  }
}