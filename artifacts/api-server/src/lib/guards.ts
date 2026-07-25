import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "@workspace/db";

/**
 * Gate a route to admins only via session or Firebase Auth SDK ID token.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.session.userId && req.session.isAdmin) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (decoded.admin === true || decoded.email === "admin@edubharat.in") {
        req.session.userId = typeof decoded.uid === "number" ? decoded.uid : (parseInt(decoded.uid, 10) || 1);
        req.session.userEmail = decoded.email || "admin@edubharat.in";
        req.session.isAdmin = true;
        next();
        return;
      }
    } catch {
      // Invalid Firebase token
    }
  }

  res.status(403).json({ error: "Admin access required" });
}
