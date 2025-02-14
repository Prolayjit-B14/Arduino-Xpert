const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// User Schema & Model
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", UserSchema);

// Event Schema & Model
const EventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  organizer: String,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});
const Event = mongoose.model("Event", EventSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Routes
app.get("/", (req, res) => {
  res.send("Seamless Event Management System API");
});

// User Registration
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User Registered Successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error registering user", error: err });
  }
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, userId: user._id });
});

// Create Event
app.post("/events", authenticateToken, async (req, res) => {
  const { title, description, date } = req.body;
  try {
    const event = new Event({ title, description, date, organizer: req.user.id });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: "Error creating event", error: err });
  }
});

// Get All Events
app.get("/events", async (req, res) => {
  try {
    const events = await Event.find().populate("participants");
    res.json(events);
  } catch (err) {
    res.status(400).json({ message: "Error fetching events", error: err });
  }
});

// Register for an Event
app.post("/events/:id/register", authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    event.participants.push(req.user.id);
    await event.save();
    res.json({ message: "Registered Successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error registering for event", error: err });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));