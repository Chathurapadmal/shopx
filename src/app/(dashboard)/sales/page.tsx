"use client";

import { useState, useEffect, useRef } from "react";
import { Sale } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import ReceiptComponent from "@/components/Receipt";
import { Search, Receipt, Eye, Printer } from "lucide-react";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 20;

export default function SalesPage() {
  const { getToken } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async (loadMore = false) => {
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (loadMore && lastDoc) {
        params.set("startAfter", lastDoc);
      }
      const res = await fetch(`/api/sales?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error("Failed to load sales");
      const list = await res.json();

      if (loadMore) {
        setSales((prev) => [...prev, ...list]);
      } else {
        setSales(list);
      }

      setLastDoc(list.length > 0 ? list[list.length - 1].id : null);
      setHasMore(list.length === PAGE_SIZE);
    } catch (err) {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: [80, canvas.height * 0.26] });
      pdf.addImage(imgData, "PNG", 0, 0, 80, canvas.height * 0.26);
      pdf.save(`receipt-${selectedSale?.receiptNumber || "print"}.pdf`);
      toast.success("Receipt downloaded");
    } catch (err) {
      toast.error("Failed to generate receipt");
    }
  };

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filtered = sales.filter(
    (s) =>
      new Date(s.createdAt) >= sevenDaysAgo &&
      (s.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        s.paymentMethod?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sales History</h1>
        <p className="text-slate-500">{sales.length} transactions</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by receipt, customer, or payment..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Receipt className="h-12 w-12 mx-auto mb-3" />
          <p>No sales found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                    Receipt #
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                    Items
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                    Payment
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">
                    Total
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {sale.receiptNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sale.customerName || (
                        <span className="text-slate-400">Walk-in</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {sale.items?.length || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs capitalize bg-slate-100 text-slate-600">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => loadSales(true)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                Sale Details
              </h2>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div ref={receiptRef}>
              <ReceiptComponent
                items={selectedSale.items}
                subtotal={selectedSale.subtotal}
                tax={selectedSale.tax}
                discount={selectedSale.discount}
                total={selectedSale.total}
                paymentMethod={selectedSale.paymentMethod}
                receiptNumber={selectedSale.receiptNumber}
                customerName={selectedSale.customerName}
                date={selectedSale.createdAt?.toString()}
              />
            </div>

            <button
              onClick={printReceipt}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              <Printer className="h-5 w-5" />
              Download Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
