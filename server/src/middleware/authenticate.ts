import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { COOKIE_CLEAR_OPTIONS } from '../config/cookie';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    // Verify user still exists
    const userExists = await User.exists({ _id: decoded.userId });
    if (!userExists) {
      res.clearCookie('token', COOKIE_CLEAR_OPTIONS);
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch {
    res.clearCookie('token', COOKIE_CLEAR_OPTIONS);
    res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
}
