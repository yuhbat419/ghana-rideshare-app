const successResponse = (res, message, data = null, statusCode = 200, meta = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

const errorResponse = (res, message, statusCode = 500, errors = null, code = null) => {
  const response = { success: false, message };
  if (errors !== null) response.errors = errors;
  if (code !== null) response.code = code;
  return res.status(statusCode).json(response);
};

module.exports = { successResponse, errorResponse };