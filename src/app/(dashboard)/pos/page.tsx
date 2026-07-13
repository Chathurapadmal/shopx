"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Product, CartItem, Customer } from "@/lib/types";
import { formatCurrency, generateReceiptNumber } from "@/lib/utils";
import Receipt from "@/components/Receipt";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  Printer,
  User,
  Percent,
  DollarSign,
  Smartphone,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TAX_RATE = 0;

export default function POSPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile">("cash");
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  const loadProducts = async () => {
    try {
      const [productSnap, categorySnap] = await Promise.all([
        getDocs(query(collection(db, "products"), orderBy("name"))),
        getDocs(query(collection(db, "categories"), orderBy("name"))),
      ]);

      const list = productSnap.docs.map((d: { id: string; data: () => Omit<Product, "id"> }) => ({
        id: d.id,
        ...d.data(),
      } as Product));
      setProducts(list);
      const cats = Array.from(
        new Set<string>([
          ...list
            .map((p: Product) => p.category)
            .filter((category: string | null | undefined): category is string => Boolean(category)),
          ...categorySnap.docs
            .map((doc) => doc.data().name)
            .filter((category: string | null | undefined): category is string => Boolean(category)),
        ])
      ).sort((a, b) => a.localeCompare(b));
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  const loadCustomers = async () => {
    try {
      const q = query(collection(db, "customers"), orderBy("name"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d: { id: string; data: () => Omit<Customer, "id"> }) => ({
        id: d.id,
        ...d.data(),
      } as Customer));
      setCustomers(list);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Insufficient stock");
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ];
    });
    setSearchQuery("");
    if (searchRef.current) searchRef.current.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const product = products.find((p) => p.id === productId);
          if (product && newQty > product.stock) {
            toast.error("Insufficient stock");
            return item;
          }
          return { ...item, quantity: newQty, subtotal: newQty * item.price };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * TAX_RATE;
  const total = Math.max(0, subtotal + tax - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setProcessing(true);
    try {
      const receiptNumber = generateReceiptNumber();
      const saleData = {
        items: cart,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        customerId: selectedCustomer?.id || "",
        customerName: selectedCustomer?.name || "",
        cashierId: user?.uid || "",
        cashierName: user?.email || "",
        receiptNumber,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "sales"), saleData);

      for (const item of cart) {
        const productRef = doc(db, "products", item.productId);
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          await updateDoc(productRef, {
            stock: product.stock - item.quantity,
          });
        }
      }

      if (selectedCustomer) {
        const points = Math.floor(total / 10);
        const custRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(custRef, {
          loyaltyPoints: (selectedCustomer.loyaltyPoints || 0) + points,
        });
      }

      setLastSale({
        ...saleData,
        id: docRef.id,
        items: cart,
        subtotal,
        tax,
        discount,
        total,
      });
      setShowReceipt(true);
      toast.success("Sale completed!");
    } catch (err) {
      toast.error("Checkout failed");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: [80, canvas.height * 0.26] });
      pdf.addImage(imgData, "PNG", 0, 0, 80, canvas.height * 0.26);
      pdf.save(`receipt-${lastSale?.receiptNumber || "print"}.pdf`);
      toast.success("Receipt downloaded");
    } catch (err) {
      toast.error("Failed to generate receipt");
    }
  };

  const newSale = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setPaymentMethod("cash");
    setShowReceipt(false);
    setLastSale(null);
    if (searchRef.current) searchRef.current.focus();
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
  );

  if (showReceipt && lastSale) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div ref={receiptRef}>
          <Receipt
            items={lastSale.items}
            subtotal={lastSale.subtotal}
            tax={lastSale.tax}
            discount={lastSale.discount}
            total={lastSale.total}
            paymentMethod={lastSale.paymentMethod}
            receiptNumber={lastSale.receiptNumber}
            customerName={lastSale.customerName}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={printReceipt}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
          >
            <Printer className="h-5 w-5" />
            Download Receipt
          </button>
          <button
            onClick={newSale}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-3rem)]">
      <div className="flex-1 flex flex-col">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or barcode..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory("All")}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${
              activeCategory === "All"
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${
                activeCategory === cat
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="bg-white rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-400 hover:shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {product.name}
                </div>
                <div className="text-lg font-bold text-emerald-600 mt-1">
                  {formatCurrency(product.price)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Stock: {product.stock}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-96 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">Cart ({cart.length})</h2>
            <div className="relative">
              <button
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition"
              >
                <User className="h-4 w-4" />
                {selectedCustomer ? selectedCustomer.name : "Add Customer"}
              </button>
              {showCustomerSearch && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                  <div className="p-2">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search customers..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowCustomerSearch(false);
                          setCustomerSearch("");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && (
                          <span className="text-slate-400 ml-2">{c.phone}</span>
                        )}
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-400">No customers found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedCustomer && (
            <div className="flex items-center justify-between bg-emerald-50 px-3 py-1.5 rounded-lg text-sm">
              <span className="text-emerald-700">
                {selectedCustomer.name}
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">
              Cart is empty
              <br />
              Scan or search products
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-2 bg-slate-50 rounded-lg p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(item.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-800 w-20 text-right">
                  {formatCurrency(item.subtotal)}
                </p>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-1 text-slate-300 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-slate-400" />
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="Discount ($)"
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            {(["cash", "card", "mobile"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition ${
                  paymentMethod === method
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {method === "cash" ? (
                  <DollarSign className="h-4 w-4" />
                ) : method === "card" ? (
                  <CreditCard className="h-4 w-4" />
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-800">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : `Charge ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
