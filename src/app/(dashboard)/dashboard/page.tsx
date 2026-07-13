"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Users, TrendingUp, Package } from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase/client";
import KpiCard from "@/components/KpiCard";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#059669", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    salesData: [] as { date: string; amount: number }[],
    categoryData: [] as { name: string; value: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const salesSnap = await getDocs(collection(db, "sales"));
      const productsSnap = await getDocs(collection(db, "products"));
      const customersSnap = await getDocs(collection(db, "customers"));

      const totalProducts = productsSnap.size;
      const totalCustomers = customersSnap.size;
      let todaySales = 0;
      let totalOrders = 0;
      const salesByDate: Record<string, number> = {};
      const salesByCategory: Record<string, number> = {};

      salesSnap.forEach((doc: { data: () => any }) => {
        const sale = doc.data();
        const date = sale.createdAt?.toDate?.() || new Date(sale.createdAt);
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        salesByDate[dateStr] = (salesByDate[dateStr] || 0) + sale.total;

        if (date >= today) {
          todaySales += sale.total;
        }
        totalOrders++;

        sale.items?.forEach((item: any) => {
          salesByCategory[item.name] = (salesByCategory[item.name] || 0) + item.subtotal;
        });
      });

      const salesData = Object.entries(salesByDate)
        .map(([date, amount]) => ({ date, amount }))
        .slice(-7);

      const categoryData = Object.entries(salesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setStats({
        todaySales,
        totalOrders,
        totalCustomers,
        totalProducts,
        salesData,
        categoryData,
      });
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Overview of your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          color="emerald"
        />
        <KpiCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={ShoppingBag}
          color="blue"
        />
        <KpiCard
          title="Customers"
          value={stats.totalCustomers.toString()}
          icon={Users}
          color="purple"
        />
        <KpiCard
          title="Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Sales Overview</h2>
          {stats.salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No sales data yet
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Products</h2>
          {stats.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {stats.categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No product data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
