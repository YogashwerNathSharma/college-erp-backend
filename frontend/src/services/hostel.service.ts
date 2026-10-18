import axios from "axios";

//////////////////////////////////////////////////////
// 🏠 HOSTEL SERVICE
//////////////////////////////////////////////////////

const API = "/api/hostel";

export const hostelService = {
  getRooms: (params?: any) => axios.get(`${API}/rooms`, { params }),
  getRoomById: (id: string) => axios.get(`${API}/rooms/${id}`),
  allocateRoom: (data: any) => axios.post(`${API}/rooms/allocate`, data),
  deallocateRoom: (studentId: string) => axios.post(`${API}/rooms/deallocate`, { studentId }),
  getHostelFees: (params?: any) => axios.get(`${API}/fees`, { params }),
  collectHostelFee: (data: any) => axios.post(`${API}/fees/collect`, data),
  getMessMenu: () => axios.get(`${API}/mess/menu`),
  updateMessMenu: (data: any) => axios.put(`${API}/mess/menu`, data),
  getMessExpenses: (params?: any) => axios.get(`${API}/mess/expenses`, { params }),
  addMessExpense: (data: any) => axios.post(`${API}/mess/expenses`, data),
};
