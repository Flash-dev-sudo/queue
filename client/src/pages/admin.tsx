import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const ok = sessionStorage.getItem("admin_ok") === "true";
    if (ok) setIsAuthed(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "emparo2025") {
      sessionStorage.setItem("admin_ok", "true");
      setIsAuthed(true);
      toast({ title: "Welcome, Admin" });
    } else {
      toast({ title: "Wrong password", variant: "destructive" });
    }
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white rounded-lg shadow p-6 w-full max-w-sm">
          <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="mt-4 w-full">Enter</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin</h1>
          <div className="space-x-2">
            <Button onClick={() => location.reload()}>Refresh</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CategoryManager />
          <MenuItemManager />
        </div>
      </div>
    </div>
  );
}

function CategoryManager() {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("restaurant");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const add = async () => {
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon, displayOrder })
    });
    if (res.ok) {
      setName("");
      setIcon("restaurant");
      setDisplayOrder(0);
      const updated = await fetch("/api/categories").then(r => r.json());
      setCategories(updated);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold mb-3">Categories</h2>
      <div className="space-y-2 mb-3">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <Input placeholder="Display order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value || "0"))} />
        <Button onClick={add}>Add Category</Button>
      </div>
      <ul className="text-sm space-y-1">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between border-b py-1">
            <span>#{c.displayOrder} {c.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MenuItemManager() {
  const [categoryId, setCategoryId] = useState<number>(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [mealPrice, setMealPrice] = useState<number | undefined>(undefined);
  const [hasFlavorOptions, setHasFlavorOptions] = useState(false);
  const [hasMealOption, setHasMealOption] = useState(false);
  const [available, setAvailable] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const add = async () => {
    const res = await fetch("/api/admin/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name, price, mealPrice, available, hasFlavorOptions, hasMealOption })
    });
    if (res.ok) {
      setName("");
      setPrice(0);
      setMealPrice(undefined);
      setHasFlavorOptions(false);
      setHasMealOption(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold mb-3">Menu Items</h2>
      <div className="grid gap-2 mb-3">
        <select className="border rounded p-2" value={categoryId} onChange={(e) => setCategoryId(parseInt(e.target.value))}>
          <option value={0}>Select Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Price (pence)" type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value || "0"))} />
        <Input placeholder="Meal Price (pence)" type="number" value={mealPrice ?? ""} onChange={(e) => setMealPrice(e.target.value ? parseInt(e.target.value) : undefined)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} /> Available</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasFlavorOptions} onChange={(e) => setHasFlavorOptions(e.target.checked)} /> Has Flavor Options</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasMealOption} onChange={(e) => setHasMealOption(e.target.checked)} /> Has Meal Option</label>
        <Button onClick={add} disabled={!categoryId || !name || price <= 0}>Add Item</Button>
      </div>
      <p className="text-xs text-neutral-500">Tip: Set Shakes to 500 (i.e., £5.00). Add Dessert category and items similarly.</p>
    </div>
  );
}


