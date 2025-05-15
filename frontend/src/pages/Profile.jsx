import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";

function Profile() {
  const baseUrl = `${window.location.origin}/users/`;
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/api/client/me/");
        setUser(response.data.User);
        setSlug(response.data.User.user_slug);
      } catch (error) {
        setError("Error fetching user data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  const fullUrl = `${baseUrl}${slug}/`;

  const handleCopy = (value) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      const response = await api.put("/api/client/me/", {
        user_slug: slug,
      });
      setSaveError(false);
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.user_slug &&
        error.response.data.user_slug.includes(
          "User with this user slug already exists."
        )
      ) {
        setSlug(user.user_slug);
        setSaveError(true);
      } else {
        console.error("error:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-lg text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-lg text-gray-600">No user data found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Profile Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Personal details and services.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.username}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Email address
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.email}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Phone number
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.phone || "Not provided"}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  Your Link
                  <span className="relative group cursor-pointer">
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-700 mt-[2px]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 7h2v2H9V7zm0 4h2v6H9v-6zm1-9a9 9 0 100 18 9 9 0 000-18z" />
                    </svg>
                    <div className="absolute bottom-full mb-1 w-48 text-xs text-white bg-black p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      This is the public link you can share with others.
                    </div>
                  </span>
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="max-w-md w-full">
                    {/* Input, Copy, Edit in one row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm">
                        {/* Prefix */}
                        <span className="text-gray-500 select-none">
                          {baseUrl}
                        </span>

                        {/* Editable slug input */}
                        <input
                          type="text"
                          value={slug}
                          readOnly={!isEditing}
                          onChange={(e) => setSlug(e.target.value)}
                          className={`flex-1 bg-transparent text-gray-700 text-sm outline-none ${
                            isEditing
                              ? "cursor-text"
                              : "cursor-default select-all"
                          }`}
                        />

                        {/* Copy button */}
                        {!isEditing && (
                          <button
                            onClick={() => handleCopy(fullUrl)}
                            className="ml-2 text-sm text-blue-600 hover:underline"
                          >
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        )}
                      </div>

                      {/* Edit/Save button */}
                      <button
                        className="ml-4 text-blue-600 hover:underline whitespace-nowrap"
                        onClick={() => {
                          if (isEditing) handleSave();
                          setIsEditing(!isEditing);
                        }}
                      >
                        {isEditing ? "Save" : "Edit"}
                      </button>
                    </div>

                    {/* Error message below the row */}
                    {saveError && (
                      <p className="text-red-500 text-[0.75rem] mt-1 ml-[2px]">
                        That link already exists!
                      </p>
                    )}
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Services
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your available services.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {user.services && user.services.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {user.services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white overflow-hidden shadow rounded-lg"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <h4 className="text-lg font-medium text-gray-900">
                          {service.name}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {service.description}
                        </p>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-lg font-medium text-indigo-600">
                            ${service.price}
                          </span>
                          <span className="text-sm text-gray-500">
                            {service.duration} min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No services available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Available Slots
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your available time slots.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {user.slots && user.slots.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {user.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="bg-white overflow-hidden shadow rounded-lg"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <p className="text-lg font-medium text-gray-900">
                          {new Date(slot.start_time).toLocaleTimeString()} -{" "}
                          {new Date(slot.end_time).toLocaleTimeString()}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {new Date(slot.start_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No slots available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Bookings
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your recent bookings.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {user.bookings && user.bookings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {user.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white overflow-hidden shadow rounded-lg"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {booking.service.name}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              {new Date(booking.start_time).toLocaleString()} -{" "}
                              {new Date(booking.end_time).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No bookings found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
