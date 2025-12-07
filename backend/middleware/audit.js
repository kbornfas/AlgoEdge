import pool from '../config/database.js';

export const auditLog = async (userId, action, details = {}, req = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        action,
        JSON.stringify(details),
        req?.ip || null,
        req?.get('user-agent') || null
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

export const auditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
      if (req.user && res.statusCode < 400) {
        auditLog(req.user.id, action, {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body
        }, req);
      }
      return originalJson(data);
    };
    
    next();
  };
};
