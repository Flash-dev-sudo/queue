import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "@/components/ui/hero-section";
import MenuCategory from "@/components/MenuCategory";
import MenuItem from "@/components/MenuItem";
import OrderSummary from "@/components/OrderSummary";
import { useOrder } from "@/hooks/use-order";
import { Category, MenuItem as MenuItemType } from "@shared/schema";

export default function OrderScreen() {
  const { toast } = useToast();
  const { cart, addToCart, removeFromCart, clearCart, sendOrder, isSubmitting } = useOrder();
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // Fetch categories
  const { 
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useQuery({ 
    queryKey: ['/api/categories'],
  });
  
  // Set the first category as selected by default
  useEffect(() => {
    if (categories && Array.isArray(categories) && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);
  
  // Fetch menu items for selected category
  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    error: menuItemsError
  } = useQuery({
    queryKey: ['/api/categories', selectedCategory, 'items'],
    enabled: !!selectedCategory,
  });
  
  // Handle errors
  useEffect(() => {
    if (categoriesError) {
      toast({
        title: "Error",
        description: "Failed to load menu categories. Please try again.",
        variant: "destructive",
      });
    }
    
    if (menuItemsError) {
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again.",
        variant: "destructive",
      });
    }
  }, [categoriesError, menuItemsError, toast]);
  
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
  };
  
  return (
    <div className="screen-container w-full overflow-hidden">
      {/* Header */}
      <div className="bg-secondary text-white py-3 px-4 flex justify-between items-center shadow-md">
        <div className="flex items-center">
          <span className="material-icons mr-2">restaurant_menu</span>
          <h1 className="font-heading font-bold text-xl">Emparo Food - Order System</h1>
        </div>
        <div className="text-sm bg-primary rounded-full px-3 py-1 font-semibold">
          Front Counter
        </div>
      </div>

      {/* Order Content */}
      <div className="flex h-[calc(100vh-160px)]">
        {/* Menu Categories */}
        <div className="w-1/4 bg-white border-r overflow-y-auto">
          <div className="sticky top-0 bg-secondary text-white py-3 px-4 font-heading font-semibold">
            Menu Categories
          </div>
          <div className="menu-categories">
            {isLoadingCategories ? (
              <div className="p-4 text-center">Loading categories...</div>
            ) : (
              Array.isArray(categories) && categories.map((category: Category) => (
                <MenuCategory
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onSelect={() => handleCategorySelect(category.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="w-2/4 bg-white overflow-y-auto">
          {selectedCategory && Array.isArray(categories) && categories.find((c: Category) => c.id === selectedCategory) && (
            <div className="sticky top-0 bg-primary text-white py-3 px-4 font-heading flex justify-between items-center">
              <h2 className="font-semibold">
                {Array.isArray(categories) && categories.find((c: Category) => c.id === selectedCategory)?.name}
              </h2>
              <span className="material-icons">
                {Array.isArray(categories) && categories.find((c: Category) => c.id === selectedCategory)?.icon}
              </span>
            </div>
          )}

          {/* Search (optional) */}
          <div className="px-4 py-2 border-b">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary"
              />
              <span className="material-icons absolute left-3 top-2 text-neutral-400">search</span>
            </div>
          </div>

          {isLoadingMenuItems ? (
            <div className="p-4 text-center">Loading menu items...</div>
          ) : (
            <div className="grid grid-cols-1 gap-2 p-2">
              {Array.isArray(menuItems) && menuItems.map((item: MenuItemType) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  quantity={cart.find(cartItem => cartItem.menuItemId === item.id)?.quantity || 0}
                  onAdd={() => addToCart(item)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <OrderSummary 
          cart={cart}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onSendOrder={sendOrder}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
