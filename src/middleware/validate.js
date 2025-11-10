import { fail } from "../utils/response.js";

export const requireFields = (fields = []) => (req, res, next) => {
  const missing = fields.filter((f) => req.body?.[f] === undefined);
  if (missing.length) {
    return fail(res, 400, "VALIDATION_ERROR", "Missing required fields", { missing });
  }
  next();
};
