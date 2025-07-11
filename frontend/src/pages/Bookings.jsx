import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit } from "react-icons/fa";
import { formatDate } from "../utils/format";
import api from "../api/api";
import ErrorMessage from "../components/ErrorMessage.jsx";

const Bookings = () => {
  const [originalBooking, setOriginalBooking] = useState(null);
  const [noAvailableSlot, setNoAvailableSlot] = useState(false);
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
        const response = await api.get("/api/client/bookings/");
        setUserData(response.data);
      } catch (error) {
        setError(error.message);
        console.error(error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const filterBookings = (isUpcoming) => {
    if (!userData?.Bookings) return [];

    return userData.Bookings.filter((booking) =>
      isUpcoming
        ? new Date(booking.end_datetime) > new Date()
        : new Date(booking.end_datetime) <= new Date()
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/api/client/bookings/", {
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

      const updated = await api.get("/api/client/me/");
      setUserData(updated.data);
    } catch (err) {
      if (err.response.data.error === "No matching available slot found.") {
        setNoAvailableSlot(true);
      } else {
        setError(err.response.data.error);
      }
    }
  };

  const handleEditBooking = (booking) => {
    const formattedBooking = {
      id: booking.id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      service: booking.service_id.toString(),
      status: booking.status,
      date: booking.end_datetime.split("T")[0],
      start_time: booking.start_time,
      email_sent: booking.email_sent,
    };

    setEditingBooking(formattedBooking);
    setOriginalBooking(formattedBooking);
    setShowEdit(true);
  };

  const isBookingChanged = (a, b) => {
    return Object.keys(a).some((key) => a[key] !== b[key]);
  };

  const handleUpdateBooking = async (e) => {
    console.log(error);
    e.preventDefault();

    if (!isBookingChanged(originalBooking, editingBooking)) {
      setShowEdit(false);
      setNoAvailableSlot(false);
      return;
    }

    try {
      await api.put(`/api/client/bookings/${editingBooking.id}/`, {
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
      setNoAvailableSlot(false);

      const updated = await api.get("/api/client/me/");
      setUserData(updated.data);
    } catch (err) {
      if (err.response.data.error === "No matching available slot found.") {
        setNoAvailableSlot(true);
      } else {
        setError(err.response.data.error);
      }
    }
  };

  const handleDeleteBooking = async (e) => {
    try {
      await api.delete(`/api/client/bookings/${editingBooking.id}/`);

      setShowEdit(false);
      setNoAvailableSlot(false);

      setShowDelete(false);

      // Refresh user data
      const updated = await api.get("/api/client/me/");
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
    setShowDelete(false);
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[100rem] mx-auto">
        {userData?.Bookings && (
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Your Bookings
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-text-main sm:mt-4">
              Manage your appointments and schedules
            </p>
          </div>
        )}
        {!userData?.Bookings && (
          <div className="text-center">
            <h2 className="text-1xl font-extrabold text-white sm:text-3xl">
              You don't have any bookings yet!
            </h2>
          </div>
        )}
        {error && !noAvailableSlot && <ErrorMessage error={error} />}
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
          <div className="fixed inset-0 bg-bg bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-bg p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Add New Booking</h3>
              {noAvailableSlot && (
                <div className="mb-4 p-3 bg-bg-card border-bg-card shadow-md text-red-700 rounded">
                  <p className="text-sm font-medium">
                    No available time slot was found for the selected date and
                    time.
                  </p>
                  <p className="text-sm mt-1">
                    Please choose a different time or date, and try again.
                  </p>
                </div>
              )}
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
                    <label className="block text-sm font-medium text-white">
                      {label}
                    </label>
                    <input
                      type={type}
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newBooking[key]}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, [key]: e.target.value })
                      }
                      required
                    />
                  </div>
                ))}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white">
                    Service
                  </label>
                  <select
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-white">
                    Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newBooking.date}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-white">
                    Status
                  </label>
                  <select
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="ml-2 block text-sm text-white"
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
            <div className="bg-bg p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Edit Booking</h3>
              {noAvailableSlot && (
                <div className="mb-4 p-3 bg-bg-card border-bg-card shadow-md text-red-700 rounded">
                  <p className="text-sm font-medium">
                    No available time slot was found for the selected date and
                    time.
                  </p>
                  <p className="text-sm mt-1">
                    Please choose a different time or date, and try again.
                  </p>
                </div>
              )}
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
                    <label className="block text-sm font-medium text-white">
                      {label}
                    </label>
                    <input
                      type={type}
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-white">
                    Service
                  </label>
                  <select
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-white">
                    Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-white">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-white">
                    Status
                  </label>
                  <select
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="ml-2 block text-sm text-white"
                  >
                    Email notification status
                  </label>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      setShowEdit(false);
                      setNoAvailableSlot(false);
                    }}
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
        {/* Current bookings */}
        {userData?.Bookings && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Upcoming Bookings
            </h3>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filterBookings(true).map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onEdit={() => handleEditBooking(booking)}
                />
              ))}
              {filterBookings(true).length === 0 && (
                <p className="text-text-main">No upcoming bookings</p>
              )}
            </div>
          </div>
        )}
        {/* Bookings from the Past */}
        {userData?.Bookings && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Past Bookings
            </h3>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filterBookings(false).map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onEdit={() => handleEditBooking(booking)}
                  isPast
                />
              ))}
              {filterBookings(false).length === 0 && (
                <p className="text-text-main">No past bookings</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onEdit, isPast = false }) => {
  return (
    <div
      className={`card overflow-hidden shadow rounded-lg ${
        isPast ? "opacity-80" : ""
      }`}
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-indigo-600"
            onClick={onEdit}
          >
            <FaEdit size={18} />
          </button>
        </div>
        <h3 className="text-lg font-medium text-white">
          {booking.service_name}
        </h3>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-text-main">
            <span className="font-medium text-white">Customer:</span>{" "}
            {booking.customer_name}
          </p>
          <p className="text-sm text-text-main">
            <span className="font-medium text-white">Date:</span>{" "}
            {formatDate(booking.end_datetime.split("T")[0])}
          </p>
          <p className="text-sm text-text-main">
            <span className="font-medium text-white">Time:</span>{" "}
            {booking.start_time} - {booking.end_time}
          </p>
          <p className="text-sm text-text-main">
            <span className="font-medium text-white">Status:</span>{" "}
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
        </div>
      </div>
    </div>
  );
};

export default Bookings;
