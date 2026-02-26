/**
 * Global error handler. Use next(err) in routes/controllers.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
      ...(err.errors && { errors: err.errors }),
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Something went wrong.' : message,
    ...(err.errors && { errors: err.errors }),
  });
};

/**
 * 404 handler for undefined routes.
 */
export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Not found: ${req.originalUrl}` });
};
