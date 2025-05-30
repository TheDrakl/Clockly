import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import Button from "../components/PurpleButton.jsx";

function BookingVerify() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const submitBooking = async () => {
      try {
        const response = await api.get(`/api/bookings/book/verify/${token}/`);
        if (response.status === 200) {
          setMessage(
            response.data.message || "Your booking has been confirmed!"
          );
          localStorage.setItem("verified", true);
          setStatus("success");
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.error || "Verification failed. Please try again."
        );
      }
    };

    submitBooking();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="bg-bg-card shadow-xl rounded-2xl p-8 max-w-lg w-full text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin mx-auto mb-4 w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full"></div>
            <h2 className="text-lg font-medium text-white">
              Verifying your booking...
            </h2>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-green-500 text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
            <p className="text-gray-600">{message}</p>
            <Button
              aria-label="See all bookings"
              className="mt-4"
              onClick={() => {
                navigate("/");
              }}
            >
              Return to Home
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-white">{message}</p>
            <Button
              aria-label="See all bookings"
              className="mt-4"
              onClick={() => {
                navigate("/");
              }}
            >
              Return to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default BookingVerify;
