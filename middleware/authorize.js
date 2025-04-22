// middleware/authorize.js
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // 1. Verify user exists in request
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "User authentication required"
        });
      }

      // 2. Validate allowedRoles parameter
      if (!Array.isArray(allowedRoles)) {
        return res.status(500).json({
          success: false,
          error: "Invalid authorization configuration"
        });
      }

      // 3. Check role permissions
      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        // Security: Avoid revealing roles in production
        const errorMessage = process.env.NODE_ENV === 'production'
          ? "Insufficient permissions"
          : `Access forbidden. Required roles: ${allowedRoles.join(', ')}`;

        return res.status(403).json({
          success: false,
          error: errorMessage
        });
      }

      // 4. Proceed if authorized
      next();

    } catch (error) {
      console.error('Authorization Error:', error);
      
      // Enhanced error details for development
      const errorResponse = {
        success: false,
        error: "Authorization check failed"
      };

      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.message = error.message;
      }

      res.status(500).json(errorResponse);
    }
  };
};