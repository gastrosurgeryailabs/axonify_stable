import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeDelta(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - hours * 3600)/60)
  const secs = Math.floor(seconds - hours * 3600 - minutes * 60)
  const parts = [];
  if(hours > 0){
    parts.push(`${hours}h`);
  }
  if(minutes > 0){
    parts.push(`${minutes}m`);
  }
  if(secs > 0){
    parts.push(`${secs}s`);
  }
  return parts.join(" ");
}

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // browser should use relative path
    return '';
  }

  if (process.env.VERCEL_URL) {
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    // reference for custom domain
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getQuizUrl = (type: string, gameId: string) => {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}/play/${type}/${gameId}`;
};