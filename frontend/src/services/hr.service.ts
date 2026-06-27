import axios from "axios";

//////////////////////////////////////////////////////
// 👥 HR SERVICE
//////////////////////////////////////////////////////

const API = "/api/hr";

export const hrService = {
  getStaffList: (params?: any) => axios.get(`${API}/staff`, { params }),
  getStaffById: (id: string) => axios.get(`${API}/staff/${id}`),
  createStaff: (data: any) => axios.post(`${API}/staff`, data),
  updateStaff: (id: string, data: any) => axios.put(`${API}/staff/${id}`, data),
  deleteStaff: (id: string) => axios.delete(`${API}/staff/${id}`),
  getPayroll: (params?: any) => axios.get(`${API}/payroll`, { params }),
  processPayroll: (month: string) => axios.post(`${API}/payroll/process`, { month }),
  getPayslip: (id: string) => axios.get(`${API}/payroll/${id}/payslip`, { responseType: "blob" }),
  getLeaves: (params?: any) => axios.get(`${API}/leaves`, { params }),
  updateLeaveStatus: (id: string, status: string) => axios.patch(`${API}/leaves/${id}`, { status }),
  getStaffAttendance: (params?: any) => axios.get(`${API}/attendance`, { params }),
  markStaffAttendance: (data: any) => axios.post(`${API}/attendance`, data),
};
