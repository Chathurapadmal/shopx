"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Customer } from "@/lib/types";
import { Plus, Edit, Trash2, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomersPage() {
  const { getToken, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeaders = { Authorization: `Bearer ${getToken()}` };

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/customers", { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load customers");
      const list = await res.json();
      setCustomers(list);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"?`)) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE", headers: authHeaders });
      if (!res.ok) throw new Error("Failed to delete customer");
      setCustomers(customers.filter((c) => c.id !== id));
      toast.success("Customer deleted");
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500">{customers.length} customers</p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
        >
          <Plus className="h-5 w-5" />
          Add Customer
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3" />
          <p>No customers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Address</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{customer.name}</td>
                  <td className="px-4 py-3 text-slate-500">{customer.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{customer.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                    {customer.address || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
