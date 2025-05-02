import React, { useEffect, useState } from "react";

const Slots = () => {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: "", start_time: "", end_time: "" });

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
      const response = await fetch("http://127.0.0.1:8000/api/client/availability-slots/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newSlot),
      });

      if (!response.ok) {
        throw new Error("Failed to add new slot");
      }

      setShowForm(false);
      setNewSlot({ date: "", start_time: "", end_time: "" });
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

  const slots = profileData.Slots || profileData.slots || [];

  return (
    <div className="mb-6">
      <h2 className="text-3xl mt-2 font-semibold mb-4 text-center">Available Slots</h2>
      <div
        className="text-xl font-semibold mb-4 text-center border-2 border-gray-300 w-1/6 mx-auto p-2 rounded-lg cursor-pointer hover:bg-gray-200"
        onClick={() => setShowForm(true)}
      >
        Add new Availability Slot
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-2xl font-semibold mb-4">Add New Slot</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Start Time</label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">End Time</label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  required
                />
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
        {slots.map((slot) => (
          <div key={slot.id} className="p-4 border rounded-lg shadow-md">
            <p className="text-lg font-medium">Date: {slot.date}</p>
            <p className="text-gray-500">Start Time: {slot.start_time}</p>
            <p className="text-gray-500">End Time: {slot.end_time}</p>
            <p className="text-gray-500">Status: {slot.is_active ? "Active" : "Inactive"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Slots;