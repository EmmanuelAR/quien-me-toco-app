import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "blue" | "pink" | "neutral" | "ink";

const tones: Record<Tone, string> = {
  blue: "bg-marker-blue-soft text-ink",
  pink: "bg-marker-pink-soft text-ink",
  neutral: "bg-surface text-ink-soft border border-line",
  ink: "bg-ink text-white",
};

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Pill({ tone = "neutral", dot = false, className, children, ...rest }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-medium leading-5 tabular",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-pill",
            tone === "blue" && "bg-marker-blue",
            tone === "pink" && "bg-marker-pink",
            tone === "neutral" && "bg-ink-soft",
            tone === "ink" && "bg-white",
          )}
        />
      )}
      {children}
    </span>
  );
}
