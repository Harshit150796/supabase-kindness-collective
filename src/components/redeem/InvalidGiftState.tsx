import { Gift, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface InvalidGiftStateProps {
  type: 'not_found' | 'claimed' | 'expired';
}

export const InvalidGiftState = ({ type }: InvalidGiftStateProps) => {
  const navigate = useNavigate();

  const content = {
    not_found: {
      icon: AlertCircle,
      title: "Gift Code Not Found",
      description: "We couldn't find a gift with this code. Please check the link and try again.",
      iconColor: "text-destructive"
    },
    claimed: {
      icon: CheckCircle2,
      title: "Gift Already Claimed",
      description: "This gift has already been claimed and put to good use. The generosity lives on!",
      iconColor: "text-primary"
    },
    expired: {
      icon: Gift,
      title: "Gift Has Expired",
      description: "Unfortunately, this gift code has expired. But there are still ways to make an impact!",
      iconColor: "text-muted-foreground"
    }
  };

  const { icon: Icon, title, description, iconColor } = content[type];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pt-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <p className="text-muted-foreground">{description}</p>
          
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => navigate('/stories')}
            >
              Browse Impact Stories
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Make a Donation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
