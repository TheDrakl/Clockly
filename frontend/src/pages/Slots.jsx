import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import { formatDate } from "../utils/format";
import api from '../api/api';

const Slots = () => {
  const { username } = useParams();
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await api.get('/api/client/availability-slots/');
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
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[100rem] mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Your Availability Slots
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Manage your available time slots
          </p>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="relative px-4 py-5 sm:p-6">
                <button className="absolute top-2 right-2 text-gray-500 hover:text-indigo-600">
                  <FaEdit size={18} />
                </button>

                <h3 className="text-lg font-medium text-gray-900">Date: {formatDate(slot.date)}</h3>
                <p className="mt-1 text-sm text-gray-500">Start: {slot.start_time}</p>
                <p className="mt-1 text-sm text-gray-500">End: {slot.end_time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Slots;