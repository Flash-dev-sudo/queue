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
  editMode?: {
    isEditing: boolean;
    currentCustomizations: any;
    onSaveEdit: (oldCustomizations: any, newCustomizations: any, newPrice: number) => void;
  };
}

export default function MenuItem({
  item,
  quantity,
  onAdd,
  onRemove
}: MenuItemProps) {
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [burgerToppings, setBurgerToppings] = useState<string[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState("Garlic & Herb");
  const [isMeal, setIsMeal] = useState(false);
  const [isPeriPeriChipsMeal, setIsPeriPeriChipsMeal] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);

  // Meal prices: Regular meal (chips + drink) = £2.50 (250p), Peri peri chips meal = £2.80 (280p)
  const regularMealPrice = 250;
  const periPeriChipsMealPrice = 280;

  // Get customization options based on item (removed chip types, simplified)
  const getCustomizationOptions = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes("burger") || name.includes("wrap") || name.includes("special") || name.includes("pounder")) {
      return {
        type: "burger",
        options: [
          { id: "cheese", label: "Cheese" },
          { id: "lettuce", label: "Lettuce" },
          { id: "mayo", label: "Mayo" },
          { id: "burger_sauce", label: "Burger Sauce" },
          { id: "tomato", label: "Tomato" },
          { id: "onions", label: "Onions" }
        ]
      };
    }
    return null;
  };

  // Reset customizations to default values
  const resetCustomizations = () => {
    setBurgerToppings([]);
    setSelectedFlavor("Garlic & Herb");
    setIsMeal(false);
    setIsPeriPeriChipsMeal(false);
    setIsSpicy(false);
  };

  // Handle card click - always open customization modal
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on counter buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    resetCustomizations(); // Reset before opening
    setIsCustomizationOpen(true);
  };

  // Handle customization confirmation
  const handleCustomizationConfirm = () => {
    const customizations: any = {};

    // Handle flavor options for specific items, rice platters, and peri peri chicken
    if (item.name.includes("Peri Peri Burger") || item.name.includes("Peri Peri Wrap") || item.name.includes("EFC Special") || item.name.includes("Emparo Burger") || item.name.includes("Rice Platter") || item.name.includes("Peri Peri Wings") || item.name.includes("Peri Peri Strips") || item.name.includes("Half Chicken") || item.name.includes("Whole Chicken")) {
      customizations.flavor = selectedFlavor;
    }

    // Handle meal upgrade options - regular and peri peri chips
    if (item.name.includes("Burger") || item.name.includes("Wrap") || item.name.includes("Wings") || item.name.includes("Strip")) {
      customizations.isMeal = isMeal;
      customizations.isPeriPeriChipsMeal = isPeriPeriChipsMeal;
    }

    // Handle spicy/normal option for all burgers and wraps
    if (item.name.includes("Burger") || item.name.includes("Wrap")) {
      customizations.isSpicy = isSpicy;
    }

    // Handle burger toppings
    if (burgerToppings.length > 0 && getCustomizationOptions(item.name)?.type === "burger") {
      customizations.toppings = burgerToppings;
    }

    onAdd(customizations);
    setIsCustomizationOpen(false);
  };

  // Handle dialog close (cancel)
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetCustomizations(); // Reset when closing
    }
    setIsCustomizationOpen(open);
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
        </div>
      </div>

      {/* Customization Dialog */}
      <Dialog open={isCustomizationOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-orange-600">Customize {item.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">



            {/* Spicy Option */}
            {(item.name.includes("Burger") || item.name.includes("Wrap")) && (
              <div className="flex items-center justify-between">
                <Label htmlFor="spicy-option" className="font-medium">Spicy</Label>
                <Switch
                  id="spicy-option"
                  checked={isSpicy}
                  onCheckedChange={setIsSpicy}
                />
              </div>
            )}

            {/* Burger Toppings */}
            {customizationOptions && customizationOptions.type === "burger" && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Toppings</Label>
                <div className="grid grid-cols-2 gap-2">
                  {customizationOptions.options.map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      variant={burgerToppings.includes(option.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToppingsChange(option.id, !burgerToppings.includes(option.id))}
                      className="h-10 text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Options */}
            {(item.name.includes("Burger") || item.name.includes("Wrap") || item.name.includes("Wings") || item.name.includes("Strip")) && (
              <div className="space-y-3">
                {/* Regular Meal Deal */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <Label htmlFor="meal-option" className="font-medium text-blue-800">🍽️ Regular Meal Deal</Label>
                    <p className="text-xs text-blue-600">+{formatPrice(regularMealPrice)} - Chips + Drink</p>
                  </div>
                  <Switch
                    id="meal-option"
                    checked={isMeal}
                    onCheckedChange={(checked) => {
                      setIsMeal(checked);
                      if (checked) setIsPeriPeriChipsMeal(false);
                    }}
                  />
                </div>

                {/* Peri Peri Chips Meal Deal */}
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <Label htmlFor="peri-meal-option" className="font-medium text-orange-800">🌶️ Peri Peri Chips Meal</Label>
                    <p className="text-xs text-orange-600">+{formatPrice(periPeriChipsMealPrice)} - Peri Peri Chips + Drink</p>
                  </div>
                  <Switch
                    id="peri-meal-option"
                    checked={isPeriPeriChipsMeal}
                    onCheckedChange={(checked) => {
                      setIsPeriPeriChipsMeal(checked);
                      if (checked) setIsMeal(false);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Flavor Options - For all items with hasFlavorOptions */}
            {item.hasFlavorOptions && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Flavor</Label>
                <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor}>
                  {["Lemon & Herb", "Garlic & Herb", "Medium", "Hot", "Extra Hot", "BBQ"].map((flavor) => (
                    <div key={flavor} className="flex items-center space-x-2">
                      <RadioGroupItem value={flavor} id={flavor} />
                      <Label htmlFor={flavor}>{flavor}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCustomizationOpen(false)} className="flex-1 border-gray-300 hover:bg-gray-50">
                Cancel
              </Button>
              <Button onClick={handleCustomizationConfirm} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium">
                Add to Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
