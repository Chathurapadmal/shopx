"use client";

import { useRef } from "react";
import { CartItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ReceiptProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  receiptNumber: string;
  customerName?: string;
}

export default function Receipt({
  items,
  subtotal,
  tax,
  discount,
  total,
  paymentMethod,
  receiptNumber,
  customerName,
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={receiptRef} className="bg-white p-6 max-w-sm mx-auto font-mono text-sm">
      <div className="text-center border-b-2 border-dashed border-slate-300 pb-3 mb-3">
        <h2 className="text-lg font-bold">ShopX POS</h2>
        <p className="text-xs text-slate-500">123 Main Street, City</p>
        <p className="text-xs text-slate-500">Tel: +1 234 567 890</p>
      </div>

      <div className="text-xs text-slate-500 mb-3">
        <p>Receipt: {receiptNumber}</p>
        <p>Date: {new Date().toLocaleString()}</p>
        {customerName && <p>Customer: {customerName}</p>}
      </div>

      <table className="w-full text-xs mb-3">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="text-left py-1">Item</th>
            <th className="text-center py-1">Qty</th>
            <th className="text-right py-1">Price</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="py-1 max-w-[120px] truncate">{item.name}</td>
              <td className="text-center py-1">{item.quantity}</td>
              <td className="text-right py-1">{formatCurrency(item.price)}</td>
              <td className="text-right py-1">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t-2 border-dashed border-slate-300 pt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax (0%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-300">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Payment</span>
          <span className="capitalize">{paymentMethod}</span>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 mt-4 pt-3 border-t-2 border-dashed border-slate-300">
        <p>Thank you for your purchase!</p>
        <p>Visit us again!</p>
      </div>
    </div>
  );
}
