import { Router } from "express";
import {
  getHealth,
  getLiveStability,
  getDebugSignals,
  getLivePriceController,
  getSettingsController,
  updateSettingsController,
} from "../controllers/healthController.js";

const router = Router();

router.get("/", getHealth);
router.get("/live-stability", getLiveStability);
router.get("/debug-signals", getDebugSignals);
router.get("/live-price/:symbol?", getLivePriceController);
router.get("/settings", getSettingsController);
router.post("/settings", updateSettingsController);

export default router;
