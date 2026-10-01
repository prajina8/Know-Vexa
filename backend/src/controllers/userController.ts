import { Response } from 'express';
import { User } from '../models/User';
import { Achievement } from '../models/Achievement';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../types';
import { AppError } from '../utils/AppError';

export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { name, dailyGoalMinutes, avatarUrl } = req.body;
  const user = await User.findById(req.user!.userId);
  if (!user) throw new AppError('User not found', 404);

  if (name) user.name = name;
  if (typeof dailyGoalMinutes === 'number') user.dailyGoalMinutes = dailyGoalMinutes;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  await user.save();

  res.json({ success: true, data: user });
});

export const getAchievements = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const achievements = await Achievement.find({ user: req.user!.userId }).sort({ unlockedAt: -1 });
  res.json({ success: true, data: achievements });
});
