import { useEffect, useState } from "react";
import axios from "axios";

type Tenant = {
  id: string;
  name: string;
  type: string;
  isActive?: boolean;
  createdAt?: string;
  logoUrl?: string;
};

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("SCHOOL");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem("token");

  //////////////////////////////////////////////////////
  // FETCH TENANTS
  //////////////////////////////////////////////////////
  const fetchTenants = async () => {
    try {
      const res = await axios.get("/api/tenant", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTenants(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  //////////////////////////////////////////////////////
  // CREATE TENANT
  //////////////////////////////////////////////////////
  /*const createTenant = async () => {
    if (!name.trim()) return;

    try {
      setCreating(true);

      const formData = new FormData();

      formData.append("name", name);
      formData.append("type", type);

      if (logoFile) formData.append("logo", logoFile);
      if (bgFile) formData.append("background", bgFile);

      await axios.post("/api/tenant", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // RESET
      setName("");
      setType("SCHOOL");
      setLogoFile(null);
      setBgFile(null);
      setLogoPreview(null);
      setBgPreview(null);

      fetchTenants();
    } catch (err) {
      console.log(err);
      alert("Error creating tenant");
    } finally {
      setCreating(false);
    }
  };*/
  
const createTenant = async () => {
  if (!name.trim()) return;

  try {
    setCreating(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type);

    if (logoFile) formData.append("logo", logoFile);
    if (bgFile) formData.append("background", bgFile);

    const res = await axios.post("/api/tenant", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    // 🔥 FIX: Show admin credentials to Super Admin
    const adminInfo = res.data?.admin;
    if (adminInfo) {
      alert(
        `✅ Tenant Created Successfully!

` +
        `🏫 School: ${name}
` +
        `📧 Admin Email: ${adminInfo.email}
` +
        `🔑 Admin Password: ${adminInfo.password}

` +
        `⚠️ Please note down these credentials!`
      );
    }

    // RESET
    setName("");
    setType("SCHOOL");
    setLogoFile(null);
    setBgFile(null);
    setLogoPreview(null);
    setBgPreview(null);

    fetchTenants();
  } catch (err) {
    console.log(err);
    alert("Error creating tenant");
  } finally {
    setCreating(false);
  }
};



  //////////////////////////////////////////////////////
  // TOGGLE ACTIVE
  //////////////////////////////////////////////////////
  const toggleTenant = async (id: string, isActive?: boolean) => {
    await axios.patch(
      `/api/tenant/${id}`,
      { isActive: !isActive },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchTenants();
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tenant Management</h1>

      {/* CREATE */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tenant Name"
          className="border px-3 py-2 rounded"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="SCHOOL">School</option>
          <option value="COLLEGE">College</option>
        </select>

        {/* LOGO */}
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setLogoFile(file);
            if (file) setLogoPreview(URL.createObjectURL(file));
          }}
        />

        {/* BACKGROUND */}
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setBgFile(file);
            if (file) setBgPreview(URL.createObjectURL(file));
          }}
        />

        <button
          onClick={createTenant}
          disabled={creating}
          className="bg-primary-600 text-white px-4 py-2 rounded"
        >
          {creating ? "Creating..." : "+ Create"}
        </button>
      </div>

      {/* PREVIEW */}
      <div className="flex gap-4 mb-4">
        {logoPreview && (
          <img src={logoPreview} alt="logo" className="h-12 rounded" />
        )}
        {bgPreview && (
          <img src={bgPreview} alt="bg" className="h-12 rounded" />
        )}
      </div>

      {/* LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow p-4">

          {tenants.length === 0 ? (
            <p>No tenants</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="text-left p-2">Logo</th>
                  <th className="text-left">Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b">

                    <td className="p-2">
                      <img
                        src={t.logoUrl || "https://via.placeholder.com/40"}
                        className="h-8 rounded"
                      />
                    </td>

                    <td>{t.name}</td>
                    <td className="text-center">{t.type}</td>

                    <td className="text-center">
                      {t.isActive ? "Active" : "Inactive"}
                    </td>

                    <td className="text-center">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="text-center">
                      <button
                        onClick={() => toggleTenant(t.id, t.isActive)}
                        className="bg-black text-white px-3 py-1 rounded"
                      >
                        Toggle
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      )}
    </div>
  );
}