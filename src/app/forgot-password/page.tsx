"use client";

import { useState, FormEvent } from "react";
import { Store, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else toast.error("Failed to send reset email");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>
          <p className="text-slate-500 mt-1">
            {sent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-slate-600">If an account exists with that email, a reset link has been sent.</p>
            <Link href="/" className="block text-emerald-600 hover:text-emerald-800 font-medium">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <Link href="/" className="block text-center text-sm text-emerald-600 hover:text-emerald-800">
              <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
