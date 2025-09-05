import { Router } from "express";
import { 
  createNetwork,
  getAllNetworks,
  getNetworkByCode,
  updateNetwork,
  deleteNetwork
} from "@controllers/networkController";
import {NetworkFromJSON, NetworkToJSON} from "@dto/Network";
import {authenticateUser} from "@middlewares/authMiddleware";
import {UserType} from "@models/UserType";

const router = Router();
const users = [UserType.Admin, UserType.Operator, UserType.Viewer];
const editors = [UserType.Admin, UserType.Operator];

// Get all networks (Any authenticated user)
router.get("", authenticateUser(users), async (req, res, next) => {
  try {
    res.status(200).json(await getAllNetworks());
  } catch (error) {
    next(error);
  }
});

// Create a new network (Admin & Operator)
router.post("", authenticateUser(editors), async (req, res, next) => {
  try {
    await createNetwork(NetworkFromJSON(req.body));
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Get a specific network (Any authenticated user)
router.get("/:networkCode", authenticateUser(users), async (req, res, next) => {
  try {
    res.status(200).json(await getNetworkByCode(req.params.networkCode));
  } catch (error) {
    next(error);
  }
});

// Update a network (Admin & Operator)
router.patch("/:networkCode", authenticateUser(editors), async (req, res, next) => {
  try {
    await updateNetwork(NetworkFromJSON(req.body), req.params.networkCode);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Delete a network (Admin & Operator)
router.delete("/:networkCode", authenticateUser(editors), async (req, res, next) => {
  try {
    await deleteNetwork(req.params.networkCode);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
