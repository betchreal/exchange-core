import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`w-full rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
