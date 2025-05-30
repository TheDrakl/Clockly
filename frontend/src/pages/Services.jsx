import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit } from "react-icons/fa";
import api from "../api/api";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useAuth } from "../contexts/AuthContext";

const convertMinutesToHHMMSS = (minutes) => {
  const mins = parseInt(minutes, 10);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs.toString().padStart(2, "0")}:${remMins
    .toString()
    .padStart(2, "0")}:00`;
};

const convertHHMMSSToMinutes = (hhmmss) => {
  const [hours, minutes] = hhmmss.split(":").map(Number);
  return hours * 60 + minutes;
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    featured_img: null,
  });
  const [editingService, setEditingService] = useState(null);
  const [originalService, setOriginalService] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/api/client/services/");
        setServices(response.data);
      } catch (error) {
        setError(error.message);
        console.error(error);
      }
    };

    if (isAuthenticated) {
      fetchServices();
    }
  }, [isAuthenticated, navigate]);

  const isServiceChanged = (a, b) => {
    return Object.keys(a).some((key) => a[key] !== b[key]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewService({ ...newService, featured_img: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditingService({ ...editingService, featured_img: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", newService.name);
      formData.append("description", newService.description);
      formData.append("price", parseFloat(newService.price));
      formData.append("duration", convertMinutesToHHMMSS(newService.duration));
      if (newService.featured_img) {
        formData.append("featured_img", newService.featured_img);
      }

      const response = await api.post("/api/client/services/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setShowForm(false);
      setNewService({
        name: "",
        description: "",
        price: "",
        duration: "",
        featured_img: null,
      });
      setImagePreview(null);

      const updated = await api.get("/api/client/services/");
      setServices(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditService = (service) => {
    const formattedService = {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: convertHHMMSSToMinutes(service.duration),
      featured_img: service.featured_img || null,
    };

    setEditingService(formattedService);
    setOriginalService(formattedService);
    setEditImagePreview(service.featured_img || null);
    setShowEdit(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();

    if (!isServiceChanged(originalService, editingService)) {
      setShowEdit(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", editingService.name);
      formData.append("description", editingService.description);
      formData.append("price", parseFloat(editingService.price));
      formData.append(
        "duration",
        convertMinutesToHHMMSS(editingService.duration)
      );

      // Only append the image if it's a file (new upload)
      if (editingService.featured_img instanceof File) {
        formData.append("featured_img", editingService.featured_img);
      } else if (editingService.featured_img === null) {
        // If image was removed
        formData.append("featured_img", "");
      }

      await api.put(`/api/client/services/${editingService.id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setShowEdit(false);
      setEditImagePreview(null);

      const updated = await api.get("/api/client/services/");
      setServices(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteService = async (e) => {
    try {
      await api.delete(`/api/client/services/${editingService.id}/`);

      setShowEdit(false);
      setShowDelete(false);
      setEditImagePreview(null);

      const updated = await api.get("/api/client/services/");
      setServices(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  function onClose() {
    setShowDelete(false);
  }

  const removeImage = () => {
    setNewService({ ...newService, featured_img: null });
    setImagePreview(null);
  };

  const removeEditImage = () => {
    setEditingService({ ...editingService, featured_img: null });
    setEditImagePreview(null);
  };

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[100rem] mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Your Services
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-text-main sm:mt-4">
            Manage your services and pricing
          </p>
        </div>

        {error && <ErrorMessage error={error} />}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaPlus className="mr-2" />
            Add New Service
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-bg bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-bg p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Add New Service</h3>
              <form onSubmit={handleFormSubmit}>
                {[
                  { label: "Name", key: "name", type: "text" },
                  { label: "Description", key: "description", type: "text" },
                  { label: "Price ($)", key: "price", type: "number" },
                ].map(({ label, key, type }) => (
                  <div className="mb-4" key={key}>
                    <label className="block text-sm font-medium text-white">
                      {label}
                    </label>
                    <input
                      type={type}
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newService[key]}
                      onChange={(e) =>
                        setNewService({ ...newService, [key]: e.target.value })
                      }
                      required
                    />
                  </div>
                ))}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter duration in minutes"
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newService.duration}
                    onChange={(e) =>
                      setNewService({ ...newService, duration: e.target.value })
                    }
                    required
                    min={1}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white">
                    Service Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-32 w-full object-contain rounded"
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        onClick={removeImage}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      setShowForm(false);
                      setImagePreview(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEdit && editingService && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-bg p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Edit Service</h3>
              <form onSubmit={handleUpdateService}>
                {[
                  { label: "Name", key: "name", type: "text" },
                  { label: "Description", key: "description", type: "text" },
                  { label: "Price ($)", key: "price", type: "number" },
                  { label: "Duration (min)", key: "duration", type: "number" },
                ].map(({ label, key, type }) => (
                  <div className="mb-4" key={key}>
                    <label className="block text-sm font-medium text-white">
                      {label}
                    </label>
                    <input
                      type={type}
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editingService[key] || ""}
                      onChange={(e) =>
                        setEditingService({
                          ...editingService,
                          [key]: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                ))}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white">
                    Service Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                    onChange={handleEditImageChange}
                  />
                  {editImagePreview && (
                    <div className="mt-2 relative">
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="h-32 w-full object-contain rounded"
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        onClick={removeEditImage}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      setShowEdit(false);
                      setEditImagePreview(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="bg-red-600 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => setShowDelete(true)}
                  >
                    Delete
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Are you sure you want to delete this service?
              </h3>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteService}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => handleEditService(service)}
            />
          ))}
          {services.length === 0 && (
            <p className="text-text-main">No services found</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ServiceCard = ({ service, onEdit }) => {
  return (
    <div className="card overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-indigo-600"
            onClick={onEdit}
          >
            <FaEdit size={18} />
          </button>
        </div>
        {service.featured_img && (
          <div className="mb-4 aspect-w-16 aspect-h-9">
            <img
              className="w-full h-48 object-cover rounded-md"
              src={service.featured_img}
              alt={service.name}
            />
          </div>
        )}
        <h3 className="text-lg font-medium text-white">{service.name}</h3>
        <p className="mt-2 text-sm text-text-main">{service.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-lg font-semibold text-purple-400">
            ${service.price}
          </span>
          <span className="text-sm text-gray-400">{service.duration}</span>
        </div>
      </div>
    </div>
  );
};

export default Services;
