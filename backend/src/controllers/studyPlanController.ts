import { Response } from 'express';
import { StudyPlan } from '../models/StudyPlan';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../types';
import { notFound, forbidden, badRequest } from '../utils/AppError';

export const listStudyPlans = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { range } = req.query;
  const filter: Record<string, unknown> = { user: req.user!.userId };
  if (range) filter.range = range;

  const plans = await StudyPlan.find(filter)
    .populate('tasks.subject', 'name color')
    .sort({ forDate: -1 })
    .limit(20);
  res.json({ success: true, data: plans });
});

export const getLatestStudyPlan = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const range = (req.query.range as string) || 'daily';
  const plan = await StudyPlan.findOne({ user: req.user!.userId, range })
    .populate('tasks.subject', 'name color')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: plan });
});

export const updateTask = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { planId, taskId } = req.params;
  const { completed, reschedule } = req.body;

  const plan = await StudyPlan.findById(planId);
  if (!plan) throw notFound('Study plan');
  if (plan.user.toString() !== req.user!.userId) throw forbidden();

  const task = plan.tasks.find((t) => t._id?.toString() === taskId);
  if (!task) throw notFound('Task');

  if (typeof completed === 'boolean') task.completed = completed;
  if (reschedule) {
    task.rescheduledFrom = plan.forDate;
    plan.forDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  if (typeof completed !== 'boolean' && !reschedule) {
    throw badRequest('Provide either "completed" or "reschedule"');
  }

  await plan.save();
  res.json({ success: true, data: plan });
});
