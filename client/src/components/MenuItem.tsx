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
  const [chipType, setChipType] = useState("normal");
  const [burgerToppings, setBurgerToppings] = useState<string[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState("Garlic & Hector");
  const [isMeal, setIsMeal] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);

  // Calculate meal upgrade price
  const mealUpgradePrice = item.name.includes("Peri Peri") && (item.name.includes("Burger") || item.name.includes("Wrap")) ? 180 : 150;

  // Check if item needs customization
  const needsCustomization = (item: MenuItemType) => {
    return item.hasFlavorOptions || item.hasMealOption || item.isSpicyOption;
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
    setChipType("normal");
    setBurgerToppings([]);
    setSelectedFlavor("Garlic & Hector");
    setIsMeal(false);
    setIsSpicy(false);
  };

  // Handle card click - add item with customization if needed
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on counter buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    if (needsCustomization(item)) {
      resetCustomizations(); // Reset before opening
      setIsCustomizationOpen(true);
    } else {
      onAdd();
    }
  };

  // Handle customization confirmation
  const handleCustomizationConfirm = () => {
    const customizations: any = {};
    
    // Handle flavor options for specific items, rice platters, and peri peri chicken
    if (item.name.includes("Peri Peri Burger") || item.name.includes("Peri Peri Wrap") || item.name.includes("EFC Special") || item.name.includes("Emparo Burger") || item.name.includes("Rice Platter") || item.name.includes("Peri Peri Wings") || item.name.includes("Peri Peri Strips") || item.name.includes("Half Chicken") || item.name.includes("Whole Chicken")) {
      customizations.flavor = selectedFlavor;
    }
    
    // Handle meal upgrade and calculate proper price
    if (item.name.includes("Burger") || item.name.includes("Wrap") || item.name.includes("Wings") || item.name.includes("Strip")) {
      customizations.isMeal = isMeal;
    }
    
    // Handle spicy/normal option for all burgers and wraps
    if (item.name.includes("Burger") || item.name.includes("Wrap")) {
      customizations.isSpicy = isSpicy;
    }
    
    // Handle legacy chip and burger customizations
    if (chipType && getCustomizationOptions(item.name)?.type === "chips") {
      customizations.chipType = chipType;
    }
    
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
            <DialogTitle>Customize {item.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">

            {/* Meal Option */}
            {(item.name.includes("Burger") || item.name.includes("Wrap") || item.name.includes("Wings") || item.name.includes("Strip") || item.name.includes("Half Chicken") || item.name.includes("Whole Chicken")) && (
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
            )}

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

            {/* Legacy customizations */}
            {customizationOptions && (
              <>
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
              </>
            )}

            {/* Flavor Options - Only for specific items */}
            {(item.name.includes("Peri Peri Burger") || item.name.includes("Peri Peri Wrap") || item.name.includes("EFC Special") || item.name.includes("Emparo Burger") || item.name.includes("Rice Platter") || item.name.includes("Peri Peri Wings") || item.name.includes("Peri Peri Strips") || item.name.includes("Half Chicken") || item.name.includes("Whole Chicken")) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Flavor</Label>
                <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor}>
                  {["Garlic & Hector", "Medium", "Hot", "Extra Hot", "BBQ"].map((flavor) => (
                    <div key={flavor} className="flex items-center space-x-2">
                      <RadioGroupItem value={flavor} id={flavor} />
                      <Label htmlFor={flavor}>{flavor}</Label>
                    </div>
                  ))}
                </RadioGroup>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
