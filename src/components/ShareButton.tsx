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

type ShareButtonProps = {
  topic: string;
  gameId: string;
};

export function ShareButton({ topic, gameId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [currentShareLink, setCurrentShareLink] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentShareLink(`${window.location.origin}/quiz?topic=${encodeURIComponent(topic)}`);
    }
  }, [topic]);

  const copyToClipboard = () => {
    if (!currentShareLink) return;
    navigator.clipboard.writeText(currentShareLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Quiz link has been copied to your clipboard",
      variant: "default",
    });
    setTimeout(() => setCopied(false), 2000);
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
            value={currentShareLink}
            className="flex-1"
          />
          <Button onClick={copyToClipboard}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 