import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CartItem, MenuItem } from "@shared/schema";
import { formatPrice } from "@/lib/utils/order-utils";
import { useQuery } from "@tanstack/react-query";

interface EditItemDialogProps {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (oldCustomizations: any, newCustomizations: any, newPrice: number) => void;
}

export default function EditItemDialog({ item, isOpen, onClose, onSave }: EditItemDialogProps) {
  const [chipType, setChipType] = useState("normal");
  const [burgerToppings, setBurgerToppings] = useState<string[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState("Garlic & Herb");
  const [isMeal, setIsMeal] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);

  // Fetch menu items to get mealPrice information
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Calculate current price based on customizations
  const getCurrentPrice = () => {
    if (!item) return 0;
    
    let price = item.price;
    const originalMenuItem = menuItems?.find(mi => mi.id === item.menuItemId);
    
    if (isMeal) {
      if (item.name.includes("Rice Platter")) {
        price = item.price + 50; // +£0.50 for drinks
      } else if (originalMenuItem?.mealPrice) {
        price = originalMenuItem.mealPrice; // Use meal price for other items
      }
    }
    
    return price;
  };

  // Initialize form with current item customizations
  useEffect(() => {
    if (item) {
      setChipType(item.customizations?.chipType || "normal");
      setBurgerToppings(item.customizations?.toppings || []);
      
      // Set default flavor based on item type - all platters use "Garlic & Herb"
      const defaultFlavor = item.name.includes("Platter") ? "Garlic & Herb" : "Garlic & Hector";
      setSelectedFlavor(item.customizations?.flavor || defaultFlavor);
      setIsMeal(item.customizations?.isMeal || false);
      setIsSpicy(item.customizations?.isSpicy || false);
    }
  }, [item]);

  if (!item) return null;

  const displayPrice = getCurrentPrice();

  const handleToppingToggle = (topping: string) => {
    setBurgerToppings(prev => 
      prev.includes(topping) 
        ? prev.filter(t => t !== topping)
        : [...prev, topping]
    );
  };

  const handleSave = () => {
    const newCustomizations: any = {};
    
    // Handle flavor options for all platters and specific items
    if (item.name.includes("Peri Peri Burger") || item.name.includes("Peri Peri Wrap") || 
        item.name.includes("EFC Special") || item.name.includes("Emparo Burger") || 
        item.name.includes("Platter") || item.name.includes("Peri Peri Wings") || 
        item.name.includes("Peri Peri Strips") || item.name.includes("Half Chicken") || 
        item.name.includes("Whole Chicken")) {
      newCustomizations.flavor = selectedFlavor;
    }
    
    // Handle meal upgrade for applicable items or drinks for rice platters
    if (item.name.includes("Burger") || item.name.includes("Wrap") || 
        item.name.includes("Wings") || item.name.includes("Strip") || 
        item.name.includes("Half Chicken") || item.name.includes("Whole Chicken") || 
        item.name.includes("Rice Platter")) {
      newCustomizations.isMeal = isMeal;
    }
    
    // Handle spicy option for all burgers and wraps
    if (item.name.includes("Burger") || item.name.includes("Wrap")) {
      newCustomizations.isSpicy = isSpicy;
    }
    
    // Handle chip customizations
    if (item.name.includes("Chips")) {
      newCustomizations.chipType = chipType;
    }
    
    // Handle burger/wrap toppings
    if ((item.name.includes("Burger") || item.name.includes("Wrap")) && burgerToppings.length > 0) {
      newCustomizations.toppings = burgerToppings;
    }

    // Calculate the final price
    const finalPrice = getCurrentPrice();
    
    onSave(item.customizations, newCustomizations, finalPrice);
    onClose();
  };

  const toppingsOptions = ["Cheese", "Lettuce", "Mayo", "Burger Sauce", "Tomato", "Onions"];
  
  // Standardized flavor options for all items
  const flavorOptions = ["Garlic & Herb", "Medium", "Hot", "Extra Hot", "BBQ"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meal Option or Drinks for Rice Platters */}
          {(item.name.includes("Burger") || item.name.includes("Wrap") || 
            item.name.includes("Wings") || item.name.includes("Strip") || 
            item.name.includes("Half Chicken") || item.name.includes("Whole Chicken")) && 
           !item.name.includes("Platter") ? (
            <div className="flex items-center justify-between">
              <Label htmlFor="meal-option">Make it a meal +£1.50</Label>
              <Switch
                id="meal-option"
                checked={isMeal}
                onCheckedChange={setIsMeal}
              />
            </div>
          ) : item.name.includes("Rice Platter") ? (
            <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
              <div>
                <Label htmlFor="drinks-option" className="font-medium">Add drinks</Label>
                <p className="text-sm text-gray-600">+£0.50</p>
              </div>
              <Switch
                id="drinks-option"
                checked={isMeal}
                onCheckedChange={setIsMeal}
              />
            </div>
          ) : null}

          {/* Spicy Option */}
          {item.name.includes("Burger") || item.name.includes("Wrap") ? (
            <div className="flex items-center justify-between">
              <Label htmlFor="spicy-option">Spicy</Label>
              <Switch
                id="spicy-option"
                checked={isSpicy}
                onCheckedChange={setIsSpicy}
              />
            </div>
          ) : null}

          {/* Chip Type */}
          {item.name.includes("Chips") && !item.name.includes("Wings") && !item.name.includes("Strip") ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Chip Type</Label>
              <RadioGroup value={chipType} onValueChange={setChipType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">Normal Chips</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="peri-peri" id="peri-peri" />
                  <Label htmlFor="peri-peri">Peri Peri Chips</Label>
                </div>
              </RadioGroup>
            </div>
          ) : null}

          {/* Toppings */}
          {item.name.includes("Burger") || item.name.includes("Wrap") ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Toppings</Label>
              <div className="grid grid-cols-2 gap-2">
                {toppingsOptions.map((topping) => (
                  <Button
                    key={topping}
                    type="button"
                    variant={burgerToppings.includes(topping) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToppingToggle(topping)}
                    className="h-10 text-xs"
                  >
                    {topping}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Flavor Options - For all platters and specific items */}
          {(item.name.includes("Peri Peri Burger") || item.name.includes("Peri Peri Wrap") || 
            item.name.includes("EFC Special") || item.name.includes("Emparo Burger") || 
            item.name.includes("Platter") || item.name.includes("Peri Peri Wings") || 
            item.name.includes("Peri Peri Strips") || item.name.includes("Half Chicken") || 
            item.name.includes("Whole Chicken")) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Flavor</Label>
              <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor}>
                {flavorOptions.map((flavor) => (
                  <div key={flavor} className="flex items-center space-x-2">
                    <RadioGroupItem value={flavor} id={flavor} />
                    <Label htmlFor={flavor}>{flavor}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Price Display */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Price:</span>
              <span className="font-bold text-lg">{formatPrice(displayPrice)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Add to Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}