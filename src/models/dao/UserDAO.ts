import { Entity, PrimaryColumn, Column } from "typeorm";
import { UserType } from "@models/UserType";
import {IsEnum, IsNotEmpty, Matches, MinLength} from "class-validator";

@Entity("users")
export class UserDAO {
  @PrimaryColumn({ nullable: false })
  @IsNotEmpty({ message: "Username is required" })
  @Matches(/^\S+$/, { message: "Username must not contain spaces" })
  @MinLength(1, { message: "Username must be at least 1 characters" })
  username: string;

  @Column({ nullable: false })
  @IsNotEmpty({ message: "Password is required" })
  @Matches(/\S/, { message: "Password must not contain only spaces" })
  @MinLength(5, { message: "Password must be at least 5 characters" })
  password: string;

  @Column({ nullable: false })
  @IsEnum(UserType, { message: "Type must be on of: admin, operator, viewer" })
  type: UserType;
}