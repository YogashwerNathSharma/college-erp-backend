import { useNavigate } from "react-router-dom";

type Props = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  growth?: string;
  link?: string; // 🔥 NEW — click karne par kahan jaaye
};

export default function StatsCard({
  title,
  value,
  icon,
  color,
  growth,
  link,
}: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => link && navigate(link)}
      className={`p-4 rounded-xl text-white bg-gradient-to-r ${color} shadow-md 
        ${link ? "cursor-pointer hover:scale-[1.03] hover:shadow-lg transition-all duration-200" : ""}`}
    >
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium opacity-80">{title}</p>
        <span className="opacity-70">{icon}</span>
      </div>

      <h2 className="text-xl font-bold mt-2">{value ?? 0}</h2>

      {growth && (
        <p className="text-[10px] mt-1 opacity-75">
          Growth: {growth}
        </p>
      )}
    </div>
  );
}