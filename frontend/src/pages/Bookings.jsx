import React, { useEffect, useState } from "react";

const Bookings = () => {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    service_id: "", 
    date: "",
    start_time: "",
    send_email: true
  });

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found, please log in.");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/client/me/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

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
          customer_email: newBooking.customer_email,
          customer_name: newBooking.customer_name,
          customer_phone: newBooking.customer_phone,
          service_id: parseInt(newBooking.service_id),
          start_time: newBooking.start_time,
          date: newBooking.date,
          email_sent: newBooking.send_email
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
        send_email: false
      });
      await fetchProfileData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mb-6">
      <h2 className="text-3xl mt-2 font-semibold mb-4 text-center">Bookings</h2>
      <div
        className="text-xl font-semibold mb-4 text-center border-2 border-gray-300 w-1/6 mx-auto p-2 rounded-lg cursor-pointer hover:bg-gray-200"
        onClick={() => setShowForm(true)}
      >
        Add New Booking
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-2xl font-semibold mb-4">Add New Booking</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Customer Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newBooking.customer_name}
                  onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Customer Email</label>
                <input
                  type="email"
                  className="w-full border rounded-lg p-2"
                  value={newBooking.customer_email}
                  onChange={(e) => setNewBooking({ ...newBooking, customer_email: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Customer Phone</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newBooking.customer_phone}
                  onChange={(e) => setNewBooking({ ...newBooking, customer_phone: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Service</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={newBooking.service_id}
                  onChange={(e) => setNewBooking({ ...newBooking, service_id: e.target.value })}
                  required
                >
                  <option value="">Select Service</option>
                  {profileData.Services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Start Time</label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2"
                  value={newBooking.start_time}
                  onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Send Email Notification</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={newBooking.send_email}
                    onChange={(e) => setNewBooking({ ...newBooking, send_email: e.target.checked })}
                  />
                  <span>Send email notification</span>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {(profileData.Bookings || []).map((booking) => (
          <div key={booking.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="text-xl font-medium">{booking.service_name}</h3>
            <p className="text-gray-700">Date: {booking.date}</p>
            <p className="text-gray-500">Start Time: {booking.start_time}</p>
            <p className="text-gray-500">Status: {booking.status}</p>
            <p className="text-gray-500">Email Sent: {booking.email_sent ? "Yes" : "No"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bookings;