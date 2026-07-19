"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import ProductForm from "@/components/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const authHeaders = { Authorization: `Bearer ${getToken()}` };

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`, { headers: authHeaders });
      if (!response.ok) throw new Error("Failed to load product");
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update product");
      toast.success("Product updated");
      router.push("/products");
    } catch (err) {
      toast.error("Failed to update product");
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-12 text-slate-500">Product not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Product</h1>
          <p className="text-slate-500">{product.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <ProductForm initial={product} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
