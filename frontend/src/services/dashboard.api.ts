import axios from "axios";

//////////////////////////////////////////////////////
// 🌐 BASE API
//////////////////////////////////////////////////////
const API = "/api";

//////////////////////////////////////////////////////
// 🔐 GET TOKEN
//////////////////////////////////////////////////////
const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

//////////////////////////////////////////////////////
// 📊 GET DASHBOARD DATA
//////////////////////////////////////////////////////
export const getDashboardApi = async () => {
  try {
    const res = await axios.get(`${API}/dashboard`, getAuthHeader());

    return res.data.data;
  } catch (error: any) {
    console.error("Dashboard API Error:", error?.response?.data || error.message);
    throw error;
  }
};