import jwt from "jsonwebtoken";

export const optionalAuthMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user info to the request
    } catch (err) {
      // Token is invalid, but we proceed
      console.error("Invalid token, proceeding as guest:", err.message);
    }
  }
  
  next(); // Always proceed to the next middleware/route handler
};
