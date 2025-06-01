import React from "react";
import { Category } from "@shared/schema";

interface MenuCategoryProps {
  category: Category;
  isSelected: boolean;
  onSelect: () => void;
}

export default function MenuCategory({ category, isSelected, onSelect }: MenuCategoryProps) {
  return (
    <button
      className={`w-full py-4 px-4 text-left border-b hover:bg-neutral-50 transition-all duration-200 ${
        isSelected ? "bg-primary text-white font-semibold shadow-md border-l-4 border-l-primary" : "text-gray-700"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center">
        <span className="material-icons align-middle mr-3 text-lg">{category.icon}</span>
        <span className="font-medium">{category.name}</span>
      </div>
    </button>
  );
}
