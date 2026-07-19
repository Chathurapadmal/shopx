"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Plus, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type Shop = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export default function ShopsPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push(user ? "/dashboard" : "/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchShops();
  }, [user, getToken]);

  async function fetchShops() {
    try {
      const res = await fetch("/api/shops", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setShops(await res.json());
    } catch {} finally {
      setFetching(false);
    }
  }

  async function deleteShop(id: string) {
    if (!confirm("Delete this shop and all its data?")) return;
    try {
      const res = await fetch(`/api/shops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        toast.success("Shop deleted");
        fetchShops();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (loading || !user) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-800">Shops</h1>
        </div>
        <Link href="/super-admin/shops/new" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
          <Plus className="h-4 w-4" /> Add Shop
        </Link>
      </div>

      {fetching ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : shops.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No shops yet</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{shop.name}</td>
                  <td className="px-6 py-4 text-slate-600">{shop.email || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${shop.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {shop.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/super-admin/shops/${shop.id}`} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 mr-3">
                      <Edit2 className="h-4 w-4" /> Edit
                    </Link>
                    <button onClick={() => deleteShop(shop.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
