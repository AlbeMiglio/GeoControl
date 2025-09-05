import { Router } from "express";
import { UserType} from "@models/UserType";
import { authenticateUser } from "@middlewares/authMiddleware";
import { getAllSensorsByGateway, createSensor, getSensorByMacAddress, deleteSensor, updateSensor } from "@controllers/sensorController";
import { SensorFromJSON } from "@dto/Sensor";

const router = Router({ mergeParams: true });
const users = [UserType.Admin, UserType.Operator, UserType.Viewer];
const editors = [UserType.Admin, UserType.Operator];

// Get all sensors (Any authenticated user)
router.get("", authenticateUser(users), async (req, res, next) => {
  try {
    res.status(200).json(await getAllSensorsByGateway(req.params.networkCode, req.params.gatewayMac));
  } catch (error) {
    next(error);
  }
});

// Create a new sensor (Admin & Operator)
router.post("", authenticateUser(editors), async (req, res, next) => {
  try {
    await createSensor(SensorFromJSON(req.body), req.params.networkCode, req.params.gatewayMac);
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Get a specific sensor (Any authenticated user)
router.get("/:sensorMac", authenticateUser(users), async (req, res, next) => {
  try {
    res.status(200).json(await getSensorByMacAddress(req.params.sensorMac, req.params.networkCode, req.params.gatewayMac));
  } catch (error) {
    next(error);
  }
});

// Update a sensor (Admin & Operator)
router.patch("/:sensorMac", authenticateUser(editors), async (req, res, next) => {
  try {
    await updateSensor(SensorFromJSON(req.body), req.params.sensorMac, req.params.networkCode, req.params.gatewayMac);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Delete a sensor (Admin & Operator)
router.delete("/:sensorMac", authenticateUser(editors), async (req, res, next) => {
  try {
    await deleteSensor(req.params.sensorMac, req.params.networkCode, req.params.gatewayMac);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
