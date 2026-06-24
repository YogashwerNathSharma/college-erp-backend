import { useEffect, useState } from "react";

import axios from "axios";

import CreatePlanModal from "./CreatePlanModal";

//////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////

interface Plan {

  id: string;

  name: string;

  slug: string;

  description?: string;

  price: number;

  durationInDays: number;

  currency: string;

  maxStudents: number;

  maxTeachers: number;

  maxAdmins: number;

  maxStorageInGB: number;

  features: string[];

  isTrial: boolean;

  isPopular: boolean;

  isActive: boolean;

}

interface Tenant {

  id: string;

  name: string;

}

export default function SubscriptionsPage() {

  //////////////////////////////////////////////////////
  // STATES
  //////////////////////////////////////////////////////

  const [plans, setPlans] =
    useState<Plan[]>([]);

  const [tenants, setTenants] =
    useState<Tenant[]>([]);

  const [selectedTenant, setSelectedTenant] =
    useState<Record<string, string>>({});

  const [loading, setLoading] =
    useState(false);

  const [openModal, setOpenModal] =
    useState(false);

  const [editingPlan, setEditingPlan] =
    useState<Plan | null>(null);

  //////////////////////////////////////////////////////
  // FETCH PLANS
  //////////////////////////////////////////////////////

  const fetchPlans = async () => {

    try {

      setLoading(true);

      const token =
        localStorage.getItem("token");

      const response =
        await axios.get(

          "/api/subscriptions/plans",

          {

            headers: {

              Authorization:
                `Bearer ${token}`,

            },

          }

        );

      setPlans(
        response.data.data || []
      );

    } catch (error) {

      console.error(
        "Fetch plans error",
        error
      );

    } finally {

      setLoading(false);

    }

  };

  //////////////////////////////////////////////////////
  // FETCH TENANTS
  //////////////////////////////////////////////////////

  const fetchTenants = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const res =
        await axios.get(

          "/api/tenant",

          {

            headers: {

              Authorization:
                `Bearer ${token}`,

            },

          }

        );

      console.log(
        "TENANTS => ",
        res.data
      );

      setTenants(
        res.data.data || []
      );

    } catch (error) {

      console.log(
        "Fetch tenants error",
        error
      );

    }

  };

  //////////////////////////////////////////////////////
  // LOAD PAGE
  //////////////////////////////////////////////////////

  useEffect(() => {

    fetchPlans();

    fetchTenants();

  }, []);

  //////////////////////////////////////////////////////
  // DELETE PLAN
  //////////////////////////////////////////////////////

  const handleDelete = async (
    id: string
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      await axios.delete(

        `/api/subscriptions/plans/${id}`,

        {

          headers: {

            Authorization:
              `Bearer ${token}`,

          },

        }

      );

      fetchPlans();

    } catch (error) {

      console.error(
        "Delete error",
        error
      );

    }

  };

  //////////////////////////////////////////////////////
  // ASSIGN PLAN + PAYMENT
  //////////////////////////////////////////////////////

  const assignPlan = async (
    planId: string
  ) => {

    try {

      //////////////////////////////////////////////////
      // SELECT TENANT
      //////////////////////////////////////////////////

      const tenantId =
        selectedTenant[planId];

      if (!tenantId) {

        alert(
          "Please select tenant"
        );

        return;

      }

      //////////////////////////////////////////////////
      // TOKEN
      //////////////////////////////////////////////////

      const token =
        localStorage.getItem("token");

      //////////////////////////////////////////////////
      // ASSIGN SUBSCRIPTION
      //////////////////////////////////////////////////

      const subscriptionResponse =
        await axios.post(

          "/api/subscriptions/assign",

          {

            tenantId,

            planId,

          },

          {

            headers: {

              Authorization:
                `Bearer ${token}`,

            },

          }

        );

      const subscription =
        subscriptionResponse.data.data;

      console.log(
        "SUBSCRIPTION => ",
        subscription
      );

      //////////////////////////////////////////////////
      // CREATE ORDER
      //////////////////////////////////////////////////

      const orderResponse =
        await axios.post(

          "/api/subscription-payments/create-order",

          {

            subscriptionId:
              subscription.id,

          },

          {

            headers: {

              Authorization:
                `Bearer ${token}`,

            },

          }

        );

      const order =
        orderResponse.data.data;

      console.log(
        "ORDER => ",
        order
      );

      //////////////////////////////////////////////////
      // RAZORPAY OPTIONS
      //////////////////////////////////////////////////

      const options = {

        key:
          import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SufLEYxZg1RUP2",

        amount:
          order.amount,

        currency:
          order.currency,

        name:
          "College ERP",

        description:
          subscription.subscriptionCode,

        order_id:
          order.id,

        //////////////////////////////////////////////////
        // ENABLE ALL METHODS
        //////////////////////////////////////////////////

        method: {

          upi: true,

          card: true,

          netbanking: true,

          wallet: true,

          emi: true,

          paylater: true,

        },

        //////////////////////////////////////////////////
        // RETRY
        //////////////////////////////////////////////////

        retry: {

          enabled: false,

        },

        //////////////////////////////////////////////////
        // PREFILL
        //////////////////////////////////////////////////

        prefill: {

          name:
            "Test User",

          email:
            "test@test.com",

          contact:
            "9999999999",

        },

        //////////////////////////////////////////////////
        // NOTES
        //////////////////////////////////////////////////

        notes: {

          subscriptionId:
            subscription.id,

        },

        //////////////////////////////////////////////////
        // THEME
        //////////////////////////////////////////////////

        theme: {

          color:
            "#4f46e5",

        },

        //////////////////////////////////////////////////
        // SUCCESS HANDLER
        //////////////////////////////////////////////////

        handler:
          async function (
            response: any
          ) {

            try {

              console.log(
                "PAYMENT SUCCESS => ",
                response
              );

              //////////////////////////////////////////////////
              // VERIFY PAYMENT
              //////////////////////////////////////////////////

              const verifyResponse =
                await axios.post(

                  "/api/subscription-payments/verify",

                  {

                    subscriptionId:
                      subscription.id,

                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,

                  },

                  {

                    headers: {

                      Authorization:
                        `Bearer ${token}`,

                    },

                  }

                );

              console.log(
                "VERIFY RESPONSE => ",
                verifyResponse.data
              );

              alert(
                "✅ Payment Successful"
              );

            } catch (error) {

              console.error(
                "VERIFY ERROR => ",
                error
              );

              alert(
                "❌ Payment verification failed"
              );

            }

          },

        //////////////////////////////////////////////////
        // MODAL
        //////////////////////////////////////////////////

        modal: {

          ondismiss: function () {

            console.log(
              "Payment popup closed"
            );

          },

        },

      };

      //////////////////////////////////////////////////
      // DEBUG
      //////////////////////////////////////////////////

      console.log(
        "RAZORPAY OPTIONS => ",
        options
      );

      //////////////////////////////////////////////////
      // CREATE RAZORPAY INSTANCE
      //////////////////////////////////////////////////

      const razorpay =
        new (window as any)
          .Razorpay(options);

      //////////////////////////////////////////////////
      // PAYMENT FAILED
      //////////////////////////////////////////////////

      razorpay.on(

        "payment.failed",

        function (
          response: any
        ) {

          console.log(
            "PAYMENT FAILED => ",
            response
          );

          console.log(
            "ERROR => ",
            response.error
          );

          alert(

            response?.error
              ?.description ||
              "Payment Failed"

          );

        }

      );

      //////////////////////////////////////////////////
      // OPEN POPUP
      //////////////////////////////////////////////////

      razorpay.open();

    } catch (error) {

      console.error(
        "ASSIGN PLAN ERROR => ",
        error
      );

      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || "Unknown error";
      alert(
        "❌ Payment failed: " + errMsg
      );

    }

  };

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {

    return (

      <div className="p-10 text-xl font-semibold">

        Loading plans...

      </div>

    );

  }

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (

    <div className="p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold text-slate-800">

            Subscription Plans

          </h1>

          <p className="text-slate-500 mt-1">

            Manage ERP subscription plans

          </p>

        </div>

        {/* CREATE BUTTON */}
        <button

          onClick={() => {

            setEditingPlan(null);

            setOpenModal(true);

          }}

          className="
            bg-primary-600
            hover:bg-primary-700
            text-white
            px-6
            py-3
            rounded-xl
            font-semibold
          "

        >

          + Create Plan

        </button>

      </div>

      {/* EMPTY */}
      {plans.length === 0 && (

        <div
          className="
            bg-white
            rounded-2xl
            border
            p-10
            text-center
            text-slate-500
          "
        >

          No subscription plans found

        </div>

      )}

      {/* PLANS */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >

        {plans.map((plan) => (

          <div

            key={plan.id}

            className="
              bg-white
              rounded-3xl
              shadow-sm
              border
              border-slate-200
              p-6
            "

          >

            {/* NAME */}
            <h2 className="text-2xl font-bold">

              {plan.name}

            </h2>

            {/* DESCRIPTION */}
            {plan.description && (

              <p className="text-slate-500 mt-2">

                {plan.description}

              </p>

            )}

            {/* PRICE */}
            <p
              className="
                text-4xl
                font-bold
                text-primary-600
                mt-4
              "
            >

              ₹{plan.price}

            </p>

            {/* DURATION */}
            <p className="text-slate-500 mt-1">

              {plan.durationInDays} Days

            </p>

            {/* LIMITS */}
            <div className="space-y-2 mt-5">

              <p>
                👨‍🎓 Students:
                <span className="font-semibold ml-2">
                  {plan.maxStudents}
                </span>
              </p>

              <p>
                👨‍🏫 Teachers:
                <span className="font-semibold ml-2">
                  {plan.maxTeachers}
                </span>
              </p>

              <p>
                👨‍💼 Admins:
                <span className="font-semibold ml-2">
                  {plan.maxAdmins}
                </span>
              </p>

              <p>
                💾 Storage:
                <span className="font-semibold ml-2">
                  {plan.maxStorageInGB} GB
                </span>
              </p>

            </div>

            {/* FEATURES */}
            <div className="mt-5 flex flex-wrap gap-2">

              {plan.features?.map(
                (feature, index) => (

                  <span

                    key={index}

                    className="
                      bg-primary-100
                      text-primary-700
                      text-xs
                      px-3
                      py-1
                      rounded-full
                    "

                  >

                    {feature}

                  </span>

                )
              )}

            </div>

            {/* FLAGS */}
            <div className="flex gap-2 mt-5">

              {plan.isTrial && (

                <span
                  className="
                    bg-green-100
                    text-green-700
                    text-xs
                    px-3
                    py-1
                    rounded-full
                  "
                >
                  Trial
                </span>

              )}

              {plan.isPopular && (

                <span
                  className="
                    bg-yellow-100
                    text-yellow-700
                    text-xs
                    px-3
                    py-1
                    rounded-full
                  "
                >
                  Popular
                </span>

              )}

            </div>

            {/* TENANT SELECT */}
            <div className="mt-6">

              <select

                value={
                  selectedTenant[plan.id] || ""
                }

                onChange={(e) =>

                  setSelectedTenant({

                    ...selectedTenant,

                    [plan.id]:
                      e.target.value,

                  })

                }

                className="
                  w-full
                  border
                  rounded-xl
                  px-4
                  py-3
                "
              >

                <option value="">
                  Select Tenant
                </option>

                {tenants.map((tenant) => (

                  <option
                    key={tenant.id}
                    value={tenant.id}
                  >

                    {tenant.name}

                  </option>

                ))}

              </select>

            </div>

            {/* ASSIGN + PAY */}
            <button

              onClick={() =>
                assignPlan(plan.id)
              }

              className="
                w-full
                mt-4
                bg-green-600
                hover:bg-green-700
                text-white
                py-3
                rounded-xl
                font-semibold
              "

            >

              Assign & Pay

            </button>

            {/* ACTIONS */}
            <div className="flex gap-3 mt-4">

              {/* EDIT */}
              <button

                onClick={() => {

                  setEditingPlan(plan);

                  setOpenModal(true);

                }}

                className="
                  flex-1
                  bg-primary-600
                  hover:bg-primary-700
                  text-white
                  py-2.5
                  rounded-xl
                  font-medium
                "

              >

                Edit

              </button>

              {/* DELETE */}
              <button

                onClick={() =>
                  handleDelete(plan.id)
                }

                className="
                  flex-1
                  bg-red-500
                  hover:bg-red-600
                  text-white
                  py-2.5
                  rounded-xl
                  font-medium
                "

              >

                Delete

              </button>

            </div>

          </div>

        ))}

      </div>

      {/* MODAL */}
      {openModal && (

        <CreatePlanModal

          onClose={() => {

            setOpenModal(false);

            setEditingPlan(null);

          }}

          editingPlan={editingPlan}

          refreshPlans={fetchPlans}

        />

      )}

    </div>

  );

}