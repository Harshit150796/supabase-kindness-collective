import { Megaphone } from "lucide-react";

interface ShareScreenProps {
  onShare: () => void;
  onSkip: () => void;
}

export const ShareScreen = ({ onShare, onSkip }: ShareScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary p-6 animate-fade-in">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Icon */}
        <div 
          className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-8 animate-scale-in"
        >
          <Megaphone className="w-10 h-10 text-white" />
        </div>

        {/* Heading */}
        <h1 
          className="text-3xl lg:text-4xl font-bold text-white mb-4 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Your coupon request is ready to share.
        </h1>

        {/* Subtitle */}
        <p 
          className="text-white/80 text-lg mb-10 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Share with friends and family to increase your chances of receiving support.
        </p>

        {/* Buttons */}
        <div 
          className="flex flex-col gap-3 w-full max-w-xs animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <button
            onClick={onShare}
            className="w-full py-4 px-6 bg-gold text-charcoal font-semibold rounded-full hover:bg-gold/90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg press-effect"
          >
            Share request
          </button>
          
          <button
            onClick={onSkip}
            className="w-full py-4 px-6 bg-transparent text-white font-medium rounded-full border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-200"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
