import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  gameId: string;
  gameType: string;
}

const ShareButton = ({ gameId, gameType }: ShareButtonProps) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const gameUrl = `${window.location.origin}/play/${gameType}/${gameId}`;
      setShareUrl(gameUrl);
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, [gameId, gameType]);

  const message = `Hey! Check out this awesome quiz on Axonify!\n\nTry it out: ${shareUrl}`;
  const encodedMessage = encodeURIComponent(message);

  const whatsappUrl = isMobile ? 
    `whatsapp://send?text=${encodedMessage}` : 
    `https://web.whatsapp.com/send?text=${encodedMessage}`;

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Quiz link has been copied to your clipboard",
      variant: "default",
    });
    setTimeout(() => {
      toast({
        title: "Link Copied!",
        description: "Quiz link has been copied to your clipboard",
        variant: "default",
      });
    }, 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share className="h-4 w-4" />
          Share Quiz
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Quiz</DialogTitle>
          <DialogDescription>
            Share this quiz with your friends!
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            readOnly
            value={shareUrl}
            className="flex-1"
          />
          <Button onClick={copyToClipboard}>
            Copy
          </Button>
        </div>
        <Button
          onClick={() => window.open(whatsappUrl, '_blank')}
          className="w-full mt-2"
        >
          Share on WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareButton; 