import { CONFIG } from "@config";
import { Router } from "express";
import {UserType} from "@models/UserType";
import {authenticateUser} from "@middlewares/authMiddleware";
import {
    getMeasurementsBySensor,
    getMeasurementsBySensors,
    getStatsBySensor,
    getOutliersBySensor,
    storeMeasurements, getStatsBySensors, getOutliersBySensors, getOutliersByNetwork
} from "@controllers/measurementController";
import {Measurement as MeasurementDTO, MeasurementFromJSON} from "@dto/Measurement";
import {Measurements as MeasurementsDTO} from "@dto/Measurements";

const router = Router();
const users = [UserType.Admin, UserType.Operator, UserType.Viewer];
const editors = [UserType.Admin, UserType.Operator];

// Store a measurement for a sensor (Admin & Operator)
router.post(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements", authenticateUser(editors), async (req, res, next) => {
    try {
        const measurements: MeasurementDTO[] = (req.body).map(MeasurementFromJSON);
        const measurementsDTO: MeasurementsDTO = {
            sensorMacAddress: req.params.sensorMac,
            measurements: measurements
        }
        await storeMeasurements(measurementsDTO, req.params.networkCode, req.params.gatewayMac, req.params.sensorMac);
        res.status(201).send();
    } catch (error) {
        next(error);
    }
  }
);

// Retrieve measurements for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements", authenticateUser(users), async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        res.status(200).json(await getMeasurementsBySensor(req.params.networkCode, req.params.gatewayMac, req.params.sensorMac, startDate, endDate));
    } catch (error) {
        next(error);
    }
  }
);

// Retrieve statistics for a specific sensor
router.get(CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/stats", authenticateUser(users), async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        res.status(200).json(await getStatsBySensor(req.params.networkCode, req.params.gatewayMac, req.params.sensorMac, startDate, endDate));
    } catch (error) {
        next(error);
    }
}
);

// Retrieve only outliers for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/outliers", authenticateUser(users), async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        res.status(200).json(await getOutliersBySensor(req.params.networkCode, req.params.gatewayMac, req.params.sensorMac, startDate, endDate));
    } catch (error) {
        next(error);
    }
  }
);

// Retrieve measurements for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/measurements", authenticateUser(users), async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const sensorMacsParam = req.query.sensorMacs as string | string[] | undefined;
        let sensorsMacs: string[] | undefined = undefined;
        if (Array.isArray(sensorMacsParam)) {
            sensorsMacs = (sensorMacsParam as string[]).map(mac => mac.trim());
        } else if (typeof sensorMacsParam === 'string') {
            sensorsMacs = sensorMacsParam.split(',').map(mac => mac.trim());
        }
        res.status(200).json(await getMeasurementsBySensors(req.params.networkCode, sensorsMacs, startDate, endDate));
    } catch (error) {
        next(error);
    }
  }
);

// Retrieve statistics for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/stats", authenticateUser(users), async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const sensorMacsParam = req.query.sensorMacs as string | string[] | undefined;
        let sensorsMacs: string[] | undefined = undefined;
        if (Array.isArray(sensorMacsParam)) {
            sensorsMacs = (sensorMacsParam as string[]).map(mac => mac.trim());
        } else if (typeof sensorMacsParam === 'string') {
            sensorsMacs = sensorMacsParam.split(',').map(mac => mac.trim());
        }
        res.status(200).json(await getStatsBySensors(req.params.networkCode, sensorsMacs, startDate, endDate));
    } catch (error) {
        next(error);
    }
  }
);

// Retrieve only outliers for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/outliers", authenticateUser(users), async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const sensorMacsParam = req.query.sensorMacs as string | string[] | undefined;
        let sensorsMacs: string[] | undefined = undefined;
        if (Array.isArray(sensorMacsParam)) {
            sensorsMacs = (sensorMacsParam as string[]).map(mac => mac.trim());
        } else if (typeof sensorMacsParam === 'string') {
            sensorsMacs = sensorMacsParam.split(',').map(mac => mac.trim());
        }
        res.status(200).json(await getOutliersByNetwork(req.params.networkCode, sensorsMacs, startDate, endDate));
    } catch (error) {
        next(error);
    }
  }
);

export default router;
