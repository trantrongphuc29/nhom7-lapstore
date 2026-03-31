function sendSuccess(res, data, statusCode = 200) {
  const payload = {
    success: true,
    data,
  };
  if (data && typeof data === "object" && data.message) {
    payload.message = data.message;
  }
  if (data && typeof data === "object" && data.pagination) {
    payload.pagination = data.pagination;
  }
  return res.status(statusCode).json(payload);
}

module.exports = { sendSuccess };
