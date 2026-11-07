export function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "failed",
        message: "You are not authorized to perform this action",
      });
    }

    next();
  };
}