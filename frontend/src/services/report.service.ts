import axios from "axios";

//////////////////////////////////////////////////////
// 📊 REPORT SERVICE
//////////////////////////////////////////////////////

const API = "/api/reports";

export const reportService = {
  getStudentReport: (params: any) => axios.get(`${API}/students`, { params }),
  getFeeReport: (params: any) => axios.get(`${API}/fees`, { params }),
  getAttendanceReport: (params: any) => axios.get(`${API}/attendance`, { params }),
  getExamReport: (params: any) => axios.get(`${API}/exams`, { params }),
  getStaffReport: (params: any) => axios.get(`${API}/staff`, { params }),
  getFinancialReport: (params: any) => axios.get(`${API}/financial`, { params }),
  exportReport: (type: string, params: any) => axios.get(`${API}/export/${type}`, { params, responseType: "blob" }),
  getDashboardAnalytics: () => axios.get(`${API}/analytics`),
};
