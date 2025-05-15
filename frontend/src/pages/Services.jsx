import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";

const Services = () => {
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/api/client/services/");
        setServices(response.data);
      } catch (error) {
        setError("Error fetching services");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchServices();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-lg text-gray-600">Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
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

  return (
    <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Your Services
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-text-main sm:mt-4">
            Manage your active services and subscriptions
          </p>
        </div>

        <div className="mt-12">
          {services.length === 0 ? (
            <div className="text-center">
              <p className="text-lg text-gray-600">No services found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="card overflow-hidden shadow rounded-lg"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-white">
                        {service.name}
                      </h3>
                      <button
                        onClick={() => navigate(`/services/${service.id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-2 max-w-xl text-sm text-white">
                      <p>{service.description}</p>
                    </div>
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
