"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Building2, UserPlus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type Shop = {
  id: string; name: string; email: string; phone: string; address: string; isActive: boolean;
};

type Staff = {
  id: string; email: string; name: string; role: string; isActive: boolean; twofaEnabled: boolean; emailVerified: boolean;
};

export default function ShopDetailPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("shop_admin");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push(user ? "/dashboard" : "/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchShop();
      fetchStaff();
    }
  }, [user, params.id, getToken]);

  async function fetchShop() {
    try {
      const res = await fetch(`/api/shops/${params.id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) {
        const data = await res.json();
        setShop(data);
        setName(data.name); setEmail(data.email || ""); setPhone(data.phone || ""); setAddress(data.address || "");
      }
    } catch {}
  }

  async function fetchStaff() {
    try {
      const res = await fetch("/api/staff", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) {
        const all: Staff[] = await res.json();
        setStaff(all.filter((s) => s.role !== "super_admin"));
      }
    } catch {}
  }

  async function updateShop() {
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name, email, phone, address, isActive: shop?.isActive }),
      });
      if (res.ok) { toast.success("Shop updated"); setEditing(false); fetchShop(); }
      else toast.error("Failed to update");
    } catch { toast.error("Failed to update"); } finally { setSaving(false); }
  }

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ email: staffEmail, name: staffName, password: staffPassword, role: staffRole, shopId: params.id }),
      });
      if (res.ok) {
        toast.success("Staff added");
        setShowAddStaff(false);
        setStaffEmail(""); setStaffName(""); setStaffPassword("");
        fetchStaff();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add");
      }
    } catch { toast.error("Failed to add"); } finally { setSaving(false); }
  }

  async function deleteStaff(id: string) {
    if (!confirm("Remove this staff member?")) return;
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) { toast.success("Staff removed"); fetchStaff(); }
      else toast.error("Failed to remove");
    } catch { toast.error("Failed to remove"); }
  }

  if (loading || !user) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-800">{shop?.name || "Shop"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Shop Details</h2>
            <button onClick={() => setEditing(!editing)} className="text-sm text-emerald-600 hover:text-emerald-800">
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
          {editing ? (
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Shop name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              <button onClick={updateShop} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div><span className="text-slate-500">Email:</span> <span className="text-slate-800">{shop?.email || "-"}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="text-slate-800">{shop?.phone || "-"}</span></div>
              <div><span className="text-slate-500">Address:</span> <span className="text-slate-800">{shop?.address || "-"}</span></div>
              <div>
                <span className="text-slate-500">Status:</span>{" "}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${shop?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {shop?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Staff</h2>
            <button onClick={() => setShowAddStaff(!showAddStaff)} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800">
              <UserPlus className="h-4 w-4" /> Add Staff
            </button>
          </div>

          {showAddStaff && (
            <form onSubmit={addStaff} className="mb-4 p-3 bg-slate-50 rounded-lg space-y-2">
              <input value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="Email" type="email" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Name" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} placeholder="Password" type="password" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="shop_admin">Shop Admin</option>
                <option value="cashier">Cashier</option>
              </select>
              <button type="submit" disabled={saving} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
                {saving ? "Adding..." : "Add Staff"}
              </button>
            </form>
          )}

          <div className="space-y-2">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-slate-800">{s.name || s.email}</p>
                  <p className="text-xs text-slate-500">{s.email} <span className="capitalize">({s.role.replace("_", " ")})</span></p>
                </div>
                <button onClick={() => deleteStaff(s.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {staff.length === 0 && <p className="text-sm text-slate-400">No staff yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
