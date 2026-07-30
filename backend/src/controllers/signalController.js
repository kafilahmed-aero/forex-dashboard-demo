import {
  getParsedSignalCount,
  getParsedSignals,
} from "../services/parsedSignalStore.js";
import { getCompletedOutcomesByCursor } from "../services/signalOutcomeStore.js";

export async function getSignalsController(request, response) {
  const limit = Number(request.query.limit) || 100;
  const filters = {
    activeOnly: request.query.activeOnly === "true",
    hideStale: request.query.hideStale === "true",
  };

  response.json({
    count: await getParsedSignalCount(),
    signals: await getParsedSignals(limit, filters),
  });
}

export async function getCompletedOutcomesController(request, response) {
  try {
    const cursor = String(request.query.cursor || "");
    const limit = Number(request.query.limit) || 100;

    const result = await getCompletedOutcomesByCursor({ cursor, limit });

    return response.status(200).json({
      success: true,
      statusCode: 200,
      message: "Completed signal outcomes retrieved successfully",
      data: result,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Failed to retrieve completed outcomes",
    });
  }
}
