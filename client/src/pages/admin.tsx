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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("admin_ok", "true");
        sessionStorage.setItem("admin_token", data.token);
        setIsAuthed(true);
        toast({ title: "Welcome, Admin" });
      } else {
        toast({ title: "Wrong password", variant: "destructive" });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: "Login failed", variant: "destructive" });
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
  const [displayOrder, setDisplayOrder] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const add = async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, icon, displayOrder: Number(displayOrder) || 0 })
    });
    if (res.ok) {
      setName("");
      setIcon("restaurant");
      setDisplayOrder("");
      const updated = await fetch("/api/categories").then(r => r.json());
      setCategories(updated);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold mb-3">Categories</h2>
      <div className="space-y-2 mb-3">
        <label className="text-sm font-medium">Name</label>
        <Input placeholder="e.g., Desserts" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="text-sm font-medium">Icon</label>
        <Input placeholder="material icon name (e.g., restaurant)" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <label className="text-sm font-medium">Display order</label>
        <Input placeholder="e.g., 7" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
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
  const { toast } = useToast();
  const [categoryId, setCategoryId] = useState<number>(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [hasFlavorOptions, setHasFlavorOptions] = useState(false);
  const [hasMealOption, setHasMealOption] = useState(false);
  const [isSpicyOption, setIsSpicyOption] = useState(false);
  const [hasToppingsOption, setHasToppingsOption] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!categoryId) { setItems([]); return; }
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    fetch(`/api/admin/menu-items?categoryId=${categoryId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json()).then(setItems).catch(() => setItems([]));
  }, [categoryId]);

  const add = async () => {
    if (!categoryId) return alert("Please select a category");
    if (!name.trim()) return alert("Please enter an item name");
    const pricePounds = parseFloat(price || "0");
    if (!pricePounds || pricePounds <= 0) return alert("Enter price in pounds (e.g., 5.00)");
    const pricePence = Math.round(pricePounds * 100);

    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    const res = await fetch("/api/admin/menu-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        categoryId,
        name,
        price: pricePence,
        mealPrice: 250, // Default £2.50 for meal deals
        available: true, // Always available
        hasFlavorOptions,
        hasMealOption,
        isSpicyOption,
        hasToppingsOption,
        hasSaucesOption: true // Sauces always available
      })
    });
    if (res.ok) {
      setName("");
      setPrice("");
      setHasFlavorOptions(false);
      setHasMealOption(false);
      setIsSpicyOption(false);
      setHasToppingsOption(false);
      const updated = await fetch(`/api/admin/menu-items?categoryId=${categoryId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).catch(() => []);
      setItems(updated);
      toast({ title: "Menu item added successfully" });
    } else {
      const err = await res.json().catch(() => ({} as any));
      toast({ title: "Failed to add item", description: err?.message, variant: "destructive" });
    }
  };

  const updateItem = async (item: any, updates: any) => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    const res = await fetch(`/api/admin/menu-items/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      const updated = await fetch(`/api/admin/menu-items?categoryId=${categoryId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).catch(() => []);
      setItems(updated);
      setEditingItem(null);
      toast({ title: "Menu item updated successfully" });
    } else {
      const err = await res.json().catch(() => ({} as any));
      toast({ title: "Failed to update item", description: err?.message, variant: "destructive" });
    }
  };

  const deleteItem = async (item: any) => {
    if (!confirm(`Delete "${item.name}"?`)) return;

    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    const res = await fetch(`/api/admin/menu-items/${item.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      const updated = await fetch(`/api/admin/menu-items?categoryId=${categoryId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).catch(() => []);
      setItems(updated);
      toast({ title: "Menu item deleted successfully" });
    } else {
      const err = await res.json().catch(() => ({} as any));
      toast({ title: "Failed to delete item", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold mb-3">Menu Items</h2>

      {/* Add New Item Form */}
      <div className="grid gap-2 mb-4 p-3 bg-neutral-50 rounded">
        <h3 className="font-medium text-sm">Add New Item</h3>
        <label className="text-sm font-medium">Category</label>
        <select className="border rounded p-2" value={categoryId} onChange={(e) => setCategoryId(parseInt(e.target.value))}>
          <option value={0}>Select Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="text-sm font-medium">Name</label>
        <Input placeholder="e.g., Burger" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="text-sm font-medium">Price (£)</label>
        <Input placeholder="e.g., 5.00" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={hasFlavorOptions} onChange={(e) => setHasFlavorOptions(e.target.checked)} /> Has Flavors</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={hasMealOption} onChange={(e) => setHasMealOption(e.target.checked)} /> Has Meal Option</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={isSpicyOption} onChange={(e) => setIsSpicyOption(e.target.checked)} /> Is Spicy</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={hasToppingsOption} onChange={(e) => setHasToppingsOption(e.target.checked)} /> Has Toppings</label>
        </div>
        <Button onClick={add} disabled={!categoryId || !name || !price}>Add Item</Button>
      </div>

      <p className="text-xs text-neutral-500 mb-3">Tip: Set Shakes to 5.00 (i.e., £5.00). Add Dessert category and items similarly.</p>

      {/* Items List */}
      {categoryId ? (
        <div>
          <h3 className="text-sm font-semibold mb-2">Items in {categories.find(c => c.id === categoryId)?.name}</h3>
          {items.length === 0 ? (
            <p className="text-xs text-neutral-500">No items yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="border rounded p-2">
                  {editingItem?.id === item.id ? (
                    <EditItemForm
                      item={editingItem}
                      onSave={(updates) => updateItem(item, updates)}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-neutral-500">
                            £{(item.price / 100).toFixed(2)}
                            {item.mealPrice && ` (meal: £${(item.mealPrice / 100).toFixed(2)})`}
                          </span>
                        </div>
                        <div className="flex gap-2 text-xs text-neutral-500 mt-1">
                          {!item.available && <span className="bg-red-100 text-red-800 px-1 rounded">Unavailable</span>}
                          {item.hasFlavorOptions && <span className="bg-blue-100 text-blue-800 px-1 rounded">Flavors</span>}
                          {item.hasMealOption && <span className="bg-green-100 text-green-800 px-1 rounded">Meal Option</span>}
                          {item.isSpicyOption && <span className="bg-orange-100 text-orange-800 px-1 rounded">Spicy</span>}
                        </div>
                      </div>
                      <div className="space-x-1">
                        <Button size="sm" variant="outline" onClick={() => setEditingItem({...item})}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteItem(item)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function EditItemForm({ item, onSave, onCancel }: { item: any, onSave: (updates: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: item.name || "",
    price: item.price ? (item.price / 100).toFixed(2) : "",
    hasFlavorOptions: item.hasFlavorOptions || false,
    hasMealOption: item.hasMealOption || false,
    isSpicyOption: item.isSpicyOption || false,
    hasToppingsOption: item.hasToppingsOption || false
  });

  const handleSave = () => {
    const updates = {
      name: formData.name,
      price: Math.round(parseFloat(formData.price.toString()) * 100),
      mealPrice: 250, // Default £2.50
      available: true, // Always available
      hasFlavorOptions: formData.hasFlavorOptions,
      hasMealOption: formData.hasMealOption,
      isSpicyOption: formData.isSpicyOption,
      hasToppingsOption: formData.hasToppingsOption,
      hasSaucesOption: true // Sauces always available
    };
    onSave(updates);
  };

  return (
    <div className="space-y-2 bg-neutral-50 p-3 rounded">
      <label className="text-sm font-medium">Name</label>
      <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
      <label className="text-sm font-medium">Price (£)</label>
      <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.hasFlavorOptions} onChange={(e) => setFormData({...formData, hasFlavorOptions: e.target.checked})} />
          Has Flavors
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.hasMealOption} onChange={(e) => setFormData({...formData, hasMealOption: e.target.checked})} />
          Has Meal Option
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.isSpicyOption} onChange={(e) => setFormData({...formData, isSpicyOption: e.target.checked})} />
          Is Spicy
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.hasToppingsOption} onChange={(e) => setFormData({...formData, hasToppingsOption: e.target.checked})} />
          Has Toppings
        </label>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}


