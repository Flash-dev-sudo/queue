import React, { useState } from "react";
import { MenuItem as MenuItemType } from "@shared/schema";
import Counter from "@/components/ui/counter";
import { formatPrice } from "@/lib/utils/order-utils";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface MenuItemProps {
  item: MenuItemType;
  quantity: number;
  onAdd: (customizations?: any) => void;
  onRemove: () => void;
  mealItem?: MenuItemType; // The corresponding meal version
  onAddMeal?: (customizations?: any) => void;
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
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [chipType, setChipType] = useState("normal");
  const [burgerToppings, setBurgerToppings] = useState<string[]>([]);
  const hasMealOption = !!mealItem;

  // Check if item needs customization
  const needsCustomization = (itemName: string) => {
    const name = itemName.toLowerCase();
    return name.includes("chip") || name.includes("burger");
  };

  // Get customization options based on item
  const getCustomizationOptions = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes("chip")) {
      return {
        type: "chips",
        options: [
          { id: "normal", label: "Normal" },
          { id: "spicy", label: "Spicy" }
        ]
      };
    }
    if (name.includes("burger")) {
      return {
        type: "burger",
        options: [
          { id: "cheese", label: "Cheese" },
          { id: "lettuce", label: "Lettuce" },
          { id: "burger_sauce", label: "Burger Sauce" },
          { id: "tomato", label: "Tomato" },
          { id: "onions", label: "Onions" }
        ]
      };
    }
    return null;
  };

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

  // Handle card click - add item with customization if needed
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on counter buttons or switches
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="switch"]')) {
      return;
    }

    const currentItem = isMeal ? mealItem : item;
    const currentOnAdd = isMeal ? onAddMeal : onAdd;
    
    if (!currentItem || !currentOnAdd) return;

    if (needsCustomization(currentItem.name)) {
      setIsCustomizationOpen(true);
    } else {
      currentOnAdd();
    }
  };

  // Handle customization confirmation
  const handleCustomizationConfirm = () => {
    const currentOnAdd = isMeal ? onAddMeal : onAdd;
    if (!currentOnAdd) return;

    const customizations: any = {};
    
    if (chipType && getCustomizationOptions(currentItem?.name || "")?.type === "chips") {
      customizations.chipType = chipType;
    }
    
    if (burgerToppings.length > 0 && getCustomizationOptions(currentItem?.name || "")?.type === "burger") {
      customizations.toppings = burgerToppings;
    }

    currentOnAdd(customizations);
    setIsCustomizationOpen(false);
  };

  const handleToppingsChange = (toppingId: string, checked: boolean) => {
    setBurgerToppings(prev => 
      checked 
        ? [...prev, toppingId]
        : prev.filter(id => id !== toppingId)
    );
  };

  const currentItem = isMeal ? mealItem : item;
  const currentQuantity = isMeal ? mealQuantity : quantity;
  const currentOnAdd = isMeal ? onAddMeal : onAdd;
  const currentOnRemove = isMeal ? onRemoveMeal : onRemove;

  if (!currentItem || !currentOnAdd || !currentOnRemove) {
    return null;
  }

  const customizationOptions = getCustomizationOptions(currentItem?.name || "");

  return (
    <>
      <div 
        className={`rounded-lg border shadow-sm p-3 cursor-pointer transition-all ${
          currentQuantity > 0 ? "bg-primary/5 border-primary" : "hover:border-neutral-300 hover:shadow-md"
        }`} 
        data-item-id={currentItem.id}
        onClick={handleCardClick}
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

      {/* Customization Dialog */}
      <Dialog open={isCustomizationOpen} onOpenChange={setIsCustomizationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize {currentItem?.name}</DialogTitle>
          </DialogHeader>
          
          {customizationOptions && (
            <div className="space-y-4">
              {customizationOptions.type === "chips" && (
                <div>
                  <Label className="text-base font-medium">Choose Style:</Label>
                  <RadioGroup value={chipType} onValueChange={setChipType} className="mt-2">
                    {customizationOptions.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {customizationOptions.type === "burger" && (
                <div>
                  <Label className="text-base font-medium">Select Toppings:</Label>
                  <div className="mt-2 space-y-2">
                    {customizationOptions.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={burgerToppings.includes(option.id)}
                          onCheckedChange={(checked) => handleToppingsChange(option.id, checked as boolean)}
                        />
                        <Label htmlFor={option.id}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCustomizationOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCustomizationConfirm} className="flex-1">
                  Add to Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
