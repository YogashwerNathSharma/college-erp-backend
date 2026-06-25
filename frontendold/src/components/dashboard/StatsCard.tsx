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
      className={`p-3 sm:p-4 rounded-xl text-white bg-gradient-to-r ${color} shadow-md overflow-hidden cursor-pointer hover:scale-[1.03] hover:shadow-lg transition-all duration-200 h-[90px] sm:h-[100px] flex flex-col justify-between`}
    >
      <div className="flex justify-between items-start">
        <p className="text-xs font-medium opacity-80 truncate">{title}</p>
        <span className="opacity-70">{icon}</span>
      </div>

      <h2 className="text-lg sm:text-xl font-bold truncate">{value ?? 0}</h2>

      {growth && (
        <p className="text-[10px] opacity-75">
          Growth: {growth}
        </p>
      )}
    </div>
  );
}