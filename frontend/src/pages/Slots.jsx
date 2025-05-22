import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit } from "react-icons/fa";
import { formatDate } from "../utils/format";
import api from "../api/api";
import ErrorMessage from "../components/ErrorMessage.jsx";
import formatDateLabel from "../utils/formatDate.js";

const Slots = () => {
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    start_time: "",
    end_time: "",
    is_recurring: false,
    recurrence_pattern: "weekly"
  });
  const [editingSlot, setEditingSlot] = useState(null);
  const [originalSlot, setOriginalSlot] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await api.get("/api/client/availability-slots/");
        setSlots(response.data);
      } catch (error) {
        setError(error.message);
        console.error(error);
      }
    };

    fetchSlots();
  }, [navigate]);

  const filterSlots = (isUpcoming) => {
    if (!slots) return [];

    return slots.filter((slot) =>
      isUpcoming
        ? new Date(`${slot.date}T${slot.end_time}`) > new Date()
        : new Date(`${slot.date}T${slot.end_time}`) <= new Date()
    );
  };

  const isSlotChanged = (a, b) => {
    return Object.keys(a).some((key) => a[key] !== b[key]);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/api/client/availability-slots/", {
        date: newSlot.date,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        is_recurring: newSlot.is_recurring,
        recurrence_pattern: newSlot.recurrence_pattern
      });

      setShowForm(false);
      setNewSlot({
        date: "",
        start_time: "",
        end_time: "",
        is_recurring: false,
        recurrence_pattern: "weekly"
      });

      const updated = await api.get("/api/client/availability-slots/");
      setSlots(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditSlot = (slot) => {
    const formattedSlot = {
      id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_recurring: slot.is_recurring || false,
      recurrence_pattern: slot.recurrence_pattern || "weekly"
    };

    setEditingSlot(formattedSlot);
    setOriginalSlot(formattedSlot);
    setShowEdit(true);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();

    if (!isSlotChanged(originalSlot, editingSlot)) {
      setShowEdit(false);
      return;
    }

    try {
      await api.put(`/api/client/availability-slots/${editingSlot.id}/`, {
        date: editingSlot.date,
        start_time: editingSlot.start_time,
        end_time: editingSlot.end_time,
        is_recurring: editingSlot.is_recurring,
        recurrence_pattern: editingSlot.recurrence_pattern
      });

      setShowEdit(false);

      const updated = await api.get("/api/client/availability-slots/");
      setSlots(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSlot = async (e) => {
    try {
      await api.delete(`/api/client/availability-slots/${editingSlot.id}/`);

      setShowEdit(false);
      setShowDelete(false);

      const updated = await api.get("/api/client/availability-slots/");
      setSlots(updated.data);
    } catch (err) {
      setError(err.message);
    }
  };

  function onClose() {
    setShowDelete(false);
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[100rem] mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Your Availability Slots
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-text-main sm:mt-4">
            Manage your available time slots
          </p>
        </div>

        {error && <ErrorMessage error={error} />}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaPlus className="mr-2" />
            Add New Slot
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-bg bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-bg p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Add New Slot</h3>
              <form onSubmit={handleFormSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white">
                    Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newSlot.date}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-white">
                      Start Time
                    </label>
                    <input
                      type="time"
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newSlot.start_time}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, start_time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">
                      End Time
                    </label>
                    <input
                      type="time"
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newSlot.end_time}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, end_time: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="mb-4 flex items-center">
                  <input
                    id="is-recurring"
                    name="is-recurring"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={newSlot.is_recurring}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, is_recurring: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="is-recurring"
                    className="ml-2 block text-sm text-white"
                  >
                    Recurring slot
                  </label>
                </div>

                {newSlot.is_recurring && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white">
                      Recurrence Pattern
                    </label>
                    <select
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newSlot.recurrence_pattern}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, recurrence_pattern: e.target.value })
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowForm(false)}
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

        {showEdit && editingSlot && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-bg p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Edit Slot</h3>
              <form onSubmit={handleUpdateSlot}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white">
                    Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={editingSlot.date}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-white">
                      Start Time
                    </label>
                    <input
                      type="time"
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editingSlot.start_time}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, start_time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">
                      End Time
                    </label>
                    <input
                      type="time"
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editingSlot.end_time}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, end_time: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="mb-4 flex items-center">
                  <input
                    id="edit-is-recurring"
                    name="edit-is-recurring"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={editingSlot.is_recurring}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, is_recurring: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="edit-is-recurring"
                    className="ml-2 block text-sm text-white"
                  >
                    Recurring slot
                  </label>
                </div>

                {editingSlot.is_recurring && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white">
                      Recurrence Pattern
                    </label>
                    <select
                      className="mt-1 block w-full border bg-bg-card border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editingSlot.recurrence_pattern}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, recurrence_pattern: e.target.value })
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowEdit(false)}
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
                Are you sure you want to delete this slot?
              </h3>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSlot}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4 text-white">
            Upcoming Slots
          </h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filterSlots(true).map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onEdit={() => handleEditSlot(slot)}
              />
            ))}
            {filterSlots(true).length === 0 && (
              <p className="text-text-main">No upcoming slots</p>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4 text-white">
            Past Slots
          </h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filterSlots(false).map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onEdit={() => handleEditSlot(slot)}
                isPast
              />
            ))}
            {filterSlots(false).length === 0 && (
              <p className="text-text-main">No past slots</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SlotCard = ({ slot, onEdit, isPast = false }) => {
  return (
    <div
      className={`card overflow-hidden shadow rounded-lg ${
        isPast ? "opacity-80" : ""
      }`}
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-indigo-600"
            onClick={onEdit}
          >
            <FaEdit size={18} />
          </button>
        </div>
        <h3 className="text-lg font-medium text-white">
          {formatDateLabel(slot.date)}
        </h3>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-text-main">
            <span className="font-medium text-white">Time:</span>{" "}
            {slot.start_time} - {slot.end_time}
          </p>
          <p className="text-sm text-text-main">
            <span className="font-medium text-white">Recurring:</span>{" "}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                slot.is_recurring
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {slot.is_recurring ? "Yes" : "No"}
            </span>
          </p>
          {slot.is_recurring && (
            <p className="text-sm text-text-main">
              <span className="font-medium text-white">Pattern:</span>{" "}
              {slot.recurrence_pattern}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Slots;