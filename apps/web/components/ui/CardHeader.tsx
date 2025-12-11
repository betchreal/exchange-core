import { ReactNode } from "react";

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}
