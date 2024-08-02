import {
  CreateUserRequest,
  LoginUserRequest,
  toUserResponse,
  UserResponse,
} from "../model/user-model"
import { Validation } from "../validation/validation"
import { UserValidation } from "../validation/user-validation"
import { prisma } from "../application/database"
import { ResponseError } from "../error/response-error"
import bcrypt from "bcrypt"
import { v4 as uuid } from "uuid"

export class UserService {
  static async register(request: CreateUserRequest): Promise<UserResponse> {
    const registerRequest = Validation.validate(
      UserValidation.REGISTER,
      request
    )

    //check apakah usernamenya sudah ada
    const totalUserWithSameUsername = await prisma.user.count({
      where: {
        username: registerRequest.username,
      },
    })

    if (totalUserWithSameUsername != 0) {
      // simplenya apakah usernamenya itu ada di db
      throw new ResponseError(400, "username already exists")
    }

    registerRequest.password = await bcrypt.hash(registerRequest.password, 10)

    const user = await prisma.user.create({
      data: registerRequest,
    })

    return toUserResponse(user)
  }

  static async login(request: LoginUserRequest): Promise<UserResponse> {
    const loginRequest = Validation.validate(UserValidation.LOGIN, request)

    let user = await prisma.user.findUnique({
      where: {
        username: loginRequest.username,
      },
    })
    if (!user) {
      throw new ResponseError(401, "username or password is wrong")
    }

    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      user.password
    )
    if (!isPasswordValid) {
      throw new ResponseError(401, "username or password is wrong")
    }

    user = await prisma.user.update({
      where: {
        username: loginRequest.username,
      },
      data: {
        token: uuid(),
      },
    })

    const response = toUserResponse(user)
    response.token = user.token!
    return response
  }
}
