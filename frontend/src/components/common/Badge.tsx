//////////////////////////////////////////////////////
// 🏷️ BADGE COMPONENT
//////////////////////////////////////////////////////

interface BadgeProps {
  text: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md";
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
};

export default function Badge({ text, variant = "default", size = "sm" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
      size === "sm" ? "text-xs" : "text-sm"
    } ${variantClasses[variant]}`}>
      {text}
    </span>
  );
}
