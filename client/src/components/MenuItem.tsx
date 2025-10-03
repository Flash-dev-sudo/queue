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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [selectedMealType, setSelectedMealType] = useState<string>("none");
  const [isSpicy, setIsSpicy] = useState(false);

  // Meal prices: Use mealPrice from database if available, fallback to defaults
  const regularMealPrice = item.mealPrice || 250; // Default £2.50 (250p)
  const periPeriChipsMealPrice = 280; // Peri peri chips meal = £2.80 (280p)

  // Reset customizations to default values
  const resetCustomizations = () => {
    setBurgerToppings([]);
    setSelectedFlavor("Garlic & Herb");
    setSelectedMealType("none");
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

    // Handle flavor options - use database field
    if (item.hasFlavorOptions && selectedFlavor) {
      customizations.flavor = selectedFlavor;
    }

    // Handle meal upgrade options - use database field
    if (item.hasMealOption) {
      customizations.isMeal = selectedMealType === 'regular';
      customizations.isPeriPeriChipsMeal = selectedMealType === 'peri-peri';
    }

    // Handle spicy/normal option - use database field
    if (item.isSpicyOption) {
      customizations.isSpicy = isSpicy;
    }

    // Handle toppings - only if item has toppings option and selected
    if (item.hasToppingsOption && burgerToppings.length > 0) {
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

            {/* Toppings - Only if item has toppings option enabled */}
            {item.hasToppingsOption && (
              <div className="space-y-3 p-3 bg-green-50 rounded-lg">
                <Label className="text-sm font-medium">🥬 Add Toppings</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "cheese", label: "Cheese", price: 50 },
                    { id: "jalapenos", label: "Jalapeños", price: 30 },
                    { id: "bacon", label: "Bacon", price: 100 },
                    { id: "mushrooms", label: "Mushrooms", price: 40 },
                    { id: "lettuce", label: "Lettuce", price: 0 },
                    { id: "tomato", label: "Tomato", price: 0 },
                    { id: "onions", label: "Red Onions", price: 0 },
                    { id: "pickles", label: "Pickles", price: 0 }
                  ].map((option) => (
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

            {/* Meal Options - Dropdown */}
            {item.hasMealOption && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <Label className="text-sm font-medium text-blue-800 mb-2 block">🍽️ Meal Deal Options</Label>
                <Select onValueChange={setSelectedMealType} value={selectedMealType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select meal option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span>No Meal Deal</span>
                    </SelectItem>
                    <SelectItem value="regular">
                      <div className="flex justify-between items-center w-full">
                        <span>🍽️ Regular Meal - Chips + Drink</span>
                        <span className="text-green-600 ml-2">+{formatPrice(regularMealPrice)}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="peri-peri">
                      <div className="flex justify-between items-center w-full">
                        <span>🌶️ Peri Peri Chips Meal - Peri Peri Chips + Drink</span>
                        <span className="text-green-600 ml-2">+{formatPrice(periPeriChipsMealPrice)}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
