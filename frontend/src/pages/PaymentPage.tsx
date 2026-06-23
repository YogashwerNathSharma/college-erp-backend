import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import { apiFetch } from "../lib/api";
import logo from "../assets/logo.png";
export default function PaymentPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    studentName: "",
    className: "",
    email: "",
    mobile: "",
    address: "",
    amount: "",
    paymentMethod: "upi",
    referenceNumber: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (
      !form.studentName ||
      !form.className ||
      !form.email ||
      !form.mobile ||
      !form.address ||
      !form.amount
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await apiFetch<{ receiptNumber: string }>("/payments", {
        method: "POST",
        body: JSON.stringify(form),
      });

      alert("Payment Saved ✅");

      navigate(`/receipt/${res.receiptNumber}`);
    } catch (err) {
      alert("Error submitting payment");
    }
  };

  return (

  <div className="max-w-7xl mx-auto mb-10">

  {/* TOP SECTION */}
  <div className="flex items-center justify-between border-b pb-4">

    {/* LEFT → LOGO + SCHOOL */}
    <div className="flex items-center gap-4">

      <img
        src={logo}
        alt="School Logo"
        className="h-20 md:h-24 object-contain drop-shadow"
      />

      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-wide">
          RMS Academy
        </h1>

        <p className="text-gray-500 text-sm md:text-base mt-1">
          Divna Road Parora Meerganj, Bareilly
        </p>
      </div>
    </div>

    {/* RIGHT → DATE CARD */}
    <div className="bg-gray-100 px-4 py-2 rounded-lg text-right shadow-sm">
      <p className="text-sm text-gray-700 font-medium">
        {new Date().toLocaleDateString("en-IN")}
      </p>
      <p className="text-xs text-gray-500">
        {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
      </p>
    </div>

  </div>

  {/* CENTER TITLE */}
  <div className="text-center mt-6">
    <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
      School Fee Payment
    </h2>

    <p className="text-gray-500 text-sm mt-1">
      Secure payment with instant receipt generation
    </p>
  </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* LEFT → PAYMENT INFO */}
        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-semibold mb-3">UPI Payment</h2>
          <p>UPI ID: <b>school@upi</b></p>

          <div className="mt-4">
            <img
              src="/qr.png"
              className="w-48 border rounded"
            />
          </div>

          <h2 className="font-semibold mt-6 mb-3">Bank Details</h2>
          <p>Account: 1234567890</p>
          <p>IFSC: SBIN0001234</p>

        </div>

        {/* RIGHT → FORM */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">

          <input
            placeholder="Student Name"
            className="w-full border p-2 rounded"
            value={form.studentName}
            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
          />

          <input
            placeholder="Class"
            className="w-full border p-2 rounded"
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
          />

          <input
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            placeholder="Mobile"
            className="w-full border p-2 rounded"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />

          <textarea
            placeholder="Address"
            className="w-full border p-2 rounded"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <input
            type="number"
            placeholder="Amount"
            className="w-full border p-2 rounded"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <select
            className="w-full border p-2 rounded"
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
          >
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank</option>
            <option value="cash">Cash</option>
          </select>

          <input
            placeholder="Reference Number"
            className="w-full border p-2 rounded"
            value={form.referenceNumber}
            onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
          />

          <button className="w-full bg-green-600 text-white py-3 rounded-lg">
            Submit & Generate Receipt
          </button>

        </form>
      </div>
    </div>
  );
}