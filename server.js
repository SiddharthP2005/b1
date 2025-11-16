const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

app.use(cors());
app.use(express.json());

// Helpers
function encodeUser(u) {
  return Buffer.from(u, "utf8").toString("base64url");
}
function userFile(u) {
  return path.join(DATA_DIR, encodeUser(u) + ".json");
}
function validUsername(u) {
  if (!u) return false;
  if (u.length < 4 || u.length > 10) return false;
  if (!/[^A-Za-z0-9]/.test(u)) return false;
  return true;
}
function loadTasks(u) {
  const file = userFile(u);
  if (!fs.existsSync(file)) return [];
  try {
    const txt = fs.readFileSync(file, "utf8").trim();
    if (!txt) return [];
    return JSON.parse(txt);
  } catch {
    return [];
  }
}
function saveTasks(u, tasks) {
  fs.writeFileSync(userFile(u), JSON.stringify(tasks, null, 2));
}

// REGISTER
app.post("/register", (req, res) => {
  const { username } = req.body;
  if (!validUsername(username)) {
    return res.status(400).json({ error: "Invalid username" });
  }
  if (fs.existsSync(userFile(username))) {
    return res.status(409).json({ error: "User already exists" });
  }
  saveTasks(username, []);
  return res.json({ ok: true });
});

// SIGNIN
app.post("/signin", (req, res) => {
  const { username } = req.body;
  if (!validUsername(username)) {
    return res.status(400).json({ error: "Invalid username" });
  }
  if (!fs.existsSync(userFile(username))) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ ok: true });
});

// GET TASKS
app.get("/tasks/:username", (req, res) => {
  const user = req.params.username;
  if (!validUsername(user)) return res.status(400).json({ error: "Invalid user" });
  return res.json(loadTasks(user));
});

// ADD TASK
app.post("/tasks/:username", (req, res) => {
  const user = req.params.username;
  let tasks = loadTasks(user);

  const task = {
    id: Date.now(),
    title: req.body.title,
    date: req.body.date,
    alarm: req.body.alarm,
    done: req.body.done,
    score: req.body.score
  };

  tasks.push(task);
  saveTasks(user, tasks);
  return res.json(task);
});

// UPDATE TASK
app.put("/tasks/:username/:id", (req, res) => {
  const user = req.params.username;
  let tasks = loadTasks(user);
  const id = Number(req.params.id);

  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Task not found" });

  tasks[index] = { ...tasks[index], ...req.body };
  saveTasks(user, tasks);
  return res.json(tasks[index]);
});

// DELETE TASK
app.delete("/tasks/:username/:id", (req, res) => {
  const user = req.params.username;
  let tasks = loadTasks(user);
  const id = Number(req.params.id);

  tasks = tasks.filter(t => t.id !== id);
  saveTasks(user, tasks);
  return res.json({ ok: true });
});

app.listen(PORT, () => console.log("Backend running on port", PORT));
