import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { signToken } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { AuthedRequest } from '../types';

export const register = asyncHandler(async (req, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('An account with this email already exists', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken({ userId: user._id.toString(), email: user.email });
  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, xp: user.xp, level: user.level },
    },
  });
});

export const login = asyncHandler(async (req, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await user.comparePassword(password);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const token = signToken({ userId: user._id.toString(), email: user.email });
  res.json({
    success: true,
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, xp: user.xp, level: user.level },
    },
  });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new AppError('User not found', 404);
  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      xp: user.xp,
      level: user.level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      dailyGoalMinutes: user.dailyGoalMinutes,
      createdAt: user.createdAt,
    },
  });
});
