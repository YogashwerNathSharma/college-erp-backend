import axios from "axios";

//////////////////////////////////////////////////////
// 📢 COMMUNICATION SERVICE
//////////////////////////////////////////////////////

const API = "/api/communication";

export const communicationService = {
  getNotices: (params?: any) => axios.get(`${API}/notices`, { params }),
  createNotice: (data: any) => axios.post(`${API}/notices`, data),
  updateNotice: (id: string, data: any) => axios.put(`${API}/notices/${id}`, data),
  deleteNotice: (id: string) => axios.delete(`${API}/notices/${id}`),
  sendSMS: (data: any) => axios.post(`${API}/sms/send`, data),
  getSMSHistory: (params?: any) => axios.get(`${API}/sms/history`, { params }),
  sendWhatsApp: (data: any) => axios.post(`${API}/whatsapp/send`, data),
  getWhatsAppHistory: (params?: any) => axios.get(`${API}/whatsapp/history`, { params }),
  createCircular: (data: FormData) => axios.post(`${API}/circulars`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  getCirculars: (params?: any) => axios.get(`${API}/circulars`, { params }),
};
