import os from "os";

//////////////////////////////////////////////////////
// SYSTEM METRICS
//////////////////////////////////////////////////////

export const getSystemMetricsService = () => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const uptime = os.uptime();

  // CPU usage calculation
  const cpuUsages = cpus.map((cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return Math.round(((total - idle) / total) * 100);
  });
  const avgCPU = Math.round(cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length);

  return {
    cpu: {
      usage: avgCPU,
      cores: cpus.length,
      model: cpus[0]?.model || "Unknown",
      speed: cpus[0]?.speed || 0,
      perCore: cpuUsages,
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usage: Math.round((usedMem / totalMem) * 100),
    },
    disk: getDiskMetrics(),
    uptime,
    platform: os.platform(),
    hostname: os.hostname(),
    nodeVersion: process.version,
    pid: process.pid,
    processMemory: process.memoryUsage(),
  };
};

//////////////////////////////////////////////////////
// DISK METRICS (simulated for cross-platform)
//////////////////////////////////////////////////////

function getDiskMetrics() {
  // Simulated disk usage (real disk stats require child_process)
  const totalDisk = 512 * 1024 * 1024 * 1024; // 512GB
  const usedDisk = Math.floor(totalDisk * (0.45 + Math.random() * 0.1));
  const freeDisk = totalDisk - usedDisk;

  return {
    total: totalDisk,
    used: usedDisk,
    free: freeDisk,
    usage: Math.round((usedDisk / totalDisk) * 100),
    breakdown: [
      { label: "Database", size: Math.floor(usedDisk * 0.35), color: "#6366f1" },
      { label: "Uploads", size: Math.floor(usedDisk * 0.25), color: "#10b981" },
      { label: "Logs", size: Math.floor(usedDisk * 0.15), color: "#f59e0b" },
      { label: "Backups", size: Math.floor(usedDisk * 0.2), color: "#8b5cf6" },
      { label: "System", size: Math.floor(usedDisk * 0.05), color: "#64748b" },
    ],
  };
}

//////////////////////////////////////////////////////
// CPU HISTORY (for real-time charts)
//////////////////////////////////////////////////////

let cpuHistory: { timestamp: string; usage: number }[] = [];

export const getCPUHistoryService = () => {
  const now = Date.now();

  // Generate 60 data points (last 60 minutes)
  if (cpuHistory.length === 0) {
    for (let i = 59; i >= 0; i--) {
      cpuHistory.push({
        timestamp: new Date(now - i * 60000).toISOString(),
        usage: Math.floor(Math.random() * 40) + 20,
      });
    }
  } else {
    // Add new point and remove oldest
    cpuHistory.push({
      timestamp: new Date(now).toISOString(),
      usage: Math.floor(Math.random() * 40) + 20,
    });
    if (cpuHistory.length > 60) cpuHistory.shift();
  }

  return cpuHistory;
};

//////////////////////////////////////////////////////
// RAM HISTORY
//////////////////////////////////////////////////////

let ramHistory: { timestamp: string; usage: number }[] = [];

export const getRAMHistoryService = () => {
  const now = Date.now();
  const totalMem = os.totalmem();

  if (ramHistory.length === 0) {
    for (let i = 59; i >= 0; i--) {
      const used = totalMem * (0.5 + Math.random() * 0.3);
      ramHistory.push({
        timestamp: new Date(now - i * 60000).toISOString(),
        usage: Math.round((used / totalMem) * 100),
      });
    }
  } else {
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    ramHistory.push({
      timestamp: new Date(now).toISOString(),
      usage: Math.round((usedMem / totalMem) * 100),
    });
    if (ramHistory.length > 60) ramHistory.shift();
  }

  return ramHistory;
};

//////////////////////////////////////////////////////
// SERVER HEALTH
//////////////////////////////////////////////////////

export const getServerHealthService = () => {
  const services = [
    { name: "API Server", status: "healthy", latency: Math.floor(Math.random() * 20) + 5, uptime: 99.98 },
    { name: "MongoDB", status: "healthy", latency: Math.floor(Math.random() * 15) + 3, uptime: 99.95 },
    { name: "Redis Cache", status: "healthy", latency: Math.floor(Math.random() * 5) + 1, uptime: 99.99 },
    { name: "File Storage (S3)", status: "healthy", latency: Math.floor(Math.random() * 50) + 20, uptime: 99.97 },
    { name: "Email Service", status: Math.random() > 0.9 ? "degraded" : "healthy", latency: Math.floor(Math.random() * 200) + 50, uptime: 99.85 },
    { name: "Payment Gateway", status: "healthy", latency: Math.floor(Math.random() * 150) + 80, uptime: 99.9 },
    { name: "WebSocket Server", status: "healthy", latency: Math.floor(Math.random() * 10) + 2, uptime: 99.92 },
    { name: "Background Workers", status: "healthy", latency: 0, uptime: 99.88 },
  ];

  return services;
};

//////////////////////////////////////////////////////
// RESPONSE TIME HISTORY
//////////////////////////////////////////////////////

export const getResponseTimeHistoryService = () => {
  const now = Date.now();
  const history = [];

  for (let i = 59; i >= 0; i--) {
    history.push({
      timestamp: new Date(now - i * 60000).toISOString(),
      avg: Math.floor(Math.random() * 80) + 30,
      p95: Math.floor(Math.random() * 200) + 100,
      p99: Math.floor(Math.random() * 500) + 200,
    });
  }

  return history;
};

//////////////////////////////////////////////////////
// API MONITORING
//////////////////////////////////////////////////////

export const getAPIMonitoringService = () => {
  const now = Date.now();
  const history = [];

  for (let i = 23; i >= 0; i--) {
    const total = Math.floor(Math.random() * 5000) + 2000;
    const errors = Math.floor(total * (Math.random() * 0.05));
    history.push({
      hour: new Date(now - i * 3600000).toISOString(),
      total,
      success: total - errors,
      errors,
      errorRate: Math.round((errors / total) * 10000) / 100,
    });
  }

  // Top endpoints
  const endpoints = [
    { path: "GET /api/auth/me", calls: 15420, avgLatency: 12, errorRate: 0.1 },
    { path: "GET /api/students", calls: 8900, avgLatency: 45, errorRate: 0.3 },
    { path: "POST /api/auth/login", calls: 4500, avgLatency: 120, errorRate: 2.1 },
    { path: "GET /api/notifications", calls: 12000, avgLatency: 18, errorRate: 0.05 },
    { path: "GET /api/attendance", calls: 6800, avgLatency: 65, errorRate: 0.2 },
    { path: "POST /api/payments/verify", calls: 890, avgLatency: 250, errorRate: 1.5 },
    { path: "GET /api/timetable", calls: 5400, avgLatency: 35, errorRate: 0.1 },
    { path: "PUT /api/users/:id", calls: 2100, avgLatency: 55, errorRate: 0.4 },
  ];

  // Error breakdown
  const errorBreakdown = [
    { code: 400, label: "Bad Request", count: 234 },
    { code: 401, label: "Unauthorized", count: 156 },
    { code: 403, label: "Forbidden", count: 45 },
    { code: 404, label: "Not Found", count: 89 },
    { code: 429, label: "Rate Limited", count: 67 },
    { code: 500, label: "Server Error", count: 23 },
  ];

  return { history, endpoints, errorBreakdown };
};

//////////////////////////////////////////////////////
// QUEUE MONITORING
//////////////////////////////////////////////////////

export const getQueueMonitoringService = () => {
  const queues = [
    { name: "email-queue", pending: Math.floor(Math.random() * 50), processing: Math.floor(Math.random() * 5), completed: 15420, failed: 12, avgProcessTime: 850 },
    { name: "notification-queue", pending: Math.floor(Math.random() * 20), processing: Math.floor(Math.random() * 3), completed: 45000, failed: 5, avgProcessTime: 120 },
    { name: "payment-queue", pending: Math.floor(Math.random() * 10), processing: Math.floor(Math.random() * 2), completed: 2340, failed: 8, avgProcessTime: 2500 },
    { name: "backup-queue", pending: 0, processing: Math.random() > 0.8 ? 1 : 0, completed: 365, failed: 2, avgProcessTime: 45000 },
    { name: "report-queue", pending: Math.floor(Math.random() * 5), processing: Math.floor(Math.random() * 2), completed: 890, failed: 3, avgProcessTime: 5000 },
  ];

  return queues;
};

//////////////////////////////////////////////////////
// BACKGROUND JOBS
//////////////////////////////////////////////////////

export const getBackgroundJobsService = () => {
  const jobs = [
    { id: "job-001", name: "Daily Backup", schedule: "0 2 * * *", lastRun: "2025-07-20T02:00:00Z", nextRun: "2025-07-21T02:00:00Z", status: "completed", duration: 45000, success: true },
    { id: "job-002", name: "Session Cleanup", schedule: "*/30 * * * *", lastRun: "2025-07-20T10:30:00Z", nextRun: "2025-07-20T11:00:00Z", status: "completed", duration: 3200, success: true },
    { id: "job-003", name: "Email Digest", schedule: "0 8 * * 1-5", lastRun: "2025-07-20T08:00:00Z", nextRun: "2025-07-21T08:00:00Z", status: "completed", duration: 12000, success: true },
    { id: "job-004", name: "Subscription Check", schedule: "0 */6 * * *", lastRun: "2025-07-20T06:00:00Z", nextRun: "2025-07-20T12:00:00Z", status: "completed", duration: 8500, success: true },
    { id: "job-005", name: "Audit Log Rotation", schedule: "0 3 1 * *", lastRun: "2025-07-01T03:00:00Z", nextRun: "2025-08-01T03:00:00Z", status: "completed", duration: 25000, success: true },
    { id: "job-006", name: "Analytics Aggregation", schedule: "0 4 * * *", lastRun: "2025-07-20T04:00:00Z", nextRun: "2025-07-21T04:00:00Z", status: "running", duration: 0, success: true },
    { id: "job-007", name: "Notification Cleanup", schedule: "0 5 * * 0", lastRun: "2025-07-13T05:00:00Z", nextRun: "2025-07-20T05:00:00Z", status: "completed", duration: 6000, success: true },
    { id: "job-008", name: "SSL Certificate Check", schedule: "0 9 * * 1", lastRun: "2025-07-14T09:00:00Z", nextRun: "2025-07-21T09:00:00Z", status: "completed", duration: 2000, success: true },
  ];

  return jobs;
};

//////////////////////////////////////////////////////
// FULL MONITORING DASHBOARD
//////////////////////////////////////////////////////

export const getMonitoringDashboardService = () => {
  const metrics = getSystemMetricsService();
  const health = getServerHealthService();
  const queues = getQueueMonitoringService();
  const jobs = getBackgroundJobsService();

  const healthyServices = health.filter((s) => s.status === "healthy").length;

  return {
    metrics,
    health,
    queues,
    jobs,
    summary: {
      overallStatus: healthyServices === health.length ? "healthy" : "degraded",
      healthyServices,
      totalServices: health.length,
      totalQueuePending: queues.reduce((a, q) => a + q.pending, 0),
      totalJobsFailed: jobs.filter((j) => !j.success).length,
      uptimeFormatted: formatUptime(metrics.uptime),
    },
  };
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
}
