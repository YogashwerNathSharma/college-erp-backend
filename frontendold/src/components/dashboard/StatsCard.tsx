type Props = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  growth?: string;
};

export default function StatsCard({
  title,
  value,
  icon,
  color,
  growth,
}: Props) {
  return (
    <div className={`p-5 rounded-2xl text-white bg-gradient-to-r ${color} shadow-lg`}>
      <div className="flex justify-between items-center">
        <p className="opacity-80">{title}</p>
        {icon}
      </div>

      <h2 className="text-2xl font-bold mt-3">{value ?? 0}</h2>

      {growth && (
        <p className="text-xs mt-2 opacity-80">
          Growth: {growth}
        </p>
      )}
    </div>
  );
}