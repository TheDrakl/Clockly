import React, { useState, useRef, useEffect } from "react";
import api from "../api/api";
import { FaTrash } from "react-icons/fa";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !activeSessionId) {
      api
        .get("/api/chat/sessions/")
        .then((res) => setSessions(res.data))
        .catch(console.error);
    }
  }, [isOpen, activeSessionId]);

  useEffect(() => {
    if (activeSessionId) {
      api
        .get(`/api/chat/${activeSessionId}/history/`)
        .then((res) => setMessages(res.data))
        .catch(console.error);
    }
  }, [activeSessionId]);

  const sendMessage = async () => {
    if (!input.trim() || !activeSessionId) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, sender: "user", message: userMessage },
    ]);
    setInput("");

    try {
      const res = await api.post(`/api/chat/${activeSessionId}/send-msg/`, {
        message: userMessage,
      });

      const aiReply = res.data.response_msg;

      setMessages((prev) => [
        ...prev,
        { id: prev.length + 2, sender: "bot", message: aiReply },
      ]);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, last_message: aiReply } : s
        )
      );
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewSession = async () => {
    try {
      const res = await api.post("/api/chat/sessions/");
      const newSession = res.data;
      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(newSession.session_id);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
  };

  const deleteSession = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/chat/${id}/history/`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="bg-purple-600 text-white py-4 px-[1.2rem] rounded-full shadow-lg hover:bg-purple-700 transition"
        >
          💬
        </button>
      )}

      {isOpen && !activeSessionId && (
        <div className="w-96 h-[32rem] bg-white rounded-lg shadow-xl flex flex-col border border-gray-300">
          <header className="bg-purple-600 text-white p-3 rounded-t-lg font-semibold flex justify-between items-center">
            <span>Choose Chat Session</span>
            <button
              onClick={handleCloseChat}
              className="text-white hover:text-gray-300"
            >
              ✖️
            </button>
          </header>

          <div className="flex-grow overflow-y-auto">
            {sessions.length === 0 && (
              <div className="p-4 text-gray-500">No chat sessions found.</div>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex justify-between items-center border-b text-black border-gray-200 px-3 py-2 hover:bg-purple-100 transition"
              >
                <button
                  onClick={() => handleSelectSession(session.id)}
                  className="text-left flex-1"
                >
                  <div className="font-medium">
                    {session.title || `Session ${session.id}`}
                  </div>
                  <div className="text-sm text-gray-600 truncate w-full max-w-[18rem]">
                    {session.last_message || "No messages yet"}
                  </div>
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                  title="Delete session"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={createNewSession}
            className="bg-purple-600 text-white m-3 rounded py-2 hover:bg-purple-700 transition"
          >
            + New Chat
          </button>
        </div>
      )}

      {isOpen && activeSessionId && (
        <div className="mt-2 w-96 h-[36rem] bg-white rounded-2xl shadow-xl flex flex-col">
          <header className="bg-purple-600 text-white p-3 rounded-t-lg font-semibold flex justify-between items-center">
            <span>{`Session ${activeSessionId}`}</span>
            <button
              onClick={handleCloseChat}
              className="text-white hover:text-gray-300"
            >
              ✖️
            </button>
          </header>

          <div className="flex-grow p-4 overflow-y-auto space-y-2">
            {messages.map(({ id, sender, message }) => (
              <div
                key={id}
                className={`max-w-[75%] p-2 rounded ${
                  sender === "user"
                    ? "bg-purple-600 text-white ml-auto"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <footer className="p-3 border-t border-gray-300 flex space-x-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-purple-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 text-white px-4 rounded hover:bg-purple-700 transition"
            >
              Send
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
