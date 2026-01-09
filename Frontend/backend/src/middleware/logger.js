export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    console.log('[REQUEST]', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    originalEnd.apply(this, args);
  };
  
  next();
};