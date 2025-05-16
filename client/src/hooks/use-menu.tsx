import { useQuery } from "@tanstack/react-query";
import { Category, MenuItem } from "@shared/schema";

export function useMenu() {
  // Fetch all categories
  const { 
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useQuery<Category[]>({ 
    queryKey: ['/api/categories']
  });
  
  // Fetch all menu items
  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    error: menuItemsError
  } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu-items']
  });
  
  // Get menu items by category
  const getMenuItemsByCategory = (categoryId: number) => {
    if (!menuItems) return [];
    return menuItems.filter(item => item.categoryId === categoryId);
  };
  
  return {
    categories,
    isLoadingCategories,
    categoriesError,
    menuItems,
    isLoadingMenuItems,
    menuItemsError,
    getMenuItemsByCategory
  };
}
