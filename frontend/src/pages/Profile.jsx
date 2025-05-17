import { useEffect, useState } from "react";
import api from "../api/api";
import Button from "../components/PurpleButton.jsx";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import formatDateLabel from "../utils/formatDate.js";
import ErrorMessage from "../components/ErrorMessage.jsx";

function Profile() {
  const baseUrl = `${window.location.origin}/users/`;
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/api/client/me/");
        setUser(response.data);
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
    const currentSlug = (user.User.user_slug || "").trim().toLowerCase();
    const newSlug = (slug || "").trim().toLowerCase();

    if (newSlug === currentSlug) {
      setIsEditing(false);
      setSaveError(false);
      return;
    }

    try {
      const response = await api.put("/api/client/me/", {
        user_slug: slug.trim(),
      });
      setSaveError(false);
      setUser((prev) => ({
        ...prev,
        User: {
          ...prev.User,
          user_slug: slug.trim(),
        },
      }));
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.user_slug &&
        error.response.data.user_slug.includes(
          "User with this user slug already exists."
        )
      ) {
        setSlug(user.User.user_slug);
        setSaveError(true);
      } else {
        console.error("error:", error);
      }
    } finally {
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-lg text-text-main">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-lg text-white">No user data found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-white">
              Profile Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-white">
              Personal details and services.
            </p>
          </div>
          <div className="border-t border-gray-900">
            <dl>
              <div className="bg-bg-card px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-white">Full name</dt>
                <dd className="mt-1 text-sm text-text-gray sm:mt-0 sm:col-span-2">
                  {user.User.username}
                </dd>
              </div>
              <div className="bg-bg-card px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-white">
                  Email address
                </dt>
                <dd className="mt-1 text-sm text-text-gray sm:mt-0 sm:col-span-2">
                  {user.User.email}
                </dd>
              </div>
              <div className="bg-bg-card px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-white">Phone number</dt>
                <dd className="mt-1 text-sm text-text-gray sm:mt-0 sm:col-span-2">
                  {user.User.phone || "Not provided"}
                </dd>
              </div>
              <div className="bg-bg-card px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-white flex items-center gap-1">
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
                <dd className="mt-1 text-sm text-text-main sm:mt-0 sm:col-span-2">
                  <div className="max-w-md w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0 rounded-md border border-gray-300 bg-bg px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-purple-500">
                        <span className="text-gray-500 truncate mr-1">
                          {baseUrl}
                        </span>

                        <input
                          type="text"
                          value={slug}
                          readOnly={!isEditing}
                          onChange={(e) => setSlug(e.target.value)}
                          className={`min-w-0 flex-1 bg-transparent text-text-main text-sm outline-none border-none p-0 ${
                            isEditing
                              ? "cursor-text"
                              : "cursor-default select-all"
                          }`}
                        />
                      </div>

                      {!isEditing && (
                        <button
                          onClick={() => handleCopy(fullUrl)}
                          className="ml-2 text-sm text-purple-main hover:underline whitespace-nowrap"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      )}

                      <button
                        className="ml-4 text-purple-main hover:underline whitespace-nowrap"
                        onClick={() => {
                          if (isEditing) handleSave();
                          setIsEditing(!isEditing);
                        }}
                      >
                        {isEditing ? "Save" : "Edit"}
                      </button>
                    </div>

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

        <div className="mt-8 bg-bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 relative">
            <h3 className="text-lg leading-6 font-medium text-white">
              Services
            </h3>
            <Button
              className="absolute top-5 right-4"
              aria-label="See all services"
              onClick={() => {
                navigate("/services");
              }}
            >
              See all
            </Button>
            <p className="mt-1 max-w-2xl text-sm text-gray-300">
              Your available services.
            </p>
          </div>
          <div className="border-t border-gray-800">
            <div className="px-4 py-5 sm:p-6">
              {user.Services && user.Services.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                  {user.Services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-bg-card overflow-hidden shadow rounded-lg card"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-white">
                            {service.name}
                          </h4>
                        </div>
                        <p className="mt-2 text-sm text-gray-300">
                          {service.description}
                        </p>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-lg font-semibold text-purple-400">
                            ${service.price}
                          </span>
                          <span className="text-sm text-gray-400">
                            {service.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No services available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 relative">
            <h3 className="text-lg leading-6 font-medium text-white">
              Available Slots
            </h3>
            <Button
              className="absolute top-5 right-4"
              aria-label="See all slots"
              onClick={() => {
                navigate("/slots");
              }}
            >
              See all
            </Button>
            <p className="mt-1 max-w-2xl text-sm text-white">
              Your available time slots.
            </p>
          </div>
          <div className="border-t border-gray-900">
            <div className="px-4 py-5 sm:p-6">
              {user.Slots && user.Slots.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {user.Slots.filter((slot) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); 

                    const slotDate = new Date(slot.date);
                    slotDate.setHours(0, 0, 0, 0);

                    return slotDate.getTime() >= today.getTime();
                  }).map((slot) => {
                    const startDateTimeStr = `${slot.date}T${slot.start_time}`;
                    const endDateTimeStr = `${slot.date}T${slot.end_time}`;
                    const startDate = new Date(startDateTimeStr);
                    const endDate = new Date(endDateTimeStr);

                    return (
                      <div
                        key={slot.id}
                        className="card overflow-hidden rounded-lg"
                      >
                        <div className="px-4 py-5 sm:p-6">
                          <p className="text-lg font-medium text-white">
                            {startDate.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {endDate.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="mt-1 text-sm text-gray-300">
                            {formatDateLabel(startDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No slots available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 relative">
            <h3 className="text-lg leading-6 font-medium text-white">
              Bookings
            </h3>
            <Button
              className="absolute top-5 right-4"
              aria-label="See all bookings"
              onClick={() => {
                navigate("/bookings");
              }}
            >
              See all
            </Button>
            <p className="mt-1 max-w-2xl text-sm text-white">
              Your recent bookings.
            </p>
          </div>
          <div className="border-t border-gray-900">
            <div className="px-4 py-5 sm:p-6">
              {user.Bookings && user.Bookings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const filteredBookings = user.Bookings.filter((booking) => {
                      const bookingDate = booking.end_datetime.split("T")[0];
                      const endDateTimeStr = `${bookingDate}T${booking.end_time}`;
                      const bookingEndDate = new Date(endDateTimeStr);
                      bookingEndDate.setHours(0, 0, 0, 0);

                      return bookingEndDate.getTime() >= today.getTime();
                    });

                    return filteredBookings.map((booking) => {
                      const bookingDate = booking.end_datetime.split("T")[0];
                      const startDateTimeStr = `${bookingDate}T${booking.start_time}`;
                      const endDateTimeStr = `${bookingDate}T${booking.end_time}`;

                      const startDate = new Date(startDateTimeStr);
                      const endDate = new Date(endDateTimeStr);

                      return (
                        <div
                          key={booking.id}
                          className="card overflow-hidden shadow rounded-lg"
                        >
                          <div className="px-4 py-5 sm:p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-lg font-medium text-white">
                                  {booking.service_name}
                                </h4>
                                <p className="mt-1 text-sm text-gray-300">
                                  <strong>
                                    {formatDateLabel(startDateTimeStr)}
                                  </strong>
                                  ,{" "}
                                  {startDate.toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -{" "}
                                  {endDate.toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : booking.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No bookings available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
