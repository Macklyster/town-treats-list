import { ReactNode } from "react";
import { LucideIcon, Inbox } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({ icon: Icon = Inbox, title, description, action, className = "" }: Props) => (
  <div
    className={`flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center ${className}`}
  >
    <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-light text-primary">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mt-4 font-display text-lg font-medium text-foreground">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
