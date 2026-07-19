"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Customer } from "@/lib/types";
import CustomerForm from "@/components/CustomerForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const authHeaders = { Authorization: `Bearer ${getToken()}` };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load customer");
      const data = await res.json();
      setCustomer(data);
    } catch (err) {
      toast.error("Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update customer");
      toast.success("Customer updated");
      router.push("/customers");
    } catch (err) {
      toast.error("Failed to update customer");
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

  if (!customer) {
    return <div className="text-center py-12 text-slate-500">Customer not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Customer</h1>
          <p className="text-slate-500">{customer.name}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <CustomerForm initial={customer} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
