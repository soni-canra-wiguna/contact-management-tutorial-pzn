import { prisma } from "../application/database"
import { ResponseError } from "../error/response-error"
import {
  ContactResponse,
  CreateContactRequest,
  SearchContactRequest,
  toContactResponse,
  UpdateContactRequest,
} from "../model/contact-model"
import { Pageable } from "../model/page"
import { ContactValidation } from "../validation/contact-validation"
import { Validation } from "../validation/validation"
import { Contact, User } from "@prisma/client"

export class ContactService {
  static async checkContactMustExist(
    username: string,
    contactId: number
  ): Promise<Contact> {
    const contact = await prisma.contact.findUnique({
      where: {
        id: contactId,
        username: username,
      },
    })

    if (!contact) {
      throw new ResponseError(404, "contact not found")
    }

    return contact
  }

  static async create(
    user: User,
    request: CreateContactRequest
  ): Promise<ContactResponse> {
    const createRequest = Validation.validate(ContactValidation.CREATE, request)

    const record = {
      ...createRequest,
      ...{ username: user.username },
    }

    const contact = await prisma.contact.create({
      data: record,
    })

    return toContactResponse(contact)
  }

  static async get(user: User, id: number): Promise<ContactResponse> {
    const contact = await this.checkContactMustExist(user.username, id)

    return toContactResponse(contact)
  }

  static async update(
    user: User,
    request: UpdateContactRequest
  ): Promise<ContactResponse> {
    const updateRequest = Validation.validate(ContactValidation.UPDATE, request)
    await this.checkContactMustExist(user.username, updateRequest.id)

    const contact = await prisma.contact.update({
      where: {
        id: updateRequest.id,
        username: user.username,
      },
      data: updateRequest,
    })

    return toContactResponse(contact)
  }

  static async remove(user: User, id: number): Promise<ContactResponse> {
    await this.checkContactMustExist(user.username, id)

    const contact = await prisma.contact.delete({
      where: {
        id,
        username: user.username,
      },
    })

    return toContactResponse(contact)
  }

  static async search(
    user: User,
    request: SearchContactRequest
  ): Promise<Pageable<ContactResponse>> {
    const searchRequest = Validation.validate(ContactValidation.SEARCH, request)
    const skip = (searchRequest.page - 1) * searchRequest.size

    let filters = []
    // search name, if name is exist
    if (searchRequest.name) {
      filters.push({
        OR: [
          {
            first_name: {
              contains: searchRequest.name,
            },
          },
          {
            last_name: {
              contains: searchRequest.name,
            },
          },
        ],
      })
    }
    // search email, if name is exist
    if (searchRequest.email) {
      filters.push({
        email: {
          contains: searchRequest.email,
        },
      })
    }
    // search phone, if name is exist
    if (searchRequest.phone) {
      filters.push({
        phone: {
          contains: searchRequest.phone,
        },
      })
    }

    const contacts = await prisma.contact.findMany({
      where: {
        username: user.username,
        AND: filters,
      },
      take: searchRequest.size,
      skip,
    })

    const total = await prisma.contact.count({
      where: {
        username: user.username,
        AND: filters,
      },
    })

    return {
      data: contacts.map((contact) => toContactResponse(contact)),
      paging: {
        current_page: searchRequest.page,
        total_page: Math.ceil(total / searchRequest.size),
        size: searchRequest.size,
      },
    }
  }
}
