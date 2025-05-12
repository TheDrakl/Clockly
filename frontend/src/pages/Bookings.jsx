import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit } from "react-icons/fa";
import { formatDate } from "../utils/format";
import api from '../api/api';

const Bookings = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    service: "",
    date: "",
    status: "",
    start_time: "",
    send_email: true,
  });
  const [editingBooking, setEditingBooking] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/client/me/');
        setUserData(response.data);
      } catch (error) {
        setError(error.message);
        console.error(error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/api/client/bookings/', {
        customer_name: newBooking.customer_name,
        customer_email: newBooking.customer_email,
        customer_phone: newBooking.customer_phone,
        service_id: parseInt(newBooking.service),
        date: newBooking.date,
        status: newBooking.status,
        start_time: newBooking.start_time,
        email_sent: newBooking.send_email,
      });

      setShowForm(false);
      setNewBooking({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        service: "",
        status: "",
        date: "",
        start_time: "",
        send_email: true,
      });

      const updated = await api.get('/api/client/me/');
      setUserData(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking({
      id: booking.id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      service: booking.service_id.toString(),
      status: booking.status,
      date: booking.end_datetime.split("T")[0],
      start_time: booking.start_time,
      email_sent: booking.email_sent,
    });
    setShowEdit(true);
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();

    try {
      const response = await api.put(`/api/client/bookings/${editingBooking.id}/`, {
        customer_name: editingBooking.customer_name,
        customer_email: editingBooking.customer_email,
        customer_phone: editingBooking.customer_phone,
        service_id: parseInt(editingBooking.service),
        date: editingBooking.date,
        status: editingBooking.status,
        start_time: editingBooking.start_time,
        email_sent: editingBooking.email_sent,
      });

      setShowEdit(false);

      // Refresh user data
      const updated = await api.get('/api/client/me/');
      setUserData(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBooking = async (e) => {
    try {
      await api.delete(`/api/client/bookings/${editingBooking.id}/`);

      setShowEdit(false);
      setShowDelete(false);

      // Refresh user data
      const updated = await api.get('/api/client/me/');
      setUserData(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const formattedDate = (dateString) => {
    if (!dateString) return "Invalid date";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  function onClose() {
    setShowDelete(false)
  }

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
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
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
                  {
                    label: "Customer Name",
                    key: "customer_name",
                    type: "text",
                  },
                  {
                    label: "Customer Email",
                    key: "customer_email",
                    type: "email",
                  },
                  {
                    label: "Customer Phone",
                    key: "customer_phone",
                    type: "text",
                  },
                ].map(({ label, key, type }) => (
                  <div className="mb-4" key={key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <input
                      type={type}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newBooking[key]}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, [key]: e.target.value })
                      }
                      required
                    />
                  </div>
                ))}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Service
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newBooking.service}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, service: e.target.value })
                    }
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
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newBooking.date}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newBooking.start_time}
                    onChange={(e) =>
                      setNewBooking({
                        ...newBooking,
                        start_time: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newBooking.status}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, status: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>

                <div className="mb-4 flex items-center">
                  <input
                    id="send-email"
                    name="send-email"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={newBooking.send_email}
                    onChange={(e) =>
                      setNewBooking({
                        ...newBooking,
                        send_email: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="send-email"
                    className="ml-2 block text-sm text-gray-700"
                  >
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
        {/* Booking Editing */}
        {showEdit && editingBooking && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Edit Booking</h3>
              <form onSubmit={handleUpdateBooking}>
                {[
                  {
                    label: "Customer Name",
                    key: "customer_name",
                    type: "text",
                  },
                  {
                    label: "Customer Email",
                    key: "customer_email",
                    type: "email",
                  },
                  {
                    label: "Customer Phone",
                    key: "customer_phone",
                    type: "text",
                  },
                ].map(({ label, key, type }) => (
                  <div className="mb-4" key={key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <input
                      type={type}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editingBooking[key] || ""}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          [key]: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                ))}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Service
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={editingBooking.service || ""}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        service: e.target.value,
                      })
                    }
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
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={editingBooking.date || ""}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={editingBooking.start_time || ""}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        start_time: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={editingBooking.status}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        status: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>

                <div className="mb-4 flex items-center">
                  <input
                    id="edit-send-email"
                    name="edit-send-email"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={editingBooking.email_sent}
                    disabled
                  />
                  <label
                    htmlFor="edit-send-email"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Email notification status
                  </label>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowEdit(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="bg-red-600 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => setShowDelete(true)}
                  >
                    Delete
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Are you sure you want to delete?
            </h3>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBooking}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        )}
        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {userData.Bookings?.map((booking) => (
            <div
              key={booking.id}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-indigo-600"
                    onClick={() => handleEditBooking(booking)}
                  >
                    <FaEdit size={18} />
                  </button>
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {booking.service_name}
                </h3>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Customer:</span>{" "}
                    {booking.customer_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Service:</span>{" "}
                    {booking.service_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(booking.end_datetime.split("T")[0])}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Time:</span>{" "}
                    {booking.start_time} - {booking.end_time}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status?.charAt(0).toUpperCase() +
                        booking.status?.slice(1) || "Pending"}
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
