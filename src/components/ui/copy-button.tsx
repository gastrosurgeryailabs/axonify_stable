import { Button } from "./button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
    text: string;
    className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: "Text has been copied to clipboard",
                variant: "default",
            });
        } catch (error) {
            toast({
                title: "Failed to copy",
                description: "Could not copy text to clipboard",
                variant: "destructive",
            });
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className={className}
            onClick={handleCopy}
        >
            <Copy className="h-4 w-4" />
        </Button>
    );
} 