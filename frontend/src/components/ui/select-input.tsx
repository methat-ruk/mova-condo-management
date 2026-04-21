"use client";

import { type SelectHTMLAttributes } from "react";

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function SelectInput({ hasError, className, children, ...props }: SelectInputProps) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={`border-input bg-background text-foreground focus:ring-ring w-full cursor-pointer appearance-none rounded-lg border py-2 pr-11 pl-3 text-sm focus:ring-2 focus:outline-none ${
          hasError ? "border-destructive focus:ring-destructive/30" : ""
        } ${className ?? ""}`}
      >
        {children}
      </select>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
