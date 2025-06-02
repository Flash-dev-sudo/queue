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
  const { cart, addToCart, removeFromCart, clearCart, sendOrder, isSubmitting, upgradeToMeal } = useOrder();
  
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
      <div className="bg-secondary text-white p-3 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Emparo Food - Order System</h1>
        <div className="flex space-x-2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
            🍽️ Order Screen
          </span>
          <Link href="/">
            <Button variant="outline" className="bg-white text-secondary border-2 border-white hover:bg-gray-100 font-semibold px-4 py-2 shadow-sm">
              🏠 Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Mobile Categories - Horizontal Scroll */}
        <div className="md:hidden bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2 p-3">
            {Array.isArray(categories) && categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  category.id === selectedCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <div className="flex-1 md:w-3/5 bg-white md:border-r overflow-y-auto">
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
        
        {/* Order Summary */}
        <div className="w-1/5 bg-white overflow-y-auto">
          <OrderSummary
            cart={cart}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onSendOrder={sendOrder}
            isSubmitting={isSubmitting}
            onUpgradeToMeal={upgradeToMeal}
          />
        </div>
      </div>
    </div>
  );
}
