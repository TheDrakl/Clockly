import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit } from "react-icons/fa";
import { formatDate } from "../utils/format";

const Bookings = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    service_id: "",
    date: "",
    start_time: "",
    send_email: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found, please log in.");

        const response = await fetch("http://127.0.0.1:8000/api/client/me/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          throw new Error("Failed to fetch user data");
        }
      } catch (error) {
        setError(error.message);
        console.error(error);
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/api/client/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          customer_name: newBooking.customer_name,
          customer_email: newBooking.customer_email,
          customer_phone: newBooking.customer_phone,
          service_id: parseInt(newBooking.service_id),
          date: newBooking.date,
          start_time: newBooking.start_time,
          email_sent: newBooking.send_email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }

      setShowForm(false);
      setNewBooking({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        service_id: "",
        date: "",
        start_time: "",
        send_email: true,
      });

      // Refresh user data
      const updated = await fetch("http://127.0.0.1:8000/api/client/me/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const updatedData = await updated.json();
      setUserData(updatedData);
    } catch (err) {
      setError(err.message);
    }
  };

  const formattedDate = (date) => {
    if (!date || typeof date !== "string") return "Invalid date";
    return date.split("T")[0];
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[100rem] mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Your Bookings
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Manage your appointments and schedules
          </p>
        </div>

        {error && (
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
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaPlus className="mr-2" />
            Add New Booking
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Add New Booking</h3>
              <form onSubmit={handleFormSubmit}>
                {[
                  { label: "Customer Name", key: "customer_name", type: "text" },
                  { label: "Customer Email", key: "customer_email", type: "email" },
                  { label: "Customer Phone", key: "customer_phone", type: "text" },
                ].map(({ label, key, type }) => (
                  <div className="mb-4" key={key}>
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <input
                      type={type}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newBooking[key]}
                      onChange={(e) => setNewBooking({ ...newBooking, [key]: e.target.value })}
                      required
                    />
                  </div>
                ))}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Service</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newBooking.service_id}
                    onChange={(e) => setNewBooking({ ...newBooking, service_id: e.target.value })}
                    required
                  >
                    <option value="">Select Service</option>
                    {userData.Services?.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newBooking.start_time}
                    onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4 flex items-center">
                  <input
                    id="send-email"
                    name="send-email"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={newBooking.send_email}
                    onChange={(e) => setNewBooking({ ...newBooking, send_email: e.target.checked })}
                  />
                  <label htmlFor="send-email" className="ml-2 block text-sm text-gray-700">
                    Send email notification
                  </label>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {userData.Bookings?.map((booking) => (
            <div key={booking.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="relative">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-indigo-600">
                    <FaEdit size={18} />
                  </button>
                  </div>
                <h3 className="text-lg font-medium text-gray-900">{booking.service_name}</h3>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Customer:</span> {booking.customer_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Date:</span> {formatDate(formattedDate(booking.end_datetime))}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Time:</span> {booking.start_time} - {booking.end_time}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.confirmed === true
                          ? "bg-green-100 text-green-800"
                          : booking.confirmed === false
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Email Sent:</span>{" "}
                    {booking.email_sent ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bookings;