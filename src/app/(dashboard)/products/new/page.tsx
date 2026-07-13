"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to add product");
      }

      toast.success("Product added successfully");
      router.push("/products");
    } catch (err) {
      toast.error("Failed to add product");
      throw err;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add Product</h1>
          <p className="text-slate-500">Create a new product</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <ProductForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
