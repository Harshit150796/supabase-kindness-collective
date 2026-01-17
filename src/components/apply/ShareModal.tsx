import { useState } from "react";
import { X, Copy, Check, Facebook, Mail, MessageCircle, Linkedin, QrCode, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
}

export const ShareModal = ({ open, onClose, shareUrl, title }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const { toast } = useToast();

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share it with friends and family",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const embedCode = `<iframe src="${shareUrl}?embed=true" width="350" height="420" frameborder="0" scrolling="no"></iframe>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
      toast({
        title: "Embed code copied!",
        description: "Paste it into your website",
      });
    } catch (err) {
      console.error("Failed to copy embed:", err);
    }
  };

  // Generate QR code URL using a free QR code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

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
      name: "Messenger",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.13.26.35.27.57l.05 1.78c.02.57.61.94 1.13.71l1.98-.87c.17-.07.36-.09.53-.05.86.23 1.82.35 2.9.35 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm5.89 7.58l-2.89 4.58c-.46.73-1.46.91-2.14.39l-2.3-1.72a.54.54 0 00-.65 0l-3.1 2.36c-.41.31-.96-.18-.68-.61l2.89-4.58c.46-.73 1.46-.91 2.14-.39l2.3 1.72c.2.15.46.15.65 0l3.1-2.36c.41-.31.96.18.68.61z" />
        </svg>
      ),
      color: "bg-gradient-to-br from-[#00B2FF] to-[#006AFF]",
      onClick: () => window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=966242223397117&redirect_uri=${encodeURIComponent(window.location.origin)}`, "_blank"),
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-[#0A66C2]",
      onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank"),
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
    {
      name: "Email",
      icon: Mail,
      color: "bg-muted-foreground",
      onClick: () => window.open(`mailto:?subject=${encodeURIComponent(`Support: ${title}`)}&body=${encodeURIComponent(`I wanted to share this fundraiser with you:\n\n${title}\n\n${shareUrl}\n\nEvery donation makes a difference!`)}`, "_blank"),
    },
  ];

  const utilityOptions = [
    {
      name: "QR Code",
      icon: QrCode,
      color: "bg-gradient-to-br from-violet-500 to-purple-600",
      onClick: () => setShowQR(true),
    },
    {
      name: "Website Widget",
      icon: Code2,
      color: "bg-gradient-to-br from-slate-600 to-slate-800",
      onClick: () => setShowEmbed(true),
    },
  ];

  // QR Code modal
  if (showQR) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setShowQR(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div 
          className="relative w-full max-w-sm bg-background rounded-2xl shadow-2xl animate-scale-in overflow-hidden p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowQR(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Scan to donate</h3>
            <p className="text-sm text-muted-foreground mb-6">Point your camera at the QR code</p>
            
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-48 h-48"
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Or share the link directly
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Embed code modal
  if (showEmbed) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setShowEmbed(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div 
          className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl animate-scale-in overflow-hidden p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowEmbed(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Embed on your website</h3>
            <p className="text-sm text-muted-foreground mb-4">Copy and paste this code into your website</p>
            
            <div className="bg-secondary/50 rounded-xl p-4 mb-4">
              <code className="text-xs text-muted-foreground break-all">
                {embedCode}
              </code>
            </div>
            
            <button
              onClick={handleCopyEmbed}
              className={`
                w-full py-3 rounded-xl font-medium transition-all duration-200
                flex items-center justify-center gap-2
                ${embedCopied 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
                }
              `}
            >
              {embedCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy embed code
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="grid grid-cols-3 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.onClick}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 hover:bg-secondary/50 transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                    <option.icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-foreground text-xs">{option.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Utility options */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">More ways to share</p>
            <div className="grid grid-cols-2 gap-3">
              {utilityOptions.map((option) => (
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
