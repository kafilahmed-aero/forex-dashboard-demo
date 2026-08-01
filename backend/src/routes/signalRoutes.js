import { Router } from "express";
import { getParsedSignalsController } from "../controllers/parsedSignalController.js";
import { getCompletedOutcomesController } from "../controllers/signalController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireInternalService } from "../middleware/internalServiceMiddleware.js";

const router = Router();

router.get("/", requireAuth, getParsedSignalsController);
router.get("/outcomes", requireInternalService, getCompletedOutcomesController);

export default router;
