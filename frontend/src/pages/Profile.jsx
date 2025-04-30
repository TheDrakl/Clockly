import React, { useState, useEffect } from 'react';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found, please log in.');
          return;
        }

        const response = await fetch('http://127.0.0.1:8000/api/client/me/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      {/* Services Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Services</h2>
        <div className="grid grid-cols-1 gap-4">
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

      {/* Slots Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Available Slots</h2>
        <div className="grid grid-cols-1 gap-4">
          {profileData.Slots.map((slot) => (
            <div key={slot.id} className="p-4 border rounded-lg">
              <p className="text-lg font-medium">Date: {slot.date}</p>
              <p className="text-gray-500">Start Time: {slot.start_time}</p>
              <p className="text-gray-500">End Time: {slot.end_time}</p>
              <p className="text-gray-500">Status: {slot.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Bookings</h2>
        <div className="grid grid-cols-1 gap-4">
          {profileData.Bookings.map((booking) => (
            <div key={booking.id} className="p-4 border rounded-lg">
              <p className="text-lg font-medium">Customer: {booking.customer_name}</p>
              <p className="text-gray-500">Email: {booking.customer_email}</p>
              <p className="text-gray-500">Phone: {booking.customer_phone}</p>
              <p className="text-gray-500">Service: {profileData.Services.find(service => service.id === booking.service)?.name}</p>
              <p className="text-gray-500">Start Time: {booking.start_time}</p>
              <p className="text-gray-500">End Time: {booking.end_time}</p>
              <p className="text-gray-500">Confirmed: {booking.confirmed ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;