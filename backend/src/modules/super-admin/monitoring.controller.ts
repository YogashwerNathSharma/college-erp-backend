import { Request, Response } from "express";
import {
  getSystemMetricsService,
  getCPUHistoryService,
  getRAMHistoryService,
  getServerHealthService,
  getResponseTimeHistoryService,
  getAPIMonitoringService,
  getQueueMonitoringService,
  getBackgroundJobsService,
  getMonitoringDashboardService,
} from "./monitoring.service";

//////////////////////////////////////////////////////
// FULL DASHBOARD
//////////////////////////////////////////////////////

export const getMonitoringDashboard = async (req: Request, res: Response) => {
  try {
    const data = getMonitoringDashboardService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("MONITORING ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// SYSTEM METRICS
//////////////////////////////////////////////////////

export const getSystemMetrics = async (req: Request, res: Response) => {
  try {
    const data = getSystemMetricsService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// CPU HISTORY
//////////////////////////////////////////////////////

export const getCPUHistory = async (req: Request, res: Response) => {
  try {
    const data = getCPUHistoryService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// RAM HISTORY
//////////////////////////////////////////////////////

export const getRAMHistory = async (req: Request, res: Response) => {
  try {
    const data = getRAMHistoryService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// SERVER HEALTH
//////////////////////////////////////////////////////

export const getServerHealth = async (req: Request, res: Response) => {
  try {
    const data = getServerHealthService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// RESPONSE TIME
//////////////////////////////////////////////////////

export const getResponseTimeHistory = async (req: Request, res: Response) => {
  try {
    const data = getResponseTimeHistoryService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// API MONITORING
//////////////////////////////////////////////////////

export const getAPIMonitoring = async (req: Request, res: Response) => {
  try {
    const data = getAPIMonitoringService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// QUEUES
//////////////////////////////////////////////////////

export const getQueues = async (req: Request, res: Response) => {
  try {
    const data = getQueueMonitoringService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// BACKGROUND JOBS
//////////////////////////////////////////////////////

export const getBackgroundJobs = async (req: Request, res: Response) => {
  try {
    const data = getBackgroundJobsService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
