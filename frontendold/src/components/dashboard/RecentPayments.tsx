import { format } from "date-fns";

const safeFormatDate = (date: any) => {
  if (!date) return "N/A";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "Invalid";

  return format(d, "dd MMM yyyy");
};

type Payment = {
  paidAmount: number;
  createdAt: string | Date;
  student?: {
    name?: string;
  };
};

type Props = {
  data: Payment[];
};

export default function RecentPayments({ data }: Props) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg overflow-hidden">

      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Recent Payments
        </h3>
        <p className="text-sm text-gray-400">
          Latest fee transactions
        </p>
      </div>

      {/* LIST */}
      {data && data.length > 0 ? (
        <div className="space-y-4">

          {data.map((p, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b pb-3 last:border-none"
            >
              {/* LEFT */}
              <div>
                <p className="font-medium text-gray-700">
                  {p.student?.name || "Unknown"}
                </p>

                {/* 🔥 FIX: safeFormatDate use karo */}
                <p className="text-xs text-gray-400">
                  {safeFormatDate(p.createdAt)}
                </p>
              </div>

              {/* RIGHT */}
              <div className="text-green-600 font-semibold">
                ₹ {p.paidAmount ?? 0}
              </div>
            </div>
          ))}

        </div>
      ) : (
        <p className="text-gray-400">No recent payments</p>
      )}
    </div>
  );
}