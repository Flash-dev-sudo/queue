import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger re-fetch

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

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your menu and categories</p>
            </div>
            <Button onClick={() => location.reload()} variant="outline" className="flex items-center gap-2">
              <span>🔄</span> Refresh
            </Button>
          </div>
        </div>

        {/* Main Content - Menu Items FIRST, Categories SECOND */}
        <div className="space-y-6">
          <MenuItemManager key={refreshTrigger} refreshTrigger={refreshTrigger} />
          <CategoryManager onCategoryAdded={triggerRefresh} />
        </div>
      </div>
    </div>
  );
}

function CategoryManager({ onCategoryAdded }: { onCategoryAdded: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(""); // Optional icon
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const add = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }

    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    // Use provided icon or default to 🍽️
    const finalIcon = icon.trim() || "🍽️";

    // Auto-calculate next display order
    const nextOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.displayOrder || 0)) + 1
      : 1;

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, icon: finalIcon, displayOrder: nextOrder })
    });

    if (res.ok) {
      setName("");
      setIcon("");
      const updated = await fetch("/api/categories").then(r => r.json());
      setCategories(updated);
      toast({ title: "Category added successfully" });
      onCategoryAdded(); // Trigger refresh in parent to update MenuItemManager
    } else {
      toast({ title: "Failed to add category", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-orange-100 p-3 rounded-lg">
          <span className="text-2xl">📁</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Categories</h2>
          <p className="text-sm text-gray-500">Organize your menu into categories</p>
        </div>
      </div>

      {/* Add Category Form - Simplified */}
      <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span>➕</span> Add New Category
        </h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-2">Name *</label>
            <Input
              placeholder="e.g., Desserts, Mains, Drinks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && add()}
              className="w-full"
            />
          </div>
          <div className="w-32">
            <label className="text-sm font-medium text-gray-700 block mb-2">Icon (optional)</label>
            <Input
              placeholder="🍽️"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full text-center text-lg"
              maxLength={2}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={add} className="bg-orange-500 hover:bg-orange-600">Add Category</Button>
          </div>
        </div>
        <p className="text-xs text-gray-500">If no icon is provided, 🍽️ will be used as default</p>
      </div>

      {/* Categories List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>📋</span> Existing Categories ({categories.length})
        </h3>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">No categories yet. Add one above!</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.icon}</span>
                  <div>
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-500 block">Order: #{c.displayOrder}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItemManager({ refreshTrigger }: { refreshTrigger: number }) {
  const { toast } = useToast();
  const [categoryId, setCategoryId] = useState<number>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [mealPrice, setMealPrice] = useState<string>("2.50");
  const [hasFlavorOptions, setHasFlavorOptions] = useState(false);
  const [hasMealOption, setHasMealOption] = useState(false);
  const [isSpicyOption, setIsSpicyOption] = useState(false);
  const [hasToppingsOption, setHasToppingsOption] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Re-fetch categories when refreshTrigger changes
  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, [refreshTrigger]);

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
    if (isNaN(pricePounds) || pricePounds <= 0) return alert("Enter price in pounds (e.g., 5.00)");

    const mealPricePounds = parseFloat(mealPrice || "0");
    if (isNaN(mealPricePounds) || mealPricePounds < 0) return alert("Enter valid meal price (0 or greater)");

    const pricePence = Math.round(pricePounds * 100);
    const mealPricePence = Math.round(mealPricePounds * 100);

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
        description: description.trim() || null,
        price: pricePence,
        mealPrice: mealPricePence || 250,
        available: true,
        hasFlavorOptions,
        hasMealOption,
        isSpicyOption,
        hasToppingsOption
      })
    });
    if (res.ok) {
      setName("");
      setDescription("");
      setPrice("");
      setMealPrice("2.50");
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
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-orange-100 p-3 rounded-lg">
          <span className="text-2xl">🍽️</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Menu Items</h2>
          <p className="text-sm text-gray-500">Add and manage items in your menu</p>
        </div>
      </div>

      {/* Add New Item Form */}
      <div className="space-y-4 mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span>➕</span> Add New Item
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Category *</label>
            <select className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent" value={categoryId} onChange={(e) => setCategoryId(parseInt(e.target.value))}>
              <option value={0}>Select Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Name *</label>
            <Input placeholder="e.g., Burger" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
          <Input placeholder="e.g., Juicy beef patty with lettuce and tomato" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Price (£) *</label>
            <Input placeholder="e.g., 5.00" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Meal Deal Price (£)</label>
            <Input placeholder="e.g., 2.50" type="number" step="0.01" value={mealPrice} onChange={(e) => setMealPrice(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-3">Customization Options</label>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-all">
              <input type="checkbox" checked={hasFlavorOptions} onChange={(e) => setHasFlavorOptions(e.target.checked)} className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Has Flavors</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-all">
              <input type="checkbox" checked={hasMealOption} onChange={(e) => setHasMealOption(e.target.checked)} className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Has Meal Option</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-all">
              <input type="checkbox" checked={isSpicyOption} onChange={(e) => setIsSpicyOption(e.target.checked)} className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Is Spicy</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-all">
              <input type="checkbox" checked={hasToppingsOption} onChange={(e) => setHasToppingsOption(e.target.checked)} className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Has Toppings</span>
            </label>
          </div>
        </div>

        <Button onClick={add} disabled={!categoryId || !name || !price} className="w-full md:w-auto bg-orange-500 hover:bg-orange-600">
          Add Item
        </Button>
      </div>

      {/* Items List */}
      {categoryId ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>📋</span> Items in {categories.find(c => c.id === categoryId)?.name} ({items.length})
          </h3>
          {items.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">🍽️</span>
              <p className="text-sm text-gray-500">No items yet. Add one above!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all bg-white">
                  {editingItem?.id === item.id ? (
                    <EditItemForm
                      item={editingItem}
                      onSave={(updates) => updateItem(item, updates)}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="bg-orange-100 text-orange-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-lg font-bold text-orange-600">
                                £{(item.price / 100).toFixed(2)}
                              </span>
                              {item.mealPrice && (
                                <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
                                  Meal: +£{(item.mealPrice / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {!item.available && (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-medium">
                                  ❌ Unavailable
                                </span>
                              )}
                              {item.hasFlavorOptions && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                                  🍗 Flavors
                                </span>
                              )}
                              {item.hasMealOption && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-medium">
                                  🍽️ Meal Option
                                </span>
                              )}
                              {item.isSpicyOption && (
                                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-medium">
                                  🌶️ Spicy
                                </span>
                              )}
                              {item.hasToppingsOption && (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                                  🥬 Toppings
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setEditingItem({...item})} className="hover:bg-orange-50 hover:border-orange-300">
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteItem(item)} className="hover:bg-red-600">
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
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-4xl mb-2 block">👆</span>
          <p className="text-sm text-gray-500">Select a category above to view and manage its items</p>
        </div>
      )}
    </div>
  );
}

function EditItemForm({ item, onSave, onCancel }: { item: any, onSave: (updates: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: item.name || "",
    description: item.description || "",
    price: item.price ? (item.price / 100).toFixed(2) : "",
    mealPrice: item.mealPrice ? (item.mealPrice / 100).toFixed(2) : "2.50",
    hasFlavorOptions: item.hasFlavorOptions || false,
    hasMealOption: item.hasMealOption || false,
    isSpicyOption: item.isSpicyOption || false,
    hasToppingsOption: item.hasToppingsOption || false
  });

  const handleSave = () => {
    // Validate price
    const priceNum = parseFloat(formData.price.toString());
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid price greater than 0");
      return;
    }

    // Validate meal price
    const mealPriceNum = parseFloat(formData.mealPrice.toString() || "0");
    if (isNaN(mealPriceNum) || mealPriceNum < 0) {
      alert("Please enter a valid meal price (0 or greater)");
      return;
    }

    const updates = {
      name: formData.name,
      description: formData.description.trim() || null,
      price: Math.round(priceNum * 100),
      mealPrice: Math.round(mealPriceNum * 100) || 250,
      available: item.available ?? true, // Preserve existing availability
      hasFlavorOptions: formData.hasFlavorOptions,
      hasMealOption: formData.hasMealOption,
      isSpicyOption: formData.isSpicyOption,
      hasToppingsOption: formData.hasToppingsOption
    };
    onSave(updates);
  };

  return (
    <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
        <span>✏️</span> Editing: {item.name}
      </h4>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Name</label>
          <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Price (£)</label>
          <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
        <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Meal Deal Price (£)</label>
        <Input type="number" step="0.01" value={formData.mealPrice} onChange={(e) => setFormData({...formData, mealPrice: e.target.value})} />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-3">Customization Options</label>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
            <input type="checkbox" checked={formData.hasFlavorOptions} onChange={(e) => setFormData({...formData, hasFlavorOptions: e.target.checked})} className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Has Flavors</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
            <input type="checkbox" checked={formData.hasMealOption} onChange={(e) => setFormData({...formData, hasMealOption: e.target.checked})} className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Has Meal Option</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
            <input type="checkbox" checked={formData.isSpicyOption} onChange={(e) => setFormData({...formData, isSpicyOption: e.target.checked})} className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Is Spicy</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
            <input type="checkbox" checked={formData.hasToppingsOption} onChange={(e) => setFormData({...formData, hasToppingsOption: e.target.checked})} className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Has Toppings</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">💾 Save Changes</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
