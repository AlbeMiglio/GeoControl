import { Router } from "express";
import {getAllGatewaysByNetwork, createGateway, getGatewayByMacAddress, updateGateway, deleteGateway} from "@controllers/gatewayController";
import {UserType} from "@models/UserType";
import {GatewayFromJSON} from "@dto/Gateway";
import {authenticateUser} from "@middlewares/authMiddleware";

const router = Router({ mergeParams: true });
const users = [UserType.Admin, UserType.Operator, UserType.Viewer];
const editors = [UserType.Admin, UserType.Operator];

// Get all gateways (Any authenticated user)
router.get("", authenticateUser(users), async (req, res, next) => {
  try {
    res.status(200).json(await getAllGatewaysByNetwork(req.params.networkCode));
  } catch (error) {
    next(error);
  }
});

// Create a new gateway (Admin & Operator)
router.post("", authenticateUser(editors), async (req, res, next) => {
  try {
    await createGateway(GatewayFromJSON(req.body), req.params.networkCode);
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Get a specific gateway (Any authenticated user)
router.get("/:gatewayMac", authenticateUser(users), async (req, res, next) => {
  try {
    res.status(200).json(await getGatewayByMacAddress(req.params.gatewayMac, req.params.networkCode));
  } catch (error) {
    next(error);
  }
});

// Update a gateway (Admin & Operator)
router.patch("/:gatewayMac", authenticateUser(editors), async (req, res, next) => {
  try {
    await updateGateway(GatewayFromJSON(req.body), req.params.gatewayMac, req.params.networkCode);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Delete a gateway (Admin & Operator)
router.delete("/:gatewayMac", authenticateUser(editors), async (req, res, next) => {
  try {
    await deleteGateway(req.params.gatewayMac, req.params.networkCode);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
