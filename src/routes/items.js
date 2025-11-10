import express from "express";
import { v4 as uuid } from "uuid";
import { ok, fail } from "../utils/response.js";
import { requireFields } from "../middleware/validate.js";

const router = express.Router();

const db = {
  items: new Map()
};

const nameExists = (name) =>
  Array.from(db.items.values()).some((it) => !it.deleted && it.name === name);

// POST(1): 생성
router.post("/items", requireFields(["name", "qty"]), (req, res) => {
  const { name, qty, cause } = req.body;

  if (cause === "crash") {
    return fail(res, 500, "INTERNAL_ERROR", "Simulated server crash");
  }
  if (typeof qty !== "number" || qty < 0) {
    return fail(res, 400, "VALIDATION_ERROR", "qty must be a non-negative number");
  }
  if (nameExists(name)) {
    return fail(res, 409, "DUPLICATE", "Item with same name already exists");
  }

  const item = { id: uuid(), name, qty, version: 1, deleted: false, published: false };
  db.items.set(item.id, item);
  return ok(res, 201, { item }, "Created");
});

// POST(2): 복제
router.post("/items/:id/duplicate", (req, res) => {
  const src = db.items.get(req.params.id);
  if (!src || src.deleted) {
    return fail(res, 404, "NOT_FOUND", "Source item not found");
  }
  const copy = { id: uuid(), name: `${src.name}-copy`, qty: src.qty, version: 1, deleted: false, published: false };
  db.items.set(copy.id, copy);
  return ok(res, 201, { item: copy }, "Duplicated");
});

// GET(1): 목록
router.get("/items", (req, res) => {
  if (req.query.fail === "dep") {
    return fail(res, 503, "DEPENDENCY_UNAVAILABLE", "Upstream service unavailable");
  }
  const items = Array.from(db.items.values()).filter((it) => !it.deleted);
  return ok(res, 200, { items });
});

// GET(2): 단건
router.get("/items/:id", (req, res) => {
  const item = db.items.get(req.params.id);
  if (!item || item.deleted) {
    return fail(res, 404, "NOT_FOUND", "Item not found");
  }
  return ok(res, 200, { item });
});

// PUT(1): 수정
router.put("/items/:id", (req, res) => {
  const { name, qty, expectedVersion } = req.body ?? {};
  const item = db.items.get(req.params.id);
  if (!item || item.deleted) {
    return fail(res, 404, "NOT_FOUND", "Item not found");
  }
  if (expectedVersion && expectedVersion !== item.version) {
    return fail(res, 409, "VERSION_CONFLICT", "Version mismatch");
  }
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return fail(res, 400, "VALIDATION_ERROR", "name must be a non-empty string");
    }
    if (name !== item.name && nameExists(name)) {
      return fail(res, 409, "DUPLICATE", "Item with same name already exists");
    }
    item.name = name;
  }
  if (qty !== undefined) {
    if (typeof qty !== "number" || qty < 0) {
      return fail(res, 400, "VALIDATION_ERROR", "qty must be a non-negative number");
    }
    item.qty = qty;
  }
  item.version += 1;
  return ok(res, 200, { item }, "Updated");
});

// PUT(2): 발행
router.put("/items/:id/publish", (req, res) => {
  const item = db.items.get(req.params.id);
  if (!item || item.deleted) return fail(res, 404, "NOT_FOUND", "Item not found");
  if (item.published) return fail(res, 400, "INVALID_STATE", "Already published");
  item.published = true;
  item.version += 1;
  return ok(res, 200, { item }, "Published");
});

// DELETE(1): 소프트 삭제
router.delete("/items/:id", (req, res) => {
  const item = db.items.get(req.params.id);
  if (!item || item.deleted) return fail(res, 404, "NOT_FOUND", "Item not found or already deleted");
  item.deleted = true;
  item.version += 1;
  return ok(res, 200, { id: item.id }, "Soft-deleted");
});

// DELETE(2): 하드 삭제
router.delete("/items/:id/force", (req, res) => {
  const existed = db.items.has(req.params.id);
  if (!existed) return fail(res, 404, "NOT_FOUND", "Item not found");
  db.items.delete(req.params.id);
  return ok(res, 200, { id: req.params.id }, "Hard-deleted");
});

export default router;
