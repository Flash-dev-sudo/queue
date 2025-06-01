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
      className={`w-full py-3 px-4 text-left border-b border-gray-200 hover:bg-blue-50 transition-all duration-200 ${
        isSelected ? "bg-blue-600 text-white font-semibold shadow-lg" : "text-gray-800 bg-white hover:text-blue-600"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center space-x-3">
        <span className="text-lg">{category.icon}</span>
        <span className="font-medium text-sm">{category.name}</span>
      </div>
    </button>
  );
}
