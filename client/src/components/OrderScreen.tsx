import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MenuCategory from "@/components/MenuCategory";
import MenuItem from "@/components/MenuItem";
import OrderSummary from "@/components/OrderSummary";
import { useOrder } from "@/hooks/use-order";
import { Category, MenuItem as MenuItemType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Counter from "@/components/ui/counter";
import { Link } from "wouter";

export default function OrderScreen() {
  const { toast } = useToast();
  const { cart, addToCart, removeFromCart, clearCart, sendOrder, isSubmitting, upgradeToMeal, editItem: updateCartItem, updateItemNotes } = useOrder();
  
  const [editingItem, setEditingItem] = useState<{menuItemId: number, customizations: any} | null>(null);
  
  // Handle editing an item - trigger the MenuItem component's edit mode
  const handleEditItem = (menuItemId: number, customizations?: any) => {
    setEditingItem({ menuItemId, customizations });
  };
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showMobileCart, setShowMobileCart] = useState(false);
  
  // Fetch categories
  const { 
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useQuery({ 
    queryKey: ['/api/categories'],
  });
  
  // Fetch all menu items
  const {
    data: allMenuItems,
    isLoading: isLoadingAllMenuItems,
    error: allMenuItemsError
  } = useQuery({
    queryKey: ['/api/menu-items'],
  });
  
  // Set the first category as selected by default
  useEffect(() => {
    if (categories && Array.isArray(categories) && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);
  
  // Handle errors
  useEffect(() => {
    if (categoriesError) {
      toast({
        title: "Error",
        description: "Failed to load menu categories. Please try again.",
        variant: "destructive",
      });
    }
    
    if (allMenuItemsError) {
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again.",
        variant: "destructive",
      });
    }
  }, [categoriesError, allMenuItemsError, toast]);
  
  // Simple filtered menu items
  const menuItems = useMemo(() => {
    if (!allMenuItems || !Array.isArray(allMenuItems)) return [];
    
    // Filter by search term if provided
    if (searchTerm.trim() !== "") {
      return allMenuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Otherwise filter by selected category
    if (selectedCategory) {
      return allMenuItems.filter(item => item.categoryId === selectedCategory);
    }
    
    return [];
  }, [allMenuItems, selectedCategory, searchTerm]);
  
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
  };
  
  // Get current category name
  const currentCategoryName = useMemo(() => {
    if (!categories || !Array.isArray(categories) || !selectedCategory) {
      return "";
    }
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : "";
  }, [categories, selectedCategory]);

  // Get item quantity in cart (sum all variations of the same item)
  const getItemQuantity = (itemId: number) => {
    const items = cart.filter(cartItem => cartItem.menuItemId === itemId);
    return items.reduce((total, item) => total + item.quantity, 0);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-secondary text-white p-2 md:p-3 flex justify-between items-center shadow-md">
        <h1 className="text-lg md:text-xl font-bold">Emparo Food - Order System</h1>
        <div className="flex space-x-1 md:space-x-2">
          <Link href="/">
            <Button variant="outline" className="bg-white text-secondary border-2 border-white hover:bg-gray-100 font-semibold px-2 md:px-4 py-1 md:py-2 shadow-sm text-xs md:text-sm">
              🏠 Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Mobile Categories - Horizontal Scroll */}
        <div className="md:hidden bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-3 p-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {Array.isArray(categories) && categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 min-w-max ${
                  category.id === selectedCategory
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Categories Sidebar */}
        <div className="hidden md:block w-1/5 bg-white border-r overflow-y-auto">
          <h2 className="text-lg font-bold p-4 border-b">Menu Categories</h2>
          
          {isLoadingCategories ? (
            <div className="p-4">Loading categories...</div>
          ) : (
            <div>
              {Array.isArray(categories) && categories.map((category) => (
                <MenuCategory
                  key={category.id}
                  category={category}
                  isSelected={category.id === selectedCategory}
                  onSelect={() => handleCategorySelect(category.id)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Menu Items */}
        <div className="flex-1 md:w-1/2 bg-white md:border-r overflow-y-auto">
          {/* Category Header */}
          <div className="sticky top-0 bg-primary text-white p-3 md:p-4 flex items-center justify-between z-10">
            <h2 className="text-lg md:text-xl font-bold flex items-center">
              {currentCategoryName}
            </h2>
            {selectedCategory && Array.isArray(categories) && 
              <span className="material-icons">
                {categories.find(c => c.id === selectedCategory)?.icon}
              </span>
            }
          </div>
          
          {/* Search */}
          <div className="p-2 md:p-4 border-b">
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm md:text-base"
            />
          </div>
          
          {/* Menu Items */}
          <div className="p-2 md:p-4">
            {isLoadingAllMenuItems ? (
              <div>Loading menu items...</div>
            ) : menuItems.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {menuItems.map((item: MenuItemType) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    quantity={getItemQuantity(item.id)}
                    onAdd={(customizations?: any) => addToCart(item, customizations)}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items found in this category
              </div>
            )}
          </div>
        </div>
        
        {/* Desktop Order Summary */}
        <div className="hidden md:block w-1/3 bg-white overflow-y-auto">
          <OrderSummary
            cart={cart}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onSendOrder={sendOrder}
            isSubmitting={isSubmitting}
            onUpgradeToMeal={upgradeToMeal}
            onEditItem={handleEditItem}
            onSaveNotes={updateItemNotes}
          />
        </div>
      </div>

      {/* Mobile Cart Summary - Fixed Bottom */}
      {cart.length > 0 && (
        <div className="md:hidden bg-white border-t-2 border-orange-200 p-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items in cart
              </span>
              <span className="text-xl font-bold text-orange-600">
                £{(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 100).toFixed(2)}
              </span>
            </div>
            <button 
              onClick={() => setShowMobileCart(!showMobileCart)}
              className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all active:scale-95"
            >
              {showMobileCart ? 'Close Cart' : 'View Cart'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Overlay */}
      {showMobileCart && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Order Summary</h3>
              <button 
                onClick={() => setShowMobileCart(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <OrderSummary
                cart={cart}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onSendOrder={sendOrder}
                isSubmitting={isSubmitting}
                onUpgradeToMeal={upgradeToMeal}
                onEditItem={handleEditItem}
                onSaveNotes={updateItemNotes}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
