import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import coursesRouter from "./routes/courses.js";
import departmentsRouter from "./routes/departments.js";
import professorsRouter from "./routes/professors.js";
import reviewsRouter from "./routes/reviews.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import { loadUser } from "./auth/session.js";

const app = express();

// Browsers only send the session cookie to another origin when the server names that origin
// and allows credentials, so "any origin" (*) is not an option once there is sign-in.
// Allowed: any http://localhost:<port> (Vite, Live Server) plus CLIENT_ORIGIN, comma-separated.
const extraOrigins = (process.env.CLIENT_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin: string): boolean {
  return /^http:\/\/localhost(:\d+)?$/.test(origin) || extraOrigins.includes(origin);
}

app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
    credentials: true,
  })
);
app.use(express.json());
app.use(loadUser);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/professors", professorsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/users", usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Malformed JSON bodies and any other thrown errors come back as JSON instead of an HTML page.
app.use((err: { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({ error: status === 500 ? "Internal server error" : "Bad request" });
});

export default app;
