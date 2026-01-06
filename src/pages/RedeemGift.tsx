import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GiftCard } from '@/components/redeem/GiftCard';
import { InvalidGiftState } from '@/components/redeem/InvalidGiftState';
import { ConfettiCelebration } from '@/components/redeem/ConfettiCelebration';
import { Loader2, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

interface GiftCode {
  id: string;
  code: string;
  donor_name: string | null;
  amount: number;
  message: string | null;
  status: string | null;
}

const RedeemGift = () => {
  const { code } = useParams<{ code: string }>();
  const [giftData, setGiftData] = useState<GiftCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'claimed' | 'expired' | null>(null);

  useEffect(() => {
    const fetchGift = async () => {
      if (!code) {
        setError('not_found');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('gift_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (fetchError || !data) {
        setError('not_found');
      } else if (data.status === 'claimed') {
        setError('claimed');
      } else if (data.status === 'expired') {
        setError('expired');
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('expired');
      } else {
        setGiftData(data);
      }

      setLoading(false);
    };

    fetchGift();
  }, [code]);

  // Loading state with subtle animation
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center"
          >
            <Gift className="h-6 w-6 text-gold" />
          </motion.div>
          <p className="text-muted-foreground">Unwrapping your gift...</p>
        </motion.div>
      </div>
    );
  }

  // Error states
  if (error) {
    return <InvalidGiftState type={error} />;
  }

  // Valid gift - The Unboxing Experience
  if (giftData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-gold/5 flex items-center justify-center p-4">
        <ConfettiCelebration trigger={true} />
        <GiftCard
          donorName={giftData.donor_name || 'A generous friend'}
          amount={giftData.amount}
          message={giftData.message}
          code={giftData.code}
        />
      </div>
    );
  }

  return null;
};

export default RedeemGift;
