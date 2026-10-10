/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies caller permissions via X-User-Role HTTP header.
 * Quota Management and Increase Request Planning Control Plane
 */

/**
 * Enforces required user roles on protected routes.
 *
 * @param {string[]} allowedRoles - Array of permitted roles (e.g., ['Admin'])
 */
function requireRole(allowedRoles = ['Admin']) {
  return (req, res, next) => {
    const rawRole = req.headers['x-user-role'] || 'Developer';
    const userRole = String(rawRole).trim();

    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
    const isAuthorized = normalizedAllowed.includes(userRole.toLowerCase());

    if (!isAuthorized) {
      console.warn(
        `[RBAC ACCESS DENIED] Unauthorized access attempt to ${req.method} ${req.originalUrl}. ` +
        `User Role: '${userRole}'. Required: [${allowedRoles.join(', ')}]`
      );

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Role '${userRole}' does not possess required administrative permissions for this operation.`,
        requiredRoles: allowedRoles,
        currentRole: userRole,
      });
    }

    req.userRole = userRole;
    next();
  };
}

module.exports = {
  requireRole,
};
