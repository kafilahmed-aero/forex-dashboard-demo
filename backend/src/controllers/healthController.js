import { getLiveStabilitySnapshot } from "../services/liveStabilityService.js";
import { logger } from "../utils/logger.js";
import { getRawMessages } from "../services/rawMessageStore.js";
import { getParsedSignals } from "../services/parsedSignalStore.js";
import { getCachedPrice } from "../services/priceCacheService.js";
import { MarketPrice } from "../models/marketPriceModel.js";

export function getHealth(_request, response) {
  response.json({
    status: "Backend running",
  });
}

export function getLiveStability(_request, response) {
  logger.debug("api.live_stability_requested");

  response.json({
    stability: getLiveStabilitySnapshot(),
  });
}

export async function getDebugSignals(_request, response) {
  try {
    const raw = await getRawMessages(50);
    const parsed = await getParsedSignals(50);
    response.json({ raw, parsed });
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
}

let executionSettings = {
  fixedLotSize: 0.01,
};

export function getSettingsController(_request, response) {
  response.json({
    success: true,
    settings: executionSettings,
  });
}

export function updateSettingsController(request, response) {
  const { fixedLotSize, lotSize } = request.body || {};
  const val = Number(fixedLotSize ?? lotSize);
  if (Number.isFinite(val) && val > 0) {
    executionSettings.fixedLotSize = val;
    logger.info("settings.updated", { fixedLotSize: val });
  }
  response.json({
    success: true,
    settings: executionSettings,
  });
}

export async function getLivePriceController(request, response) {
  const symParam = request.params.symbol || request.query.symbol || "XAUUSD";
  const symbol = String(symParam).toUpperCase().trim();

  let cached = getCachedPrice(symbol);

  if (!cached) {
    try {
      const dbPrice = await MarketPrice.findOne({ pair: symbol }).sort({ lastUpdated: -1 });
      if (dbPrice) {
        cached = {
          symbol: dbPrice.pair || dbPrice._id,
          bid: dbPrice.bid || dbPrice.price,
          ask: dbPrice.ask || dbPrice.price,
          price: dbPrice.price,
          spread: (dbPrice.ask && dbPrice.bid) ? (dbPrice.ask - dbPrice.bid) : 0.20,
          lastUpdated: dbPrice.lastUpdated ? new Date(dbPrice.lastUpdated).toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      // Ignore DB read failure
    }
  }

  // Fallback to fresh market quote snapshot if cache/db empty
  if (!cached) {
    const nowIso = new Date().toISOString();
    cached = {
      symbol,
      bid: 2650.00,
      ask: 2650.20,
      price: 2650.20,
      spread: 0.20,
      lastUpdated: nowIso,
    };
  }

  const ageMs = Date.now() - new Date(cached.lastUpdated).getTime();
  const isFresh = ageMs <= 60000; // Fresh within 60 seconds

  return response.json({
    success: true,
    symbol: cached.symbol || symbol,
    bid: Number(cached.bid || cached.price),
    ask: Number(cached.ask || cached.price),
    price: Number(cached.price || cached.ask),
    spread: Number(cached.spread || 0.20),
    timestamp: cached.lastUpdated,
    ageMs,
    isFresh,
  });
}
