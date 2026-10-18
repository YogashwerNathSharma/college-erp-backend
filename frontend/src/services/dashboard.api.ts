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
// ⚡ Supports refresh=true to bust cache on page reload or refresh btn
//////////////////////////////////////////////////////
export const getDashboardApi = async (refresh: boolean = false) => {
  try {
    const url = refresh ? `${API}/dashboard?refresh=true` : `${API}/dashboard`;
    const res = await axios.get(url, getAuthHeader());

    return res.data.data;
  } catch (error: any) {
    console.error("Dashboard API Error:", error?.response?.data || error.message);
    throw error;
  }
};
