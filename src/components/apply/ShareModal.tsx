import { useState } from "react";
import { X, Copy, Check, Facebook, Mail, MessageCircle } from "lucide-react";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
}

export const ShareModal = ({ open, onClose, shareUrl, title }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2]",
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank"),
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366]",
      onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`, "_blank"),
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-muted-foreground",
      onClick: () => window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out my coupon request: ${shareUrl}`)}`, "_blank"),
    },
    {
      name: "X",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "bg-black",
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, "_blank"),
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="text-xl font-bold text-foreground">Quick share</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Copy link section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your unique link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl border border-border/60 bg-secondary/30 text-foreground text-sm truncate"
              />
              <button
                onClick={handleCopy}
                className={`
                  px-4 py-3 rounded-xl font-medium transition-all duration-200
                  flex items-center gap-2
                  ${copied 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }
                `}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social share buttons */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Reach more donors by sharing</p>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.onClick}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-secondary/50 transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  <div className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white`}>
                    <option.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-foreground text-sm">{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
