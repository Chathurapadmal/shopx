"use client";

import { useEffect, useState, FormEvent } from "react";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/client";
import { Category, Product } from "@/lib/types";
import toast from "react-hot-toast";

interface ProductFormProps {
  initial?: Partial<Product>;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export default function ProductForm({ initial, onSubmit, loading }: ProductFormProps) {
  const initialCategory = initial?.category || "";
  const [form, setForm] = useState({
    name: initial?.name || "",
    barcode: initial?.barcode || "",
    price: initial?.price?.toString() || "",
    cost: initial?.cost?.toString() || "",
    stock: initial?.stock?.toString() || "",
    category: initialCategory,
    description: initial?.description || "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categorySaving, setCategorySaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const snap = await getDocs(query(collection(db, "categories"), orderBy("name")));
      const loaded = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Category, "id">),
      }));

      if (initialCategory && !loaded.some((category) => category.name === initialCategory)) {
        loaded.push({ id: `local-${initialCategory}`, name: initialCategory });
      }

      loaded.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(loaded);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    const existing = categories.find(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      setForm((prev) => ({ ...prev, category: existing.name }));
      setNewCategory("");
      toast.success("Category already exists");
      return;
    }

    try {
      setCategorySaving(true);
      const docRef = await addDoc(collection(db, "categories"), {
        name: trimmed,
        createdAt: serverTimestamp(),
      });

      const createdCategory: Category = {
        id: docRef.id,
        name: trimmed,
      };

      setCategories((prev) => [...prev, createdCategory].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((prev) => ({ ...prev, category: trimmed }));
      setNewCategory("");
      toast.success("Category added");
    } catch (err) {
      console.error("Failed to add category", err);
      toast.error("Failed to add category");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stock: parseInt(form.stock),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Barcode / SKU
          </label>
          <input
            type="text"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Price * ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Cost ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Stock *
          </label>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Add a new category"
              disabled={categoryLoading}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={categoryLoading || categorySaving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition disabled:opacity-50"
            >
              {categorySaving ? "Adding..." : "Add"}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Choose an existing category or create a new one here.
          </p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Saving..." : initial ? "Update Product" : "Add Product"}
        </button>
      </div>
    </form>
  );
}
