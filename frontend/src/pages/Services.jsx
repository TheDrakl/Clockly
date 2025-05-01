import React, { useEffect, useState } from "react";

const Services = () => {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        console.log(data);
        setProfileData(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchProfileData();
  }, []);
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Services</h2>
      <div className="grid grid-cols-4 gap-4">
        {profileData.Services.map((service) => (
          <div key={service.id} className="p-4 border rounded-lg">
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
