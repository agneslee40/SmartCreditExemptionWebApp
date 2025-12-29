// Middleware to protect routes by verifying JWT access tokens. (Not used yet, but is prepared for future work)
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/*verifyToken
 *-Checks whether a valid JWT token is attached to the request.
 *-If valid, the decoded user information is attached to req.user*/

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // store user info in request
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};
