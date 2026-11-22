import axios from "axios";
import { getFullUrl } from "./url";

/**
 * performLogout — notify backend (records logout time + closes session),
 * then clear local auth state and redirect to login.
 *
 * Safe: the backend call is best-effort; even if it fails (network/offline),
 * we still clear local storage and redirect so the user is always logged out.
 */
export async function performLogout(redirect: boolean = true) {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      await axios.post(
        getFullUrl("/api/auth/logout"),
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 4000 }
      );
    }
  } catch {
    // ignore — logout must always succeed locally
  } finally {
    localStorage.clear();
    if (redirect) window.location.href = "/";
  }
}
