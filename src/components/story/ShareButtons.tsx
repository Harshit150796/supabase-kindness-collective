import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Share2, 
  Link2, 
  Twitter, 
  Facebook,
  Mail,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareButtonsProps {
  title: string;
  url?: string;
  compact?: boolean;
}

export function ShareButtons({ title, url, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=Check out this story: ${shareUrl}`,
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy link'}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <Twitter className="w-4 h-4 mr-2" />
              Share on X
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <Facebook className="w-4 h-4 mr-2" />
              Share on Facebook
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={shareLinks.email} className="cursor-pointer">
              <Mail className="w-4 h-4 mr-2" />
              Share via Email
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button 
        variant="outline" 
        className="w-full gap-2 justify-start"
        onClick={copyToClipboard}
      >
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy link'}
      </Button>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon"
          className="flex-1"
          asChild
        >
          <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
            <Twitter className="w-4 h-4" />
          </a>
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          className="flex-1"
          asChild
        >
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
            <Facebook className="w-4 h-4" />
          </a>
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          className="flex-1"
          asChild
        >
          <a href={shareLinks.email}>
            <Mail className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
