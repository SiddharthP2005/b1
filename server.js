const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----------------------------
//  CONNECT TO MONGODB ATLAS
// ----------------------------
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));


// ----------------------------
//  SCHEMAS
// ----------------------------
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }
});

const TaskSchema = new mongoose.Schema({
  username: String,
  title: String,
  date: String,
  time: String,
  alarm: Boolean,
  done: Boolean,
  score: Number
});

const User = mongoose.model("User", UserSchema);
const Task = mongoose.model("Task", TaskSchema);


// ----------------------------
//  USER HELPERS
// ----------------------------
function validUsername(u) {
  return u && u.length >= 4 && u.length <= 10 && /[^A-Za-z0-9]/.test(u);
}


// ----------------------------
//  AUTH ROUTES
// ----------------------------
app.post("/register", async (req, res) => {
  const { username } = req.body;

  if (!validUsername(username))
    return res.status(400).json({ error: "Invalid username" });

  const exists = await User.findOne({ username });
  if (exists)
    return res.status(409).json({ error: "User already exists" });

  await User.create({ username });
  return res.json({ ok: true });
});


app.post("/signin", async (req, res) => {
  const { username } = req.body;

  if (!validUsername(username))
    return res.status(400).json({ error: "Invalid username" });

  const exists = await User.findOne({ username });
  if (!exists)
    return res.status(404).json({ error: "User not found" });

  return res.json({ ok: true });
});


// ----------------------------
//  TASK ROUTES
// ----------------------------
app.get("/tasks/:username", async (req, res) => {
  const username = req.params.username;

  const tasks = await Task.find({ username });
  return res.json(tasks);
});


app.post("/tasks/:username", async (req, res) => {
  const username = req.params.username;

  const task = await Task.create({
    username,
    title: req.body.title,
    date: req.body.date,
    time: req.body.time,
    alarm: req.body.alarm,
    done: req.body.done,
    score: req.body.score
  });

  return res.json(task);
});


app.put("/tasks/:username/:id", async (req, res) => {
  const id = req.params.id;

  const updated = await Task.findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );

  if (!updated)
    return res.status(404).json({ error: "Task not found" });

  return res.json(updated);
});


app.delete("/tasks/:username/:id", async (req, res) => {
  const id = req.params.id;

  await Task.findByIdAndDelete(id);
  return res.json({ ok: true });
});


// ----------------------------
app.listen(PORT, () =>
  console.log("Backend running on port", PORT)
);

