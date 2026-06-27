import { ReactNode } from "react";
import { HiInbox } from "react-icons/hi";

//////////////////////////////////////////////////////
// 📭 EMPTY STATE COMPONENT
//////////////////////////////////////////////////////

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-gray-300 mb-4">
        {icon || <HiInbox className="w-16 h-16" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
