import { Gift, Sparkles, Heart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface GiftCardProps {
  donorName: string;
  amount: number;
  message?: string | null;
  code: string;
}

export const GiftCard = ({ donorName, amount, message, code }: GiftCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="max-w-md w-full mx-auto border-2 border-gold/50 shadow-2xl bg-gradient-to-b from-card to-gold/5 relative overflow-hidden">
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-gold/20 to-transparent rounded-br-full" />
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-gold/20 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-full" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-primary/10 to-transparent rounded-tl-full" />
        
        {/* Sparkle icon */}
        <div className="absolute top-4 right-4">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-6 w-6 text-gold" />
          </motion.div>
        </div>

        <CardHeader className="text-center pt-10 pb-2 relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center shadow-lg"
          >
            <Gift className="h-8 w-8 text-background" />
          </motion.div>
          
          <p className="text-muted-foreground text-lg">
            <span className="font-semibold text-foreground">{donorName}</span> has sent you
          </p>
        </CardHeader>

        <CardContent className="text-center relative z-10 pt-0">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
            className="my-4"
          >
            <span className="text-7xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ${amount.toFixed(2)}
            </span>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl font-medium text-foreground mb-6"
          >
            to change the world!
          </motion.p>

          {message && (
            <motion.blockquote
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="italic border-l-4 border-gold pl-4 py-2 my-6 text-left bg-muted/30 rounded-r-lg"
            >
              <p className="text-muted-foreground">"{message}"</p>
            </motion.blockquote>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground text-sm mb-8"
          >
            Your gift helps families access essential groceries.<br />
            <span className="font-medium text-foreground">You choose how it makes an impact.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Button 
              size="lg" 
              className="w-full text-lg h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              onClick={() => navigate(`/stories?gift=${code}`)}
            >
              <Heart className="mr-2 h-5 w-5" />
              Choose Where It Goes
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="w-full"
              onClick={() => navigate('/stories')}
            >
              See Impact Stories
            </Button>
          </motion.div>
        </CardContent>

        <CardFooter className="justify-center border-t border-border/50 pt-4 pb-6 relative z-10">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="font-semibold text-primary">CouponDonation</span> 
            <span>•</span> 
            <span>100% goes to families</span>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
