import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import MainRoutes from "./routes/routeManager.js";
import path from "path";
import { fileURLToPath } from "url";
import { statusCode } from "./utils/api.response.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT, 10);
const HOST = process.env.HOST;
const DB_CONNECTION = process.env.CONNECTION;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

MainRoutes.forEach((route) => {
  app.use("/", route);
});

app.get("/image/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, "uploads", filename);

  fs.access(filepath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(statusCode.NOT_FOUND).send("File not found");
    }
    res.sendFile(filepath);
  });
});

const databaseConnection = async () => {
  try {
    await mongoose.connect(DB_CONNECTION);
    console.log("Connected to database");
  } catch (error) {
    console.error("Error while connecting to database:", error);
    process.exit(1);
  }
};

databaseConnection();

app.listen(PORT, HOST, () => {
  console.log(`App listening at http://${HOST}:${PORT}`);
});
