import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface Fundraiser {
  id: string;
  title: string;
  monthly_goal: number;
  amount_raised: number;
}

const ProgressBarOverlay = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [animateProgress, setAnimateProgress] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchFundraiser();
    }
  }, [slug]);

  useEffect(() => {
    if (!fundraiser?.id) return;

    const channel = supabase
      .channel(`overlay-progress-${fundraiser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fundraisers',
        filter: `id=eq.${fundraiser.id}`,
      }, (payload) => {
        const updated = payload.new as Fundraiser;
        setAnimateProgress(true);
        setFundraiser(prev => prev ? { ...prev, amount_raised: updated.amount_raised } : null);
        setTimeout(() => setAnimateProgress(false), 1000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fundraiser?.id]);

  const fetchFundraiser = async () => {
    const { data, error } = await supabase
      .from("fundraisers")
      .select("id, title, monthly_goal, amount_raised")
      .eq("unique_slug", slug)
      .single();

    if (!error && data) {
      setFundraiser(data);
    }
  };

  if (!fundraiser) {
    return <div className="min-h-screen bg-transparent" />;
  }

  const progress = Math.min((fundraiser.amount_raised / fundraiser.monthly_goal) * 100, 100);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div 
        className={`
          bg-[#1a1a2e]/95 backdrop-blur-sm rounded-2xl p-6 min-w-[400px] max-w-[500px]
          border border-white/10 shadow-2xl
          transition-transform duration-300
          ${animateProgress ? 'scale-105' : 'scale-100'}
        `}
      >
        {/* Title */}
        <h2 className="text-white font-semibold text-lg mb-4 truncate">
          {fundraiser.title}
        </h2>

        {/* Progress Bar */}
        <div className="relative h-6 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className={`
              absolute inset-y-0 left-0 rounded-full
              bg-gradient-to-r from-emerald-500 to-emerald-400
              transition-all duration-1000 ease-out
              ${animateProgress ? 'animate-pulse' : ''}
            `}
            style={{ width: `${progress}%` }}
          />
          {/* Shine effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ 
              animation: animateProgress ? 'shimmer 1s ease-out' : 'none',
            }}
          />
        </div>

        {/* Amount Text */}
        <div className="flex justify-between items-center text-sm mb-4">
          <span className={`
            text-emerald-400 font-bold text-lg
            transition-transform duration-300
            ${animateProgress ? 'scale-110' : 'scale-100'}
          `}>
            ${fundraiser.amount_raised.toLocaleString()}
          </span>
          <span className="text-white/60">
            raised of ${fundraiser.monthly_goal.toLocaleString()} goal
          </span>
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-white/10">
          <span className="text-white/40 text-xs">Powered by</span>
          <img src={logo} alt="CouponDonation" className="h-4 opacity-60" />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ProgressBarOverlay;
