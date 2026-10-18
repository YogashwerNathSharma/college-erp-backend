import axios from "axios";

//////////////////////////////////////////////////////
// 📦 INVENTORY SERVICE
//////////////////////////////////////////////////////

const API = "/api/inventory";

export const inventoryService = {
  getAssets: (params?: any) => axios.get(`${API}/assets`, { params }),
  getAssetById: (id: string) => axios.get(`${API}/assets/${id}`),
  createAsset: (data: any) => axios.post(`${API}/assets`, data),
  updateAsset: (id: string, data: any) => axios.put(`${API}/assets/${id}`, data),
  deleteAsset: (id: string) => axios.delete(`${API}/assets/${id}`),
  getIssuedAssets: (params?: any) => axios.get(`${API}/issued`, { params }),
  issueAsset: (data: any) => axios.post(`${API}/issue`, data),
  returnAsset: (id: string, data: any) => axios.post(`${API}/return/${id}`, data),
  getStock: (params?: any) => axios.get(`${API}/stock`, { params }),
  addStock: (data: any) => axios.post(`${API}/stock`, data),
  updateStock: (id: string, data: any) => axios.put(`${API}/stock/${id}`, data),
};
