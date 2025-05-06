import React, { useEffect, useState } from "react";

const Services = () => {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    duration: "",
    price: "",
  });
  const [showForm, setShowForm] = useState(false);

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

    // Convert duration to HH:MM:SS
    const [hours, minutes] = newService.duration.split(":");
    const formattedDuration = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/client/services/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...newService,
          duration: formattedDuration,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add new service");
      }

      setShowForm(false);
      setNewService({ name: "", description: "", duration: "", price: "" });
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
      <h2 className="text-2xl font-semibold mb-4 text-center">Services</h2>
      <div
        className="text-xl font-semibold mb-4 text-center border-2 border-gray-300 w-1/6 mx-auto p-2 rounded-lg cursor-pointer hover:bg-gray-200"
        onClick={() => setShowForm(true)}
      >
        Add New Service
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-2xl font-semibold mb-4">Add Service</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Description</label>
                <textarea
                  className="w-full border rounded-lg p-2"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Duration</label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Format: HH:MM (e.g., 01:30 for 1h 30min)</p>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Price ($)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
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
        {(profileData.Services || []).map((service) => (
          <div key={service.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="text-xl font-medium">{service.name}</h3>
            <p className="text-gray-700">{service.description}</p>
            <p className="text-gray-500">Duration: {service.duration}</p>
            <p className="text-gray-500">Price: ${service.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;