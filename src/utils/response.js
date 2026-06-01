const ok  = (res, data = {}, message = 'Success', status = 200) =>
  res.status(status).json({ success: true,  message, data });

const err = (res, message = 'Error', status = 400, errors = null) =>
  res.status(status).json({ success: false, message, ...(errors && { errors }) });

module.exports = { ok, err };
