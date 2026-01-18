import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface Fundraiser {
  id: string;
  title: string;
  monthly_goal: number;
  amount_raised: number;
  unique_slug: string;
}

const QRCodeOverlay = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);

  useEffect(() => {
    if (slug) {
      fetchFundraiser();
    }
  }, [slug]);

  useEffect(() => {
    if (!fundraiser?.id) return;

    const channel = supabase
      .channel(`overlay-qr-${fundraiser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fundraisers',
        filter: `id=eq.${fundraiser.id}`,
      }, (payload) => {
        const updated = payload.new as Fundraiser;
        setFundraiser(prev => prev ? { ...prev, amount_raised: updated.amount_raised } : null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fundraiser?.id]);

  const fetchFundraiser = async () => {
    const { data, error } = await supabase
      .from("fundraisers")
      .select("id, title, monthly_goal, amount_raised, unique_slug")
      .eq("unique_slug", slug)
      .single();

    if (!error && data) {
      setFundraiser(data);
    }
  };

  if (!fundraiser) {
    return <div className="min-h-screen bg-transparent" />;
  }

  const fundraiserUrl = `${window.location.origin}/f/${fundraiser.unique_slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fundraiserUrl)}&bgcolor=1a1a2e&color=10b981`;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e]/95 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
        {/* QR Code */}
        <div className="bg-white rounded-2xl p-4 mb-6">
          <img
            src={qrCodeUrl}
            alt="Donation QR Code"
            className="w-64 h-64"
          />
        </div>

        {/* Title */}
        <h2 className="text-white font-semibold text-center text-lg mb-2 max-w-[280px] line-clamp-2">
          {fundraiser.title}
        </h2>

        {/* Progress */}
        <div className="text-center mb-4">
          <span className="text-emerald-400 font-bold text-2xl">
            ${fundraiser.amount_raised.toLocaleString()}
          </span>
          <span className="text-white/60 text-sm ml-2">
            of ${fundraiser.monthly_goal.toLocaleString()}
          </span>
        </div>

        {/* Scan to donate */}
        <p className="text-white/50 text-center text-sm mb-4">
          Scan to donate
        </p>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10">
          <span className="text-white/40 text-xs">Powered by</span>
          <img src={logo} alt="CouponDonation" className="h-4 opacity-60" />
        </div>
      </div>
    </div>
  );
};

export default QRCodeOverlay;
