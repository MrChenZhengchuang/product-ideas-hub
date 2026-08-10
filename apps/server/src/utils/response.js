export function ok(res, data, message = 'ok') {
  res.json({
    success: true,
    message,
    data
  });
}

export function fail(res, message = 'server error', status = 500) {
  res.status(status).json({
    success: false,
    message
  });
}
