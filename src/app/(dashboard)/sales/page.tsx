"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../../firebase/client";
import { Sale } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Receipt, Eye } from "lucide-react";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async (loadMore = false) => {
    try {
      let q = query(
        collection(db, "sales"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );
      if (loadMore && lastDoc) {
        q = query(
          collection(db, "sales"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }
      const snap = await getDocs(q);
      const list = snap.docs.map((d: { id: string; data: () => Omit<Sale, "id"> }) => ({
        id: d.id,
        ...d.data(),
      } as Sale));

      if (loadMore) {
        setSales((prev) => [...prev, ...list]);
      } else {
        setSales(list);
      }

      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const filtered = sales.filter(
    (s) =>
      s.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.paymentMethod?.toLowerCase().includes(search.toLowerCase())
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

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Receipt:</span>
                  <p className="font-mono font-medium">{selectedSale.receiptNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>
                  <p>{formatDate(selectedSale.createdAt)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Customer:</span>
                  <p>{selectedSale.customerName || "Walk-in"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Payment:</span>
                  <p className="capitalize">{selectedSale.paymentMethod}</p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-200">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items?.map((item, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">{item.name}</td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2">{formatCurrency(item.price)}</td>
                      <td className="text-right py-2">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
