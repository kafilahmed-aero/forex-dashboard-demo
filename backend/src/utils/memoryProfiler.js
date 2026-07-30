import { logger } from "./logger.js";
import { getRawMessages, getMessageKeysCount } from "../services/rawMessageStore.js";
import { getParsedSignals, getSignalKeysCount } from "../services/parsedSignalStore.js";
import { priceHistoryCache } from "../services/priceIngestionService.js";
import { getPairStates } from "../services/pairStateStore.js";
import { getProcessingQueueMetrics } from "../services/messageProcessingQueue.js";
import { localAiRecommendationOutcomes } from "../services/signalOutcomeStore.js";

let profilerInterval = null;
let lastHeapUsed = 0;
let gcCountEstimate = 0;

export function getMemorySnapshot() {
  const mem = process.memoryUsage();
  const heapUsedMb = (mem.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMb = (mem.heapTotal / 1024 / 1024).toFixed(2);
  const rssMb = (mem.rss / 1024 / 1024).toFixed(2);
  const externalMb = (mem.external / 1024 / 1024).toFixed(2);
  const arrayBuffersMb = ((mem.arrayBuffers || 0) / 1024 / 1024).toFixed(2);

  // Estimate GC activity if heap dropped significantly
  if (mem.heapUsed < lastHeapUsed * 0.8) {
    gcCountEstimate++;
  }
  lastHeapUsed = mem.heapUsed;

  const pairStates = getPairStates();
  const totalActiveSignalsInStore = pairStates.reduce(
    (sum, p) => sum + (p.activeSignals ? p.activeSignals.length : 0),
    0
  );

  const queueMetrics = getProcessingQueueMetrics();

  const metrics = {
    timestamp: new Date().toISOString(),
    memory: {
      rssMb: Number(rssMb),
      heapUsedMb: Number(heapUsedMb),
      heapTotalMb: Number(heapTotalMb),
      externalMb: Number(externalMb),
      arrayBuffersMb: Number(arrayBuffersMb),
    },
    gc: {
      estimatedGcCycles: gcCountEstimate,
    },
    collections: {
      rawMessagesLength: (getRawMessages && getRawMessages.length) || 0,
      messageKeysSize: getMessageKeysCount ? getMessageKeysCount() : 0,
      parsedSignalsLength: (getParsedSignals && getParsedSignals.length) || 0,
      signalKeysSize: getSignalKeysCount ? getSignalKeysCount() : 0,
      priceHistoryCachePairs: priceHistoryCache.size,
      totalPriceHistoryPoints: Array.from(priceHistoryCache.values()).reduce((s, arr) => s + arr.length, 0),
      pairStatesCount: pairStates.length,
      totalActiveSignalsInStore,
      queueSize: queueMetrics.queued,
      activeWorkers: queueMetrics.activeWorkers,
      localAiOutcomesCount: localAiRecommendationOutcomes.size,
    },
  };

  return metrics;
}

export function logMemorySnapshot() {
  const snapshot = getMemorySnapshot();
  logger.info("memory_profiler.snapshot", snapshot);
  return snapshot;
}

export function startMemoryProfiler(intervalMs = 60000) {
  if (profilerInterval) {
    return;
  }
  logger.info("memory_profiler.started", { intervalMs });
  logMemorySnapshot();
  profilerInterval = setInterval(logMemorySnapshot, intervalMs);
}

export function stopMemoryProfiler() {
  if (profilerInterval) {
    clearInterval(profilerInterval);
    profilerInterval = null;
    logger.info("memory_profiler.stopped");
  }
}
