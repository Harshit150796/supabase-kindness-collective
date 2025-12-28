import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gift, Store, Calendar, Tag } from 'lucide-react';

const categories = [
  'Food & Groceries',
  'Clothing',
  'Healthcare',
  'Education',
  'Transportation',
  'Entertainment',
  'Other'
];

export default function DonorDonate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    storeName: '',
    code: '',
    category: '',
    discountValue: '',
    description: '',
    expiryDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get donor's profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase.from('coupons').insert({
        donor_id: profile.id,
        title: formData.title,
        store_name: formData.storeName,
        code: formData.code,
        category: formData.category || null,
        discount_value: formData.discountValue || null,
        description: formData.description || null,
        expiry_date: formData.expiryDate || null,
        status: 'available'
      });

      if (error) throw error;

      toast({
        title: 'Coupon Created!',
        description: 'Your coupon is now available for recipients.'
      });

      setFormData({
        title: '',
        storeName: '',
        code: '',
        category: '',
        discountValue: '',
        description: '',
        expiryDate: ''
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Donate a Coupon</h1>
          <p className="text-muted-foreground">Share a coupon to help someone in need</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Coupon Details
            </CardTitle>
            <CardDescription>Fill in the details of the coupon you want to donate</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Coupon Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., 20% Off Groceries"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Store Name *
                  </Label>
                  <Input
                    id="storeName"
                    placeholder="e.g., Walmart"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Coupon Code *
                  </Label>
                  <Input
                    id="code"
                    placeholder="e.g., SAVE20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input
                    id="discountValue"
                    placeholder="e.g., $10 or 20%"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Any additional details about this coupon..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Donate Coupon'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}