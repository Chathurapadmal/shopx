"use client";

import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../firebase/client";
import CustomerForm from "@/components/CustomerForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewCustomerPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      await addDoc(collection(db, "customers"), {
        ...data,
        loyaltyPoints: 0,
        createdAt: serverTimestamp(),
      });
      toast.success("Customer added successfully");
      router.push("/customers");
    } catch (err) {
      toast.error("Failed to add customer");
      throw err;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add Customer</h1>
          <p className="text-slate-500">Register a new customer</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <CustomerForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
