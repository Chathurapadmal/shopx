"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ProductsPage() {
  const { getToken, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products", { headers: headers() });
      if (!response.ok) throw new Error("Failed to load products");
      const list = await response.json();
      setProducts(list);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE", headers: headers() });
      if (!response.ok) throw new Error("Failed to delete product");
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500">{products.length} products total</p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name, barcode, or category..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Package className="h-12 w-12 mx-auto mb-3" />
          <p>No products found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Barcode</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Category</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Price</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Cost</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Stock</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                    <td className="px-4 py-3 text-slate-500">{product.barcode || "—"}</td>
                    <td className="px-4 py-3">
                      {product.category ? (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                          {product.category}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatCurrency(product.cost)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${product.stock <= 5 ? "text-red-500" : "text-slate-700"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
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
        </div>
      )}
    </div>
  );
}
