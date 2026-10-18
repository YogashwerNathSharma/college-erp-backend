type Props = {
  data: {
    growth?: string;
    message?: string;
  };
};

export default function Insights({ data }: Props) {
  return (
    <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">

      {/* HEADER */}
      <div className="mb-2">
        <h3 className="text-lg font-semibold">
          Insights
        </h3>
      </div>

      {/* GROWTH */}
      <div className="text-3xl font-bold">
        {data?.growth || "0%"}
      </div>

      {/* MESSAGE */}
      <p className="text-sm opacity-90 mt-2">
        {data?.message || "No insights available"}
      </p>
    </div>
  );
}