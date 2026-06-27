import axios from "axios";
import { API_URL } from "../config/api.config";
import { authService } from "./auth.service";

//////////////////////////////////////////////////////
// 📚 STUDENT PORTAL SERVICE
//////////////////////////////////////////////////////

const getHeaders = () => authService.getAuthHeaders();

export const portalService = {
  /**
   * Get student dashboard data
   */
  async getDashboard() {
    const res = await axios.get(`${API_URL}/student-portal/dashboard`, getHeaders());
    return res.data.data;
  },

  /**
   * Get attendance data
   */
  async getAttendance(params?: { month?: number; year?: number }) {
    const res = await axios.get(`${API_URL}/student-portal/attendance`, {
      ...getHeaders(),
      params,
    });
    return res.data.data;
  },

  /**
   * Get exam results
   */
  async getResults(examId?: string) {
    const url = examId
      ? `${API_URL}/student-portal/results/${examId}`
      : `${API_URL}/student-portal/results`;
    const res = await axios.get(url, getHeaders());
    return res.data.data;
  },

  /**
   * Get fee details
   */
  async getFees() {
    const res = await axios.get(`${API_URL}/student-portal/fees`, getHeaders());
    return res.data.data;
  },

  /**
   * Get fee receipts
   */
  async getFeeReceipts() {
    const res = await axios.get(`${API_URL}/student-portal/fees/receipts`, getHeaders());
    return res.data.data;
  },

  /**
   * Get timetable
   */
  async getTimetable() {
    const res = await axios.get(`${API_URL}/student-portal/timetable`, getHeaders());
    return res.data.data;
  },

  /**
   * Get notices
   */
  async getNotices() {
    const res = await axios.get(`${API_URL}/student-portal/notices`, getHeaders());
    return res.data.data;
  },

  /**
   * Get downloadable documents (TC, marksheets, etc.)
   */
  async getDocuments() {
    const res = await axios.get(`${API_URL}/student-portal/documents`, getHeaders());
    return res.data.data;
  },

  /**
   * Download a specific document
   */
  async downloadDocument(documentId: string) {
    const res = await axios.get(
      `${API_URL}/student-portal/documents/${documentId}/download`,
      { ...getHeaders(), responseType: "blob" }
    );
    return res.data;
  },

  /**
   * Get student profile
   */
  async getProfile() {
    const res = await axios.get(`${API_URL}/student-portal/profile`, getHeaders());
    return res.data.data;
  },

  /**
   * Update student profile (limited fields)
   */
  async updateProfile(data: { phone?: string; email?: string; photo?: File }) {
    const formData = new FormData();
    if (data.phone) formData.append("phone", data.phone);
    if (data.email) formData.append("email", data.email);
    if (data.photo) formData.append("photo", data.photo);

    const res = await axios.patch(`${API_URL}/student-portal/profile`, formData, {
      headers: {
        ...getHeaders().headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  },
};
