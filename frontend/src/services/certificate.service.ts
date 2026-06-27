import axios from "axios";

//////////////////////////////////////////////////////
// 📜 CERTIFICATE SERVICE
//////////////////////////////////////////////////////

const API = "/api/certificates";

export const certificateService = {
  generateTC: (data: any) => axios.post(`${API}/tc`, data, { responseType: "blob" }),
  generateCharacterCert: (data: any) => axios.post(`${API}/character`, data, { responseType: "blob" }),
  generateMigrationCert: (data: any) => axios.post(`${API}/migration`, data, { responseType: "blob" }),
  getCertificateHistory: (params?: any) => axios.get(`${API}/history`, { params }),
  getCertificateById: (id: string) => axios.get(`${API}/${id}`),
  downloadCertificate: (id: string) => axios.get(`${API}/${id}/download`, { responseType: "blob" }),
};
