const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// STORAGE CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// IN-MEMORY DATABASE
let cases = [];

// CREATE CASE
app.post("/add-case", (req, res) => {
  const { name, details, stage } = req.body;

  const newCase = {
    id: Date.now().toString(),
    name,
    details,
    stage,
    evidence: []
  };

  cases.push(newCase);
  res.json(newCase);
});

// GET ALL CASES
app.get("/cases", (req, res) => {
  res.json(cases);
});

// UPLOAD MULTIPLE FILES TO CASE
app.post("/upload/:caseId", upload.array("images", 10), (req, res) => {
  const caseId = req.params.caseId;
  const found = cases.find(c => c.id === caseId);

  if (!found) return res.status(404).send("Case not found");

  const files = req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    tag: "None"
  }));

  found.evidence.push(...files);

  res.json(found);
});

// UPDATE TAG
app.post("/tag", (req, res) => {
  const { caseId, index, tag } = req.body;
  const found = cases.find(c => c.id === caseId);

  if (found && found.evidence[index]) {
    found.evidence[index].tag = tag;
  }

  res.json(found);
});

// GET SINGLE CASE
app.get("/case/:id", (req, res) => {
  const found = cases.find(c => c.id === req.params.id);
  res.json(found);
});

app.listen(3000, () => console.log("Server running on 3000"));