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
    if (categories && categories.length > 0 && !selectedCategory) {
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
      {/* Hero section */}
      <HeroSection 
        title="Order Now"
        backgroundUrl="https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=500"
        height="h-40"
      />

      {/* Order Content */}
      <div className="flex h-[calc(100vh-210px)]">
        {/* Menu Categories */}
        <div className="w-1/4 bg-white border-r overflow-y-auto">
          <div className="sticky top-0 bg-secondary text-white py-3 px-4 font-heading font-semibold">
            Menu Categories
          </div>
          <div className="menu-categories">
            {isLoadingCategories ? (
              <div className="p-4 text-center">Loading categories...</div>
            ) : (
              categories?.map((category: Category) => (
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
          {selectedCategory && categories?.find((c: Category) => c.id === selectedCategory) && (
            <div className="sticky top-0 bg-primary text-white py-3 px-4 font-heading flex justify-between items-center">
              <h2 className="font-semibold">
                {categories.find((c: Category) => c.id === selectedCategory)?.name}
              </h2>
              <span className="material-icons">
                {categories.find((c: Category) => c.id === selectedCategory)?.icon}
              </span>
            </div>
          )}

          {isLoadingMenuItems ? (
            <div className="p-4 text-center">Loading menu items...</div>
          ) : (
            menuItems?.map((item: MenuItemType) => (
              <MenuItem
                key={item.id}
                item={item}
                quantity={cart.find(cartItem => cartItem.menuItemId === item.id)?.quantity || 0}
                onAdd={() => addToCart(item)}
                onRemove={() => removeFromCart(item.id)}
              />
            ))
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
