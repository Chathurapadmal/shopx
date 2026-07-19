"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Shield, Building2, Users, Activity } from "lucide-react";
import Link from "next/link";

export default function SuperAdminPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ shops: 0, staff: 0 });

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push(user ? "/dashboard" : "/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [shopsRes, staffRes] = await Promise.all([
          fetch("/api/shops", { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch("/api/staff", { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);
        if (shopsRes.ok) {
          const shops = await shopsRes.json();
          setStats((s) => ({ ...s, shops: shops.length }));
        }
        if (staffRes.ok) {
          const staff = await staffRes.json();
          setStats((s) => ({ ...s, staff: staff.length }));
        }
      } catch {}
    }
    if (user?.role === "super_admin") fetchStats();
  }, [user, getToken]);

  if (loading || !user) return null;

  const cards = [
    { label: "Total Shops", value: stats.shops, icon: Building2, href: "/super-admin/shops", color: "bg-blue-500" },
    { label: "Total Staff", value: stats.staff, icon: Users, href: "/super-admin/shops", color: "bg-emerald-500" },
    { label: "System Status", value: "Active", icon: Activity, href: "#", color: "bg-purple-500" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-800">Super Admin Panel</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-slate-500 text-sm">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/super-admin/shops/new" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
            Add New Shop
          </Link>
          <Link href="/super-admin/shops" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition">
            Manage Shops
          </Link>
        </div>
      </div>
    </div>
  );
}
