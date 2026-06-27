import { ReactNode } from "react";

//////////////////////////////////////////////////////
// 🃏 CARD COMPONENT
//////////////////////////////////////////////////////

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, title, subtitle, action, className = "", padding = true }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding ? "px-6 py-4" : ""}>{children}</div>
    </div>
  );
}
