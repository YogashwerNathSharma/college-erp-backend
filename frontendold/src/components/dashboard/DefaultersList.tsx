type Defaulter = {
  pendingAmount: number;
  student: {
    name: string;
  };
};

type Props = {
  data: Defaulter[];
};

export default function DefaultersList({ data }: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">

      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Top Defaulters
        </h3>
        <p className="text-sm text-gray-400">
          Students with pending fees
        </p>
      </div>

      {/* LIST */}
      {data && data.length > 0 ? (
        <div className="space-y-4">

          {data.map((d, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b pb-3 last:border-none"
            >
              {/* LEFT */}
              <div>
                <p className="font-medium text-gray-700">
                  {d.student?.name}
                </p>
                <p className="text-xs text-gray-400">
                  Pending fees
                </p>
              </div>

              {/* RIGHT */}
              <div className="text-red-600 font-semibold">
                ₹ {d.pendingAmount}
              </div>
            </div>
          ))}

        </div>
      ) : (
        <p className="text-gray-400">No defaulters 🎉</p>
      )}
    </div>
  );
}