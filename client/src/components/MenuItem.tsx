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
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState("Garlic & Herb");
  const [isMeal, setIsMeal] = useState(false);
  const [isPeriPeriChipsMeal, setIsPeriPeriChipsMeal] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);

  // Sauce options
  const SAUCES = [
    { id: "mayo", label: "Mayonnaise", price: 0 },
    { id: "ketchup", label: "Ketchup", price: 0 },
    { id: "garlic-mayo", label: "Garlic Mayo", price: 20 },
    { id: "peri-mayo", label: "Peri Peri Mayo", price: 20 },
    { id: "chili-sauce", label: "Chili Sauce", price: 20 },
    { id: "bbq-sauce", label: "BBQ Sauce", price: 20 }
  ];

  // Meal prices: Use mealPrice from database if available, fallback to defaults
  const regularMealPrice = item.mealPrice || 250; // Default £2.50 (250p)
  const periPeriChipsMealPrice = 280; // Peri peri chips meal = £2.80 (280p)

  // Get customization options based on item (removed chip types, simplified)
  const getCustomizationOptions = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes("burger") || name.includes("wrap") || name.includes("special") || name.includes("pounder") || name.includes("pizza")) {
      return {
        type: "burger",
        options: [
          { id: "cheese", label: "Cheese", price: 50 },
          { id: "jalapenos", label: "Jalapeños", price: 30 },
          { id: "bacon", label: "Bacon", price: 100 },
          { id: "mushrooms", label: "Mushrooms", price: 40 },
          { id: "lettuce", label: "Lettuce", price: 0 },
          { id: "tomato", label: "Tomato", price: 0 },
          { id: "onions", label: "Red Onions", price: 0 },
          { id: "pickles", label: "Pickles", price: 0 }
        ]
      };
    }
    return null;
  };

  // Reset customizations to default values
  const resetCustomizations = () => {
    setBurgerToppings([]);
    setSelectedSauces([]);
    setSelectedFlavor("Garlic & Herb");
    setIsMeal(false);
    setIsPeriPeriChipsMeal(false);
    setIsSpicy(false);
  };

  const handleSauceToggle = (sauceId: string, checked: boolean) => {
    setSelectedSauces(prev =>
      checked
        ? [...prev, sauceId]
        : prev.filter(id => id !== sauceId)
    );
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

    // Handle flavor options - use database field
    if (item.hasFlavorOptions && selectedFlavor) {
      customizations.flavor = selectedFlavor;
    }

    // Handle meal upgrade options - use database field
    if (item.hasMealOption) {
      customizations.isMeal = isMeal;
      customizations.isPeriPeriChipsMeal = isPeriPeriChipsMeal;
    }

    // Handle spicy/normal option - use database field
    if (item.isSpicyOption) {
      customizations.isSpicy = isSpicy;
    }

    // Handle toppings - always include if selected
    if (burgerToppings.length > 0) {
      customizations.toppings = burgerToppings;
    }

    // Handle sauces - always include if selected
    if (selectedSauces.length > 0) {
      customizations.sauces = selectedSauces;
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



            {/* Spicy Option - use database field */}
            {item.isSpicyOption && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <Label htmlFor="spicy-option" className="font-medium text-red-800">🌶️ Spicy Option</Label>
                  <p className="text-xs text-red-600">Make it spicy?</p>
                </div>
                <Switch
                  id="spicy-option"
                  checked={isSpicy}
                  onCheckedChange={setIsSpicy}
                />
              </div>
            )}

            {/* Burger Toppings - use database field */}
            {item.hasToppingsOption && customizationOptions && customizationOptions.type === "burger" && (
              <div className="space-y-3 p-3 bg-green-50 rounded-lg">
                <Label className="text-sm font-medium">🥬 Add Toppings</Label>
                <div className="grid grid-cols-2 gap-2">
                  {customizationOptions.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={burgerToppings.includes(option.id)}
                        onCheckedChange={(checked) => handleToppingsChange(option.id, !!checked)}
                      />
                      <Label htmlFor={option.id} className="text-xs cursor-pointer flex-1">
                        {option.label}
                        {option.price > 0 && <span className="text-green-600 ml-1">+{formatPrice(option.price)}</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sauces Selection - use database field */}
            {item.hasSaucesOption && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <Label className="text-sm font-medium">🧂 Choose Sauces</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SAUCES.map((sauce) => (
                    <div key={sauce.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={sauce.id}
                        checked={selectedSauces.includes(sauce.id)}
                        onCheckedChange={(checked) => handleSauceToggle(sauce.id, !!checked)}
                      />
                      <Label htmlFor={sauce.id} className="text-xs cursor-pointer flex-1">
                        {sauce.label}
                        {sauce.price > 0 && <span className="text-green-600 ml-1">+{formatPrice(sauce.price)}</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Options - use database field */}
            {item.hasMealOption && (
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
                <Label className="text-sm font-medium">🍗 Choose Flavor</Label>
                <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor}>
                  {["Plain", "Lemon & Herb", "Garlic & Herb", "Medium", "Hot", "Extra Hot", "BBQ", "Buffalo"].map((flavor) => (
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
