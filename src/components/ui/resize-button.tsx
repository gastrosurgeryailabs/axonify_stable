import { useState } from "react";
import { Button } from "./button";
import { Maximize2 } from "lucide-react";
import { ContentResizeModal } from "./content-resize-modal";

interface ResizeButtonProps {
    content: string;
    title: string;
    className?: string;
}

export function ResizeButton({ content, title, className }: ResizeButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className={className}
                onClick={() => setIsModalOpen(true)}
            >
                <Maximize2 className="h-4 w-4" />
            </Button>
            <ContentResizeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                content={content}
                title={title}
            />
        </>
    );
} 