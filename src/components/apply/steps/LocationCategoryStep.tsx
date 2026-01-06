import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Heart, GraduationCap, Shirt, Car, Zap } from "lucide-react";

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
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "au", label: "Australia" },
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
    <div className="space-y-10">
      {/* Location Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Where will you use the coupons?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Country</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-12 rounded-lg border-border">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Zip code</label>
            <Input
              type="text"
              placeholder="Enter zip code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="h-12 rounded-lg border-border"
            />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          We'll match you with coupons available in your area
        </p>
      </div>

      {/* Category Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          What type of assistance do you need?
        </h2>
        
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 font-medium
                  transition-all duration-200
                  ${isSelected 
                    ? "bg-accent/20 border-accent text-foreground" 
                    : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:bg-secondary/30"
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-accent" : ""}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
