import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onToggle: () => void;
}

// Color mapping for common colors to hex codes
const colorMap: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  gray: "#9CA3AF",
  grey: "#9CA3AF",
  brown: "#8B4513",
  beige: "#F5F5DC",
  blue: "#3B82F6",
  red: "#EF4444",
  green: "#10B981",
  yellow: "#F59E0B",
  orange: "#F97316",
  purple: "#8B5CF6",
  pink: "#EC4899",
  navy: "#1E3A8A",
  cream: "#FFFDD0",
  tan: "#D2B48C",
  silver: "#C0C0C0",
  gold: "#FFD700",
  charcoal: "#36454F",
  walnut: "#773F1A",
  oak: "#B38B47",
  cherry: "#DE3163",
  mahogany: "#C04000",
  espresso: "#6F4E37",
  natural: "#F5DEB3",
};

export function ColorSwatch({ color, isSelected, onToggle }: ColorSwatchProps) {
  const colorHex = colorMap[color.toLowerCase()] || "#9CA3AF";
  const isLight = colorHex === "#FFFFFF" || colorHex === "#FFFDD0" || colorHex === "#F5DEB3" || colorHex === "#F5F5DC";
  
  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={onToggle}
        className={cn(
          "relative w-6 h-6 rounded-full border-2 transition-all duration-200",
          isSelected ? "border-primary scale-110" : "border-border hover:border-muted-foreground",
          isLight && "shadow-sm"
        )}
        style={{ backgroundColor: colorHex }}
        title={color}
      >
        {isSelected && (
          <Check 
            className={cn(
              "w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
              isLight ? "text-gray-800" : "text-white"
            )} 
          />
        )}
      </button>
      <label 
        className="text-sm font-medium cursor-pointer capitalize" 
        onClick={onToggle}
      >
        {color}
      </label>
    </div>
  );
}