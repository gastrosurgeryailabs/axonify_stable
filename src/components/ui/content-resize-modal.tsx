import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./dialog";
import { Textarea } from "./textarea";
import { CopyButton } from "./copy-button";

interface ContentResizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    title: string;
}

export function ContentResizeModal({
    isOpen,
    onClose,
    content,
    title,
}: ContentResizeModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[800px] w-[90vw]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{title}</DialogTitle>
                        <CopyButton text={content} className="mr-2" />
                    </div>
                </DialogHeader>
                <div className="mt-4">
                    <Textarea
                        value={content}
                        readOnly
                        className="min-h-[400px] resize-none"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
} 