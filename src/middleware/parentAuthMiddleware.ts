import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function parentAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET ?? '';
    const decoded = jwt.verify(token, secret) as any;
    if (decoded.role !== 'parent') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    (req as any).parent = { id: decoded.id, email: decoded.email, rfid_tag_uid: decoded.rfid_tag_uid };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}
