import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

function UserSlots() {
  const { username, date } = useParams();
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const getAvailabilitySlots = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/bookings/${username}/${date}/`,
          {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const data = await response.json();

        if (response.ok) {
          setAvailabilitySlots(data);
        } else {
          setErrorMessage('Something went wrong');
        }
      } catch (error) {
        setErrorMessage('Error fetching slots');
        console.error(error);
      }
    };

    getAvailabilitySlots();
  }, [username, date]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Available Slots for {username} on {date}</h1>
      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}

      {availabilitySlots.length === 0 ? (
        <p className="mt-4 text-gray-600">No slots available.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {availabilitySlots.map((slot, index) => (
            <li
              key={index}
              className="bg-green-100 border border-green-400 rounded px-4 py-2 text-center"
            >
              {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserSlots;