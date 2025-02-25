import { TextareaHTMLAttributes } from "react";
import { Textarea } from "./textarea";
import { CopyButton } from "./copy-button";
import { ResizeButton } from "./resize-button";

interface TextareaWithActionsProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    title: string;
}

export function TextareaWithActions({ value, title, className, ...props }: TextareaWithActionsProps) {
    return (
        <div className="relative">
            <Textarea
                value={value}
                className={className}
                {...props}
            />
            <div className="absolute top-2 right-2 flex gap-1">
                <ResizeButton 
                    content={value} 
                    title={title}
                />
                <CopyButton text={value} />
            </div>
        </div>
    );
} 