import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Props = {
  data: {
    month: string;
    fees: number;
  }[];
};

export default function RevenueChart({ data }: Props) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg overflow-hidden">

      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Revenue Overview
        </h3>
        <p className="text-sm text-gray-400">
          Monthly fee collection
        </p>
      </div>

      {/* CHART */}
      {data && data.length > 0 ? (
        <div className="w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height={300} minWidth={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />
            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="fees"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-400">No data available</p>
      )}
    </div>
  );
}