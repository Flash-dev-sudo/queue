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
      className={`w-full py-3 px-4 text-left border-b hover:bg-neutral-100 transition-colors ${
        isSelected ? "bg-primary text-white font-medium" : ""
      }`}
      onClick={onSelect}
    >
      <span className="material-icons align-middle mr-2">{category.icon}</span>
      {category.name}
    </button>
  );
}
