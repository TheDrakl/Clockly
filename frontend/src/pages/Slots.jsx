import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import { formatDate } from "../utils/format";
import api from "../api/api";
import formatDateLabel from "../utils/formatDate.js";
import ErrorMessage from "../components/ErrorMessage.jsx";

const Slots = () => {
  const { username } = useParams();
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await api.get("/api/client/availability-slots/");
        setSlots(response.data);
      } catch (error) {
        setError("Error fetching slots");
        console.error(error);
      }
    };

    fetchSlots();
  }, [username]);

  if (error) {
    return (
      <ErrorMessage error={error} />
    );
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[100rem] mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Your Availability Slots
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-text-main sm:mt-4">
            Manage your available time slots
          </p>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="card overflow-hidden shadow rounded-lg"
            >
              <div className="relative px-4 py-5 sm:p-6">
                <button className="absolute top-2 right-2 text-gray-500 hover:text-indigo-600">
                  <FaEdit size={18} />
                </button>

                <h3 className="text-lg font-medium text-white">
                  Date:{" "}
                  <span className="text-text-main">
                    {formatDateLabel(slot.date)}
                  </span>
                </h3>
                <p className="mt-1 text-sm text-white">
                  Start:{" "}
                  <span className="text-text-main">{slot.start_time}</span>
                </p>
                <p className="mt-1 text-sm text-white">
                  End: <span className="text-text-main">{slot.end_time}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Slots;
