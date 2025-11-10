import express from "express";
import { logger } from "./middleware/logger.js";
import itemsRouter from "./routes/items.js";
import { fail } from "./utils/response.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(logger);
app.use("/", itemsRouter);

app.get("/health", (req, res) => res.json({ status: "success", data: { ok: true } }));

app.use((req, res) => fail(res, 404, "NOT_FOUND", "Route not found"));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return fail(res, 500, "INTERNAL_ERROR", "Unhandled server error");
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
