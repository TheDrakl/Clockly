import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/api";
import ErrorMessage from "../components/ErrorMessage.jsx";

function UserBook() {
  const { user_slug } = useParams();
  const [services, setServices] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeService, setActiveService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isServiceSelection, setIsServiceSelection] = useState(true);
  const [isDateSelection, setIsDateSelection] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const getServices = async () => {
      try {
        const response = await api.get(`/api/bookings/services/${user_slug}/`);
        setServices(response.data);
      } catch (error) {
        setErrorMessage("Error fetching services. Try again later");
        console.log(error);
      }
    };

    getServices();

    localStorage.setItem("verified", "false");

    const intervalId = setInterval(() => {
      if (localStorage.getItem("verified") === "true") {
        setSuccess(true);
        setSelectedVerification(false);
        clearInterval(intervalId);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user_slug]);

  const handleServiceClick = (service) => {
    setActiveService(service.id);
  };

  const handleContinue = async () => {
    if (isServiceSelection) {
      if (activeService === null) {
        setErrorMessage("Please select a service before continuing.");
        return;
      }
      setErrorMessage("");
      setIsServiceSelection(false);
      setIsDateSelection(true);
      return;
    }

    if (
      isDateSelection &&
      selectedDate instanceof Date &&
      !isNaN(selectedDate)
    ) {
      setIsLoadingSlots(true);
      try {
        const formattedDate = selectedDate.toLocaleDateString("en-CA");
        const response = await api.get(
          `/api/bookings/${user_slug}/${activeService}/${formattedDate}/`
        );

        if (response.data.length === 0) {
          setErrorMessage(
            "No available slots for this date. Please choose another date."
          );
          setAvailableSlots([]);
        } else {
          setErrorMessage("");
          setAvailableSlots(response.data);
          setIsDateSelection(false);
        }
      } catch (error) {
        setErrorMessage("Error fetching available slots");
        console.error(error);
      } finally {
        setIsLoadingSlots(false);
      }
    } else if (isDateSelection && !selectedDate) {
      setErrorMessage("Please select a date before continuing.");
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleBack = () => {
    if (availableSlots.length > 0) {
      setAvailableSlots([]);
      setIsDateSelection(true);
    } else if (isDateSelection) {
      setIsDateSelection(false);
      setSelectedDate(null);
    } else {
      setActiveService(null);
    }
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookingFormChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedDate = selectedDate.toLocaleDateString("en-CA");
      const response = await api.post(
        `/api/bookings/book/${user_slug}/${activeService}/${formattedDate}/`,
        {
          slot: selectedSlot.id,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          customer_name: bookingForm.customer_name,
          customer_email: bookingForm.customer_email,
          customer_phone: bookingForm.customer_phone || "",
          note: bookingForm.notes || null,
          confirmed: true,
          status: "pending",
        }
      );

      if (response.status === 201) {
        setErrorMessage("");
        setSelectedSlot(null);
        localStorage.setItem("verified", false);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Error creating booking"
      );
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {errorMessage?.trim() && (
          <ErrorMessage
            error={
              errorMessage || "Something went wrong. Please try again later!"
            }
          />
        )}

        {isServiceSelection &&
          !availableSlots.length && !success &&
          services.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white text-center">
                Select a Service
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`card rounded-lg shadow-sm overflow-hidden transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer
                                        ${
                                          activeService === service.id
                                            ? "ring-2 ring-indigo-500"
                                            : ""
                                        }`}
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.featured_img && (
                      <div className="aspect-w-16 aspect-h-9">
                        <img
                          className="w-full h-48 object-cover"
                          src={service.featured_img}
                          alt={service.name}
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white">
                        {service.name}
                      </h3>
                      <p className="mt-2 text-white">{service.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-lg font-medium text-purple-400">
                          ${service.price}
                        </span>
                        <span className="text-sm text-gray-400">
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleContinue}
                  disabled={activeService === null}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

        {isDateSelection && !availableSlots.length && (
          <div className="max-w-md mx-auto bg-bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Choose a Date
            </h2>
            <div className="space-y-6">
              <div className="rounded-lg p-4 items-center text-center">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  inline
                  className="w-full"
                />
              </div>
              <div className="flex justify-between">
                <button
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleContinue}
                  disabled={!selectedDate || isLoadingSlots}
                >
                  {isLoadingSlots ? "Loading..." : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!success && availableSlots.length > 0 && !selectedSlot && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              Available Time Slots
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableSlots.map((slot, index) => (
                <div
                  key={index}
                  className="card p-4 rounded-lg shadow-sm text-center cursor-pointer"
                  onClick={() => handleSlotClick(slot)}
                >
                  <p className="text-lg font-medium text-text-gray">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={handleBack}
              >
                Back to Date Selection
              </button>
            </div>
          </div>
        )}

        {selectedSlot && (
          <div className="max-w-md mx-auto bg-bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Book Your Appointment
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSelectedVerification(true);
                setSelectedSlot(false);
                setAvailableSlots(false);
                setIsDateSelection(false);

                handleBookingSubmit(e);
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-white">
                  Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={bookingForm.customer_name}
                  onChange={handleBookingFormChange}
                  className="mt-1 block w-full p-[0.1rem] rounded-md bg-bg-card border border-bg-card shadow-sm outline-none text-text-gray"
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">
                  Email *
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={bookingForm.customer_email}
                  onChange={handleBookingFormChange}
                  className="mt-1 block w-full p-[0.1rem] rounded-md bg-bg-card border border-bg-card shadow-sm outline-none text-text-gray"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">
                  Phone
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={bookingForm.customer_phone}
                  onChange={handleBookingFormChange}
                  className="mt-1 block w-full p-[0.1rem] rounded-md bg-bg-card border border-bg-card shadow-sm outline-none text-text-gray"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleBookingFormChange}
                  className="mt-1 block w-full p-[0.1rem] rounded-md bg-bg-card border border-bg-card shadow-sm outline-none text-text-gray"
                  rows="3"
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Back to Slots
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedVerification && (
          <div className="max-w-md mx-auto bg-bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Email Verification
            </h2>
            <div className="text-white space-y-4">
              <p>
                We have sent an email to:{" "}
                <span className="font-semibold">
                  {bookingForm.customer_email}
                </span>
              </p>
              <p>Please, confirm it to proceed with your booking.</p>
              <p>If you don’t see the email, check your spam folder.</p>
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-md mx-auto rounded-lg shadow-sm p-6">
            <div className="mb-4 bg-bg border-l-4 border-green-400 p-4">
              <div className="flex">
                </div>
                <div className="ml-3">
                  <p className="text-lg text-green-700">
                    Booking successful! 🎉
                  </p>
                  <p className="text-sm text-white mt-2">
                    Your booking has been verified! You will receive an email
                    with all the details shortly.
                  </p>
              </div>
            </div>
          </div>
        )}

        {services.length === 0 &&
          !isDateSelection &&
          !availableSlots.length && (
            <div className="text-center py-12">
              <p className="text-2xl text-main">
                No services found. Please try again later.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

export default UserBook;
