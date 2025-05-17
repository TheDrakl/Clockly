import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import ErrorMessage from "../components/ErrorMessage.jsx";

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
      <ErrorMessage error={error} />
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
