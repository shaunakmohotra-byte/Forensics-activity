const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ensure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ================= STORAGE =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// ================= DATABASE =================
let cases = [];

// ================= CREATE CASE =================
app.post("/add-case", (req, res) => {
  const { name, details, stage } = req.body;

  if (!name) return res.status(400).json({ error: "Name required" });

  const newCase = {
    id: Date.now().toString(),
    name,
    details,
    stage,
    status: "Open",
    investigator: "Unassigned",
    evidence: [],
    notes: [],
    linkedCases: []
  };

  cases.push(newCase);
  res.json(newCase);
});

// ================= GET ALL =================
app.get("/cases", (req, res) => res.json(cases));

// ================= GET ONE =================
app.get("/case/:id", (req, res) => {
  const found = cases.find(c => c.id === req.params.id);

  if (!found) return res.status(404).json({ error: "Case not found" });

  res.json(found);
});

// ================= UPLOAD =================
app.post("/upload/:caseId", upload.array("images", 20), (req, res) => {
  const found = cases.find(c => c.id === req.params.caseId);

  if (!found) return res.status(404).json({ error: "Case not found" });

  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const files = req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    tag: "None"
  }));

  found.evidence.push(...files);

  console.log("Uploaded to case:", found.id, files.length);
  res.json(found);
});

// ================= TAG =================
app.post("/tag", (req, res) => {
  const { caseId, index, tag } = req.body;

  const found = cases.find(c => c.id === caseId);
  if (!found) return res.status(404).json({ error: "Case not found" });

  if (found.evidence[index]) {
    found.evidence[index].tag = tag;
  }

  res.json(found);
});

// ================= NOTES =================
app.post("/add-note", (req, res) => {
  const { caseId, text } = req.body;

  const found = cases.find(c => c.id === caseId);
  if (!found) return res.status(404).json({ error: "Case not found" });

  found.notes.push({
    text,
    time: new Date().toLocaleString()
  });

  res.json(found);
});

// ================= LINK CASES =================
app.post("/link-case", (req, res) => {
  const { caseId, targetId } = req.body;

  const c1 = cases.find(c => c.id === caseId);
  const c2 = cases.find(c => c.id === targetId);

  if (!c1 || !c2) {
    return res.status(404).json({ error: "Case not found" });
  }

  if (caseId === targetId) {
    return res.status(400).json({ error: "Cannot link same case" });
  }

  if (!c1.linkedCases.includes(targetId)) {
    c1.linkedCases.push(targetId);
  }

  if (!c2.linkedCases.includes(caseId)) {
    c2.linkedCases.push(caseId);
  }

  res.json(c1);
});
  // prevent duplicates
  if (!c1.linkedCases.includes(targetId)) {
    c1.linkedCases.push(targetId);
  }

  if (!c2.linkedCases.includes(caseId)) {
    c2.linkedCases.push(caseId);
  }

  res.json(c1);
});

// ================= STATUS =================
app.post("/status", (req, res) => {
  const { caseId, status } = req.body;

  const found = cases.find(c => c.id === caseId);
  if (!found) return res.status(404).json({ error: "Case not found" });

  found.status = status;

  res.json(found);
});

// ================= START =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
