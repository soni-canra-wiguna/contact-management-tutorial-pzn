import express from "express"
import { authMiddleware } from "../middleware/auth-middleware"
import { UserController } from "../controller/user-controller"
import { ContactController } from "../controller/contact-controller"
import { AddressController } from "../controller/address-controller"

export const apiRouter = express.Router()
apiRouter.use(authMiddleware)

// user API
apiRouter.get("/api/users/current", UserController.get)
apiRouter.patch("/api/users/current", UserController.update)
apiRouter.delete("/api/users/current", UserController.logout)

//contact API
apiRouter.post("/api/contacts", ContactController.create)
apiRouter.get("/api/contacts/:contactId(\\d+)", ContactController.get) // (\\d+) -> buat memastikan kalo yang di masukkan itu number
apiRouter.put("/api/contacts/:contactId(\\d+)", ContactController.update)
apiRouter.delete("/api/contacts/:contactId(\\d+)", ContactController.remove)
apiRouter.get("/api/contacts", ContactController.search) // search feature

//Address API
apiRouter.post(
  "/api/contacts/:contactId(\\d+)/addresses",
  AddressController.create
)
apiRouter.get(
  "/api/contacts/:contactId(\\d+)/addresses/:addressId(\\d+)",
  AddressController.get
)
apiRouter.get(
  "/api/contacts/:contactId(\\d+)/addresses",
  AddressController.list
)
apiRouter.put(
  "/api/contacts/:contactId(\\d+)/addresses/:addressId(\\d+)",
  AddressController.update
)
apiRouter.delete(
  "/api/contacts/:contactId(\\d+)/addresses/:addressId(\\d+)",
  AddressController.remove
)
