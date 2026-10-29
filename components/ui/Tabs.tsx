"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem<T extends string> = {
  id: T;
  label: string;
};

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 overflow-x-auto rounded-pill bg-surface p-1", className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "h-9 shrink-0 rounded-pill px-4 text-sm font-medium transition-colors duration-fast ease-soft",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link/30",
              selected ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
              tabs.length <= 4 && "flex-1",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
  className,
}: {
  id: string;
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (!active) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={id}
      className={cn("animate-fade", className)}
    >
      {children}
    </div>
  );
}
