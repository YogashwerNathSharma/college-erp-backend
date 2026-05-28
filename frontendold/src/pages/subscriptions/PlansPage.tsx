import { useEffect, useState } from "react";
import axios from "axios";

interface Plan {
  id: string;
  name: string;
  price: number;
  maxStudents: number;
  maxTeachers: number;
  features: string[];
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/subscription-plans"
      );

      setPlans(res.data);
    } catch (error) {
      console.error("Error fetching plans", error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const createPlan = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/subscription-plans",
        {
          name: "Basic Plan",
          price: 999,
          maxStudents: 500,
          maxTeachers: 20,
          features: ["Attendance", "Fees", "Results"],
        }
      );

      fetchPlans();
    } catch (error) {
      console.error("Error creating plan", error);
    }
  };

  return (
    <div className="p-6">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Subscription Plans
        </h1>

        <button
          onClick={createPlan}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
        >
          Create Plan
        </button>
      </div>

      {/* LIST */}
      <div className="grid md:grid-cols-3 gap-6">

        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-3xl shadow p-6"
          >
            <h2 className="text-2xl font-bold mb-2">
              {plan.name}
            </h2>

            <p className="text-4xl font-bold text-indigo-600 mb-4">
              ₹{plan.price}
            </p>

            <div className="space-y-2 text-sm text-slate-600">
              <p>
                Students: {plan.maxStudents}
              </p>

              <p>
                Teachers: {plan.maxTeachers}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {plan.features?.map(
                (f: string, i: number) => (
                  <span
                    key={i}
                    className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs"
                  >
                    {f}
                  </span>
                )
              )}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}