import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const Footer = () => {
  return (
    <footer className="w-full border-t border-zinc-300 py-4 bg-background mt-auto">
      <div className="container max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <a href="https://axoncare.io/" target="_blank" rel="noopener noreferrer" className="flex items-center">
              <div className="relative w-[72px] h-[24px] -mr-[2px]">
                <Image
                  src="/logo.png"
                  alt="AxonCare Logo"
                  fill
                  sizes="72px"
                  className="object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-base font-semibold text-blue-900 dark:text-blue-700">AxonCare</span>
            </a>
          </div>

          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="gap-2">
              <Mail className="h-4 w-4" />
              <a
                href="mailto:info@axoncare.com"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                info@axoncare.com
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 