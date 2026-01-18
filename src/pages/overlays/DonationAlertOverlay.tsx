import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  amount: number;
  donor_email: string | null;
  is_anonymous: boolean;
  message: string | null;
}

interface QueuedAlert {
  id: string;
  amount: number;
  donorName: string;
  message: string | null;
}

const DonationAlertOverlay = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fundraiserId, setFundraiserId] = useState<string | null>(null);
  const [alertQueue, setAlertQueue] = useState<QueuedAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<QueuedAlert | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchFundraiserId();
    }
  }, [slug]);

  const fetchFundraiserId = async () => {
    const { data, error } = await supabase
      .from("fundraisers")
      .select("id")
      .eq("unique_slug", slug)
      .single();

    if (!error && data) {
      setFundraiserId(data.id);
    }
  };

  // Process alert queue
  const processQueue = useCallback(() => {
    if (alertQueue.length > 0 && !currentAlert) {
      const [next, ...rest] = alertQueue;
      setCurrentAlert(next);
      setAlertQueue(rest);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentAlert(null);
        }, 500); // Wait for fade out animation
      }, 5000);
    }
  }, [alertQueue, currentAlert]);

  useEffect(() => {
    processQueue();
  }, [processQueue]);

  // Listen for new donations
  useEffect(() => {
    if (!fundraiserId) return;

    const channel = supabase
      .channel(`overlay-alerts-${fundraiserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `fundraiser_id=eq.${fundraiserId}`,
      }, (payload) => {
        const donation = payload.new as Donation;
        const donorName = donation.is_anonymous 
          ? "Anonymous" 
          : (donation.donor_email?.split("@")[0] || "Someone");
        
        setAlertQueue(prev => [...prev, {
          id: donation.id,
          amount: donation.amount,
          donorName,
          message: donation.message,
        }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fundraiserId]);

  return (
    <div className="min-h-screen bg-transparent flex items-start justify-center pt-8">
      <div 
        className={`
          transition-all duration-500 ease-out
          ${isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-4 scale-95'
          }
        `}
      >
        {currentAlert && (
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full" />
            
            {/* Alert card */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl px-8 py-5 shadow-2xl">
              <div className="flex items-center gap-4">
                {/* Heart icon with pulse */}
                <div className="relative">
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                  <div className="relative bg-white/20 rounded-full p-3">
                    <Heart className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
                
                {/* Donation info */}
                <div className="text-white">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      ${currentAlert.amount.toLocaleString()}
                    </span>
                    <span className="text-xl opacity-90">
                      by {currentAlert.donorName}
                    </span>
                  </div>
                  {currentAlert.message && (
                    <p className="mt-1 text-white/80 text-sm max-w-xs truncate">
                      "{currentAlert.message}"
                    </p>
                  )}
                </div>
              </div>
              
              {/* Sparkle effects */}
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
              <div className="absolute -bottom-1 -left-1 text-xl animate-bounce delay-100">💚</div>
            </div>
          </div>
        )}
      </div>

      {/* Demo mode indicator - only shows when no real alerts */}
      {!currentAlert && !isVisible && (
        <div className="text-white/30 text-sm">
          Waiting for donations...
        </div>
      )}
    </div>
  );
};

export default DonationAlertOverlay;
