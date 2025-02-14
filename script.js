import React, { useState, useEffect } from "react";
import axios from "axios";

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDesc, setEventDesc] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await axios.get("http://localhost:5000/api/events");
    setEvents(res.data);
  };

  const createEvent = async () => {
    await axios.post("http://localhost:5000/api/events", {
      name: eventName,
      date: eventDate,
      description: eventDesc,
    });
    setEventName("");
    setEventDate("");
    setEventDesc("");
    fetchEvents();
  };

  const deleteEvent = async (id) => {
    await axios.delete(`http://localhost:5000/api/events/${id}`);
    fetchEvents();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-4">Event Management</h1>
      <div className="bg-white p-6 shadow rounded-lg">
        <input
          type="text"
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <textarea
          placeholder="Event Description"
          value={eventDesc}
          onChange={(e) => setEventDesc(e.target.value)}
          className="border p-2 w-full mb-2"
        ></textarea>
        <button onClick={createEvent} className="bg-blue-500 text-white p-2 w-full">
          Create Event
        </button>
      </div>

      <h2 className="text-xl font-semibold mt-6">Upcoming Events</h2>
      {events.map((event) => (
        <div
          key={event._id}
          className="bg-gray-100 p-4 my-2 shadow rounded-lg flex justify-between"
        >
          <div>
            <h3 className="text-lg font-bold">{event.name}</h3>
            <p>{event.date}</p>
            <p>{event.description}</p>
          </div>
          <button onClick={() => deleteEvent(event._id)} className="bg-red-500 text-white px-4 py-2">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}