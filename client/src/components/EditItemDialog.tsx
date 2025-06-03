import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CartItem } from "@shared/schema";
import { formatPrice } from "@/lib/utils/order-utils";

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

  // Initialize form with current item customizations
  useEffect(() => {
    if (item?.customizations) {
      setChipType(item.customizations.chipType || "normal");
      setBurgerToppings(item.customizations.toppings || []);
      setSelectedFlavor(item.customizations.flavor || "Garlic & Herb");
      setIsMeal(item.customizations.isMeal || false);
      setIsSpicy(item.customizations.isSpicy || false);
    }
  }, [item]);

  if (!item) return null;

  const basePrice = item.customizations?.isMeal ? item.price - 150 : item.price; // Remove meal price to get base
  const mealUpgradePrice = item.name.includes("Peri Peri") && (item.name.includes("Burger") || item.name.includes("Wrap")) ? 180 : 150;
  const currentPrice = isMeal ? basePrice + mealUpgradePrice : basePrice;

  const handleToppingToggle = (topping: string) => {
    setBurgerToppings(prev => 
      prev.includes(topping) 
        ? prev.filter(t => t !== topping)
        : [...prev, topping]
    );
  };

  const handleSave = () => {
    const newCustomizations = {
      chipType,
      toppings: burgerToppings,
      flavor: selectedFlavor,
      isMeal,
      isSpicy
    };

    onSave(item.customizations, newCustomizations, currentPrice);
    onClose();
  };

  const needsCustomization = () => {
    return item.name.includes("Burger") || 
           item.name.includes("Wrap") || 
           item.name.includes("Wings") ||
           item.name.includes("Strip") ||
           item.name.includes("Chips");
  };

  const toppingsOptions = ["Cheese", "Lettuce", "Mayo", "Burger Sauce", "Tomato", "Onions"];
  const flavorOptions = ["Garlic & Herb", "Medium", "Hot", "Extra Hot", "BBQ"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meal Option */}
          {item.name.includes("Burger") || item.name.includes("Wrap") || item.name.includes("Wings") || item.name.includes("Strip") ? (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <Label htmlFor="meal-option" className="font-medium">Make it a meal</Label>
                <p className="text-sm text-gray-600">+{formatPrice(mealUpgradePrice)}</p>
              </div>
              <Switch
                id="meal-option"
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

          {/* Flavor Options - Only for specific items */}
          {(item.name.includes("Peri Peri Burger") || item.name.includes("Peri Peri Wrap") || item.name.includes("EFC Special") || item.name.includes("Emparo Burger")) && (
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
              <span className="font-bold text-lg">{formatPrice(currentPrice)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}