import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Heart, GraduationCap, Shirt, Car, Zap, Check, MapPin } from "lucide-react";

interface LocationCategoryStepProps {
  country: string;
  setCountry: (value: string) => void;
  zipCode: string;
  setZipCode: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
}

const categories = [
  { id: "food", label: "Food & Groceries", icon: ShoppingCart },
  { id: "healthcare", label: "Healthcare", icon: Heart },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "clothing", label: "Clothing", icon: Shirt },
  { id: "transportation", label: "Transportation", icon: Car },
  { id: "utilities", label: "Utilities", icon: Zap },
];

const countries = [
  { value: "us", label: "United States", flag: "🇺🇸" },
  { value: "ca", label: "Canada", flag: "🇨🇦" },
  { value: "uk", label: "United Kingdom", flag: "🇬🇧" },
  { value: "au", label: "Australia", flag: "🇦🇺" },
];

export const LocationCategoryStep = ({
  country,
  setCountry,
  zipCode,
  setZipCode,
  category,
  setCategory,
}: LocationCategoryStepProps) => {
  return (
    <div className="space-y-12 stagger-children">
      {/* Location Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Where will you use the coupons?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Country</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-14 rounded-xl border-border/80 bg-card hover:border-primary/50 transition-colors input-focus-ring">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="rounded-lg">
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Zip / Postal code</label>
            <Input
              type="text"
              placeholder="Enter zip code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="h-14 rounded-xl border-border/80 bg-card hover:border-primary/50 transition-colors input-focus-ring text-base"
            />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
          We'll match you with coupons available in your area
        </p>
      </div>

      {/* Category Section */}
      <div className="space-y-5">
        <h2 className="text-xl font-semibold text-foreground">
          What type of assistance do you need?
        </h2>
        
        <div className="flex flex-wrap gap-3 stagger-fast">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`
                  pill-chip inline-flex items-center gap-2.5 px-5 py-3 rounded-full border-2 font-medium
                  ${isSelected 
                    ? "selected" 
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <span className={`transition-transform duration-300 ${isSelected ? "scale-110" : ""}`}>
                  <Icon className={`w-4 h-4 ${isSelected ? "text-primary-foreground" : ""}`} />
                </span>
                <span>{cat.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 ml-1 animate-check-pop" />
                )}
              </button>
            );
          })}
        </div>
        
        <p className="text-sm text-muted-foreground">
          Select the primary category that matches your needs
        </p>
      </div>
    </div>
  );
};
