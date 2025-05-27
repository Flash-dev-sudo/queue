import React, { useState } from "react";
import { MenuItem as MenuItemType } from "@shared/schema";
import Counter from "@/components/ui/counter";
import { formatPrice } from "@/lib/utils/order-utils";
import { Switch } from "@/components/ui/switch";

interface MenuItemProps {
  item: MenuItemType;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  mealItem?: MenuItemType; // The corresponding meal version
  onAddMeal?: () => void;
  onRemoveMeal?: () => void;
  mealQuantity?: number;
}

export default function MenuItem({ 
  item, 
  quantity, 
  onAdd, 
  onRemove, 
  mealItem, 
  onAddMeal, 
  onRemoveMeal, 
  mealQuantity = 0 
}: MenuItemProps) {
  const [isMeal, setIsMeal] = useState(false);
  const hasMealOption = !!mealItem;

  const handleMealToggle = (checked: boolean) => {
    setIsMeal(checked);
    // When switching to meal, transfer quantity
    if (checked && quantity > 0 && onAddMeal) {
      for (let i = 0; i < quantity; i++) {
        onAddMeal();
      }
      // Remove from regular item
      for (let i = 0; i < quantity; i++) {
        onRemove();
      }
    } else if (!checked && mealQuantity > 0 && onRemoveMeal) {
      // When switching back to regular, transfer quantity
      for (let i = 0; i < mealQuantity; i++) {
        onRemoveMeal();
      }
      // Add to regular item
      for (let i = 0; i < mealQuantity; i++) {
        onAdd();
      }
    }
  };

  const currentItem = isMeal ? mealItem : item;
  const currentQuantity = isMeal ? mealQuantity : quantity;
  const currentOnAdd = isMeal ? onAddMeal : onAdd;
  const currentOnRemove = isMeal ? onRemoveMeal : onRemove;

  if (!currentItem || !currentOnAdd || !currentOnRemove) {
    return null;
  }

  return (
    <div 
      className={`rounded-lg border shadow-sm p-3 ${
        currentQuantity > 0 ? "bg-primary/5 border-primary" : "hover:border-neutral-300"
      }`} 
      data-item-id={currentItem.id}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3 className="font-bold text-secondary">{currentItem.name}</h3>
          {currentItem.description && (
            <p className="text-neutral-500 text-sm line-clamp-1">{currentItem.description}</p>
          )}
          <p className="font-semibold text-primary mt-1">{formatPrice(currentItem.price)}</p>
          
          {hasMealOption && (
            <div className="flex items-center gap-2 mt-2">
              <Switch
                id={`meal-${item.id}`}
                checked={isMeal}
                onCheckedChange={handleMealToggle}
              />
              <label 
                htmlFor={`meal-${item.id}`} 
                className="text-sm text-neutral-600 cursor-pointer"
              >
                Upgrade to Meal (+{formatPrice((mealItem?.price || 0) - item.price)})
              </label>
            </div>
          )}
        </div>
        <div className="ml-4">
          <Counter 
            value={currentQuantity} 
            onIncrement={currentOnAdd} 
            onDecrement={currentOnRemove} 
          />
        </div>
      </div>
    </div>
  );
}
