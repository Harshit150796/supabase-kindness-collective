import { ShoppingCart, Heart, BookOpen, Shirt, Car, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  { icon: ShoppingCart, name: 'Food & Groceries', count: 245, color: 'bg-green-500/10 text-green-600' },
  { icon: Heart, name: 'Healthcare', count: 128, color: 'bg-red-500/10 text-red-600' },
  { icon: BookOpen, name: 'Education', count: 89, color: 'bg-blue-500/10 text-blue-600' },
  { icon: Shirt, name: 'Clothing', count: 156, color: 'bg-purple-500/10 text-purple-600' },
  { icon: Car, name: 'Transportation', count: 67, color: 'bg-orange-500/10 text-orange-600' },
  { icon: Zap, name: 'Utilities', count: 94, color: 'bg-yellow-500/10 text-yellow-600' },
];

export function CategoriesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Support What Matters
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from various categories to direct your generosity where it's needed most.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Card 
              key={category.name}
              className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-border"
            >
              <CardContent className="p-6 text-center">
                <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-7 h-7" />
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.count} coupons</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
