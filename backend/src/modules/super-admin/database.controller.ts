import { Request, Response } from "express";
import {
  getDatabaseHealthService,
  getSlowQueriesService,
  getIndexesService,
  getOptimizationSuggestionsService,
  getBackupsService,
  createBackupService,
  getMigrationHistoryService,
  getQueryStatsService,
} from "./database.service";

//////////////////////////////////////////////////////
// DATABASE HEALTH
//////////////////////////////////////////////////////

export const getDatabaseHealth = async (req: Request, res: Response) => {
  try {
    const data = await getDatabaseHealthService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("DB HEALTH ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// SLOW QUERIES
//////////////////////////////////////////////////////

export const getSlowQueries = async (req: Request, res: Response) => {
  try {
    const data = await getSlowQueriesService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// INDEXES
//////////////////////////////////////////////////////

export const getIndexes = async (req: Request, res: Response) => {
  try {
    const data = await getIndexesService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// OPTIMIZATION
//////////////////////////////////////////////////////

export const getOptimizations = async (req: Request, res: Response) => {
  try {
    const data = await getOptimizationSuggestionsService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// BACKUPS
//////////////////////////////////////////////////////

export const getBackups = async (req: Request, res: Response) => {
  try {
    const data = getBackupsService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createBackup = async (req: Request, res: Response) => {
  try {
    const { type, name } = req.body;
    const backup = createBackupService(type || "full", name);
    return res.status(201).json({ success: true, data: backup });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// MIGRATIONS
//////////////////////////////////////////////////////

export const getMigrations = async (req: Request, res: Response) => {
  try {
    const data = getMigrationHistoryService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// QUERY STATS
//////////////////////////////////////////////////////

export const getQueryStats = async (req: Request, res: Response) => {
  try {
    const data = getQueryStatsService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
