export const ok = (res, httpCode = 200, data = {}, message) =>
  res.status(httpCode).json({
    status: "success",
    ...(message ? { message } : {}),
    data
  });

export const fail = (res, httpCode = 400, code = "BAD_REQUEST", message = "Bad request", details) =>
  res.status(httpCode).json({
    status: "error",
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
