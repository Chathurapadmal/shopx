"use client";

import { useEffect, useState, Suspense } from "react";
import { Store, CheckCircle, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then((res) => setStatus(res.ok ? "success" : "error"));
  }, [token]);

  return (
    <div className="text-center">
      {status === "verifying" && <p className="text-slate-500">Verifying your email...</p>}
      {status === "success" && (
        <div className="space-y-4">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <p className="text-lg font-medium text-slate-800">Email Verified!</p>
          <Link href="/" className="block text-emerald-600 hover:text-emerald-800 font-medium">Login to your account</Link>
        </div>
      )}
      {status === "error" && (
        <div className="space-y-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <p className="text-lg font-medium text-slate-800">Invalid or expired link</p>
          <Link href="/" className="block text-emerald-600 hover:text-emerald-800 font-medium">Back to Login</Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-6">
          <Store className="h-8 w-8 text-emerald-600" />
        </div>
        <Suspense fallback={<p className="text-center text-slate-500">Loading...</p>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
