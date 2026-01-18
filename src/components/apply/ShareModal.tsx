import { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Facebook, 
  Mail, 
  MessageCircle,
  QrCode,
  Code2,
  Linkedin,
  Radio,
  ChevronLeft,
  Download,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  slug?: string;
  amountRaised?: number;
  goalAmount?: number;
}

export const ShareModal = ({ 
  open, 
  onClose, 
  shareUrl, 
  title,
  slug,
  amountRaised = 0,
  goalAmount = 1000
}: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showLiveTools, setShowLiveTools] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [progressUrlCopied, setProgressUrlCopied] = useState(false);
  const [alertsUrlCopied, setAlertsUrlCopied] = useState(false);
  const { toast } = useToast();

  const baseUrl = window.location.origin;
  const progressOverlayUrl = slug ? `${baseUrl}/overlay/progress/${slug}` : '';
  const alertsOverlayUrl = slug ? `${baseUrl}/overlay/alerts/${slug}` : '';

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

  const handleCopyProgressUrl = async () => {
    await navigator.clipboard.writeText(progressOverlayUrl);
    setProgressUrlCopied(true);
    toast({ title: "Progress bar URL copied!" });
    setTimeout(() => setProgressUrlCopied(false), 2000);
  };

  const handleCopyAlertsUrl = async () => {
    await navigator.clipboard.writeText(alertsOverlayUrl);
    setAlertsUrlCopied(true);
    toast({ title: "Alerts URL copied!" });
    setTimeout(() => setAlertsUrlCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${title.replace(/\s+/g, '-')}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "QR code downloaded!" });
  };

  const progress = Math.min((amountRaised / goalAmount) * 100, 100);

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
    {
      name: "Events & streaming",
      icon: Radio,
      color: "bg-gradient-to-br from-red-500 to-orange-500",
      onClick: () => setShowLiveTools(true),
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

  // Live Tools modal (Events & streaming)
  if (showLiveTools) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setShowLiveTools(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div 
          className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
            <button
              onClick={() => setShowLiveTools(false)}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Live fundraising tools</h3>
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs font-medium rounded-full">
                Beta
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6 overflow-y-auto">
            {/* Unique fundraiser link */}
            <div>
              <h4 className="font-medium text-foreground mb-1">Your unique fundraiser link</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Paste this link in the chat or comments so people can donate
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-secondary/50 rounded-lg px-4 py-3 text-sm text-foreground truncate">
                  {shareUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Overlays section */}
            <div>
              <h4 className="font-medium text-foreground mb-1">Your overlays</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Bring CouponDonation to your next event or livestream with our powerful fundraising tools
              </p>

              <div className="space-y-4">
                {/* Live Progress Bar */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-[#1a1a2e] p-4">
                    {/* Preview widget */}
                    <div className="space-y-2">
                      <p className="text-white text-sm font-medium truncate">{title}</p>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-400 font-semibold">
                          ${amountRaised.toLocaleString()} raised
                        </span>
                        <span className="text-white/60">
                          of ${goalAmount.toLocaleString()} goal
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 pt-2 border-t border-white/10">
                        <span className="text-white/40 text-[10px]">Powered by</span>
                        <img src={logo} alt="CouponDonation" className="h-3 opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-card flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Live progress bar</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyProgressUrl}
                      disabled={!slug}
                    >
                      {progressUrlCopied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Live Donation Alerts */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-[#1a1a2e] p-4 flex items-center justify-center">
                    {/* Preview alert */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl px-5 py-3 flex items-center gap-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
                      <div className="text-white">
                        <span className="text-xl font-bold">$50</span>
                        <span className="ml-1 opacity-90">by John D.</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-card flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Live donation alerts</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyAlertsUrl}
                      disabled={!slug}
                    >
                      {alertsUrlCopied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Donation QR Code */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-[#1a1a2e] p-4 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-2">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code Preview"
                        className="w-20 h-20"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-card flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Donation QR code</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadQR}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-4 p-4 bg-secondary/30 rounded-xl">
                <h5 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  How to use in OBS/Streamlabs
                </h5>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Copy the overlay URL</li>
                  <li>In OBS, add a new "Browser" source</li>
                  <li>Paste the URL and set width to 500px</li>
                  <li>Position the overlay on your stream</li>
                </ol>
              </div>
            </div>
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
            <div className="grid grid-cols-3 gap-3">
              {utilityOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.onClick}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 hover:bg-secondary/50 transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  <div className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white`}>
                    <option.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-foreground text-xs text-center leading-tight">{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
