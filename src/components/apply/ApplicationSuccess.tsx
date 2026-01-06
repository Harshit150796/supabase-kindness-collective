import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Mail, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApplicationSuccessProps {
  email: string;
  applicationType: 'coupons' | 'fundraiser';
}

export function ApplicationSuccess({ email, applicationType }: ApplicationSuccessProps) {
  const navigate = useNavigate();

  return (
    <div className="text-center py-8">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        >
          <CheckCircle className="w-12 h-12 text-primary" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Application Received!
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Thank you for sharing your story with us. Our team will review your application carefully.
        </p>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-muted/30 rounded-2xl p-6 max-w-lg mx-auto mb-8"
      >
        <h3 className="font-semibold text-foreground mb-4">What happens next?</h3>
        
        <div className="space-y-4 text-left">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Review Period</p>
              <p className="text-sm text-muted-foreground">
                We'll review your application within 2-3 business days.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Email Notification</p>
              <p className="text-sm text-muted-foreground">
                You'll receive an update at <strong>{email}</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {applicationType === 'fundraiser' ? 'Campaign Goes Live' : 'Start Receiving Coupons'}
              </p>
              <p className="text-sm text-muted-foreground">
                {applicationType === 'fundraiser'
                  ? 'Once approved, your fundraising campaign will be visible to donors.'
                  : 'Once approved, you can access coupons from our partner brands.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-4"
      >
        <Button
          size="lg"
          onClick={() => navigate('/stories')}
          className="gap-2"
        >
          Browse Impact Stories
          <ArrowRight className="w-5 h-5" />
        </Button>

        <p className="text-sm text-muted-foreground">
          Questions? Contact us at{' '}
          <a href="mailto:support@coupondonation.com" className="text-primary hover:underline">
            support@coupondonation.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}
