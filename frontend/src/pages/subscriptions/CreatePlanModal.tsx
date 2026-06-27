import { useEffect, useState } from "react";
import axios from "axios";

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

interface Props {

  onClose: () => void;

  editingPlan: Plan | null;

  refreshPlans: () => Promise<void>;

}

export default function CreatePlanModal({

  onClose,

  editingPlan,

  refreshPlans,

}: Props) {

  //////////////////////////////////////////////////////
  // STATES
  //////////////////////////////////////////////////////

  const [name, setName] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [durationInDays, setDurationInDays] =
    useState("");

  const [currency, setCurrency] =
    useState("INR");

  const [maxStudents, setMaxStudents] =
    useState("");

  const [maxTeachers, setMaxTeachers] =
    useState("");

  const [maxAdmins, setMaxAdmins] =
    useState("1");

  const [maxStorageInGB, setMaxStorageInGB] =
    useState("5");

  const [features, setFeatures] =
    useState("");

  const [isTrial, setIsTrial] =
    useState(false);

  const [isPopular, setIsPopular] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  //////////////////////////////////////////////////////
  // AUTO FILL
  //////////////////////////////////////////////////////

  useEffect(() => {

    if (editingPlan) {

      setName(
        editingPlan.name || ""
      );

      setSlug(
        editingPlan.slug || ""
      );

      setDescription(
        editingPlan.description || ""
      );

      setPrice(
        editingPlan.price?.toString() || ""
      );

      setDurationInDays(
        editingPlan.durationInDays?.toString() || ""
      );

      setCurrency(
        editingPlan.currency || "INR"
      );

      setMaxStudents(
        editingPlan.maxStudents?.toString() || ""
      );

      setMaxTeachers(
        editingPlan.maxTeachers?.toString() || ""
      );

      setMaxAdmins(
        editingPlan.maxAdmins?.toString() || "1"
      );

      setMaxStorageInGB(
        editingPlan.maxStorageInGB?.toString() || "5"
      );

      setFeatures(
        editingPlan.features?.join(", ") || ""
      );

      setIsTrial(
        editingPlan.isTrial || false
      );

      setIsPopular(
        editingPlan.isPopular || false
      );

    }

  }, [editingPlan]);

  //////////////////////////////////////////////////////
  // SUBMIT
  //////////////////////////////////////////////////////

  const handleSubmit = async () => {

    try {

      ////////////////////////////////////////////////////
      // VALIDATION
      ////////////////////////////////////////////////////

      if (
        !name ||
        !slug ||
        !price ||
        !durationInDays ||
        !maxStudents ||
        !maxTeachers
      ) {

        alert("Please fill all required fields");

        return;

      }

      setLoading(true);

      ////////////////////////////////////////////////////
      // TOKEN
      ////////////////////////////////////////////////////

      const token =
        localStorage.getItem("token");

      ////////////////////////////////////////////////////
      // PAYLOAD
      ////////////////////////////////////////////////////

      const payload = {

        name,

        slug,

        description,

        price: Number(price),

        durationInDays:
          Number(durationInDays),

        currency,

        maxStudents:
          Number(maxStudents),

        maxTeachers:
          Number(maxTeachers),

        maxAdmins:
          Number(maxAdmins),

        maxStorageInGB:
          Number(maxStorageInGB),

        features:
          features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean),

        isTrial,

        isPopular,

      };

      console.log(
        "PAYLOAD =>",
        payload
      );

      ////////////////////////////////////////////////////
      // UPDATE PLAN
      ////////////////////////////////////////////////////

      if (editingPlan) {

        await axios.put(

          `/api/subscriptions/plans/${editingPlan.id}`,

          payload,

          {

            headers: {

              Authorization:
                `Bearer ${token}`,

            },

          }

        );

      }

      ////////////////////////////////////////////////////
      // CREATE PLAN
      ////////////////////////////////////////////////////

      else {

        await axios.post(

          "/api/subscriptions/plans",

          payload,

          {

            headers: {

              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",

            },

          }

        );

      }

      ////////////////////////////////////////////////////
      // REFRESH DATA
      ////////////////////////////////////////////////////

      await refreshPlans();

      ////////////////////////////////////////////////////
      // CLOSE MODAL
      ////////////////////////////////////////////////////

      onClose();

    } catch (error: any) {

      console.log(
        "FULL ERROR =>",
        error
      );

      console.log(
        "RESPONSE =>",
        error?.response
      );

      console.log(
        "DATA =>",
        error?.response?.data
      );

      alert(

        error?.response?.data?.message ||

        error?.message ||

        "Something went wrong"

      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div
      className="
        fixed
        inset-0
        bg-black/40
        flex
        items-center
        justify-center
        z-50
        p-4
      "
    >

      <div
        className="
          bg-white
          rounded-3xl
          p-8
          w-full
          max-w-3xl
          shadow-2xl
          max-h-[90vh]
          overflow-y-auto
        "
      >

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">

          <div>

            <h2 className="text-3xl font-bold text-slate-800">

              {editingPlan
                ? "Edit Subscription Plan"
                : "Create Subscription Plan"}

            </h2>

            <p className="text-slate-500 mt-1">
              Manage ERP pricing plans
            </p>

          </div>

          <button
            onClick={onClose}
            className="
              w-10
              h-10
              rounded-full
              bg-gray-100
              hover:bg-gray-200
              text-2xl
            "
          >
            ×
          </button>

        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <input
            type="text"
            placeholder="Plan Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Slug"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Duration In Days"
            value={durationInDays}
            onChange={(e) =>
              setDurationInDays(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Max Students"
            value={maxStudents}
            onChange={(e) =>
              setMaxStudents(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Max Teachers"
            value={maxTeachers}
            onChange={(e) =>
              setMaxTeachers(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Max Admins"
            value={maxAdmins}
            onChange={(e) =>
              setMaxAdmins(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Storage In GB"
            value={maxStorageInGB}
            onChange={(e) =>
              setMaxStorageInGB(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Currency"
            value={currency}
            onChange={(e) =>
              setCurrency(e.target.value)
            }
            className="border rounded-xl px-4 py-3"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="
              border
              rounded-xl
              px-4
              py-3
              md:col-span-2
            "
          />

          <textarea
            placeholder="Attendance, Fees, Exam"
            value={features}
            onChange={(e) =>
              setFeatures(e.target.value)
            }
            className="
              border
              rounded-xl
              px-4
              py-3
              h-28
              md:col-span-2
            "
          />

        </div>

        {/* CHECKBOXES */}
        <div className="flex gap-6 mt-6">

          <label className="flex items-center gap-2">

            <input
              type="checkbox"
              checked={isTrial}
              onChange={(e) =>
                setIsTrial(e.target.checked)
              }
            />

            Trial Plan

          </label>

          <label className="flex items-center gap-2">

            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) =>
                setIsPopular(e.target.checked)
              }
            />

            Popular Plan

          </label>

        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-4 mt-8">

          <button
            onClick={onClose}
            className="
              px-6
              py-3
              rounded-xl
              bg-gray-200
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              px-6
              py-3
              rounded-xl
              bg-primary-600
              hover:bg-primary-700
              text-white
            "
          >

            {loading
              ? "Please wait..."
              : editingPlan
              ? "Update Plan"
              : "Create Plan"}

          </button>

        </div>

      </div>

    </div>

  );

}