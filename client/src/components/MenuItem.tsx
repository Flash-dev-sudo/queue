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
}

export default function MenuItem({ 
  item, 
  quantity, 
  onAdd, 
  onRemove
}: MenuItemProps) {
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [chipType, setChipType] = useState("normal");
  const [burgerToppings, setBurgerToppings] = useState<string[]>([]);

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

  // Handle card click - add item with customization if needed
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on counter buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    if (needsCustomization(item.name)) {
      setIsCustomizationOpen(true);
    } else {
      onAdd();
    }
  };

  // Handle customization confirmation
  const handleCustomizationConfirm = () => {
    const customizations: any = {};
    
    if (chipType && getCustomizationOptions(item.name)?.type === "chips") {
      customizations.chipType = chipType;
    }
    
    if (burgerToppings.length > 0 && getCustomizationOptions(item.name)?.type === "burger") {
      customizations.toppings = burgerToppings;
    }

    onAdd(customizations);
    setIsCustomizationOpen(false);
  };

  const handleToppingsChange = (toppingId: string, checked: boolean) => {
    setBurgerToppings(prev => 
      checked 
        ? [...prev, toppingId]
        : prev.filter(id => id !== toppingId)
    );
  };

  const customizationOptions = getCustomizationOptions(item.name);

  return (
    <>
      <div 
        className={`rounded-lg border shadow-sm p-3 cursor-pointer transition-all ${
          quantity > 0 ? "bg-primary/5 border-primary" : "hover:border-neutral-300 hover:shadow-md"
        }`} 
        data-item-id={item.id}
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-bold text-secondary">{item.name}</h3>
            {item.description && (
              <p className="text-neutral-500 text-sm line-clamp-1">{item.description}</p>
            )}
            <p className="font-semibold text-primary mt-1">{formatPrice(item.price)}</p>
          </div>
          <div className="ml-4">
            <Counter 
              value={quantity} 
              onIncrement={() => onAdd()} 
              onDecrement={onRemove} 
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
