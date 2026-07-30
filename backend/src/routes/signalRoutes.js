import { Router } from "express";
import { getParsedSignalsController } from "../controllers/parsedSignalController.js";
import { getCompletedOutcomesController } from "../controllers/signalController.js";

const router = Router();

router.get("/", getParsedSignalsController);
router.get("/outcomes", getCompletedOutcomesController);

export default router;
