import {
  Baby, Car, GraduationCap, HeartPulse, Package, Shirt, ShoppingCart, Siren, UtensilsCrossed, Zap, type LucideIcon,
} from 'lucide-react';
import { needById } from '@/lib/helpNeeds';

/** One icon per need, shared by the apply form, fundraiser pages and the homepage need filter. Kept in its
 *  own small module so the homepage can show it without loading the apply form. */
const ICONS: Record<string, LucideIcon> = {
  food: ShoppingCart, meals: UtensilsCrossed, healthcare: HeartPulse, childcare: Baby, clothing: Shirt,
  education: GraduationCap, transportation: Car, utilities: Zap, essentials: Package, emergency: Siren,
};

export function NeedIcon({ id, className }: { id: string; className?: string }) {
  const Icon = ICONS[needById(id)?.id ?? ''] ?? Package;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}
