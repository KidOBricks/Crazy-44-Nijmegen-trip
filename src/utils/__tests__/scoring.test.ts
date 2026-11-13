import { describe, expect, it } from 'vitest';
import type { Category, Submission, Task, Team } from '../../types/game';
import {
  buildEndGameAnalytics,
  computeTeamScore,
  partitionTasksForTeam,
  sortSubmissionsForAdmin,
} from '../scoring';

const makeTeam = (id: string, number: number, penaltyPoints = 0): Team => ({
  id,
  number,
  name: `Team ${number}`,
  color: '#4B1D8C',
  accessToken: `tok-${number}`,
  penaltyPoints,
  adjustments: [],
  createdAt: 100,
});

const makeTask = (id: string, number: number, categoryId = 'cat-1', points = 1): Task => ({
  id,
  number,
  title: `Task ${number}`,
  description: `Desc ${number}`,
  categoryId,
  points,
  createdAt: 100,
  updatedAt: 100,
});

const makeSub = (
  teamId: string,
  taskId: string,
  overrides: Partial<Submission> = {},
): Submission => ({
  id: `${teamId}_${taskId}`,
  teamId,
  taskId,
  taskNumber: 1,
  taskTitle: 'Task 1',
  categoryId: 'cat-1',
  teamName: 'Team 1',
  teamNumber: 1,
  teamColor: '#4B1D8C',
  mediaUrl: 'https://example.com/a.jpg',
  mediaPath: 'submissions/a.jpg',
  mediaType: 'image',
  status: 'unmarked',
  basePoints: 1,
  bonusPoints: 0,
  awardedPoints: 0,
  submittedAt: 1000,
  gradedAt: null,
  ...overrides,
});

describe('computeTeamScore', () => {
  it('sums base points, bonus points, and team penalties accurately', () => {
    const team = makeTeam('t1', 1, -5);
    const subs: Submission[] = [
      makeSub('t1', 'k1', {
        status: 'approved',
        basePoints: 1,
        bonusPoints: 0,
        awardedPoints: 1,
      }),
      makeSub('t1', 'k2', {
        status: 'approved',
        basePoints: 2,
        bonusPoints: 1,
        awardedPoints: 3,
      }),
      makeSub('t1', 'k3', {
        status: 'rejected',
        awardedPoints: 0,
      }),
      makeSub('t1', 'k4', {
        status: 'unmarked',
        awardedPoints: 0,
      }),
      makeSub('t2', 'k1', {
        status: 'approved',
        awardedPoints: 5,
      }),
    ];

    const summary = computeTeamScore(team, subs);
    expect(summary.basePoints).toBe(3);
    expect(summary.bonusPoints).toBe(1);
    expect(summary.adjustments).toBe(-5);
    expect(summary.totalScore).toBe(-1);
    expect(summary.approvedCount).toBe(2);
    expect(summary.pendingCount).toBe(1);
    expect(summary.rejectedCount).toBe(1);
  });
});

describe('sortSubmissionsForAdmin', () => {
  it('places graded submissions at the top and unmarked at the bottom', () => {
    const subs: Submission[] = [
      makeSub('t1', 'k1', { status: 'unmarked', submittedAt: 200 }),
      makeSub('t1', 'k2', { status: 'approved', gradedAt: 500 }),
      makeSub('t1', 'k3', { status: 'rejected', gradedAt: 700 }),
      makeSub('t1', 'k4', { status: 'unmarked', submittedAt: 900 }),
    ];

    const { graded, unmarked } = sortSubmissionsForAdmin(subs);
    expect(graded.map((s) => s.taskId)).toEqual(['k3', 'k2']);
    expect(unmarked.map((s) => s.taskId)).toEqual(['k4', 'k1']);
  });
});

describe('partitionTasksForTeam', () => {
  it('places unmarked & approved in Completed Tasks and todo & rejected in Tasks', () => {
    const tasks = [
      makeTask('k1', 1),
      makeTask('k2', 2),
      makeTask('k3', 3),
      makeTask('k4', 4),
    ];
    const subsByTask: Record<string, Submission> = {
      k2: makeSub('t1', 'k2', { status: 'unmarked' }),
      k3: makeSub('t1', 'k3', { status: 'approved', awardedPoints: 1 }),
      k4: makeSub('t1', 'k4', { status: 'rejected' }),
    };

    const { todoTasks, completedTasks } = partitionTasksForTeam(
      tasks,
      subsByTask,
    );
    expect(todoTasks.map((t) => t.id)).toEqual(['k1', 'k4']);
    expect(completedTasks.map((t) => t.id)).toEqual(['k2', 'k3']);
  });
});

describe('buildEndGameAnalytics', () => {
  it('ranks teams, computes category breakdowns, timeline, and task comparisons', () => {
    const teams = [makeTeam('t1', 1), makeTeam('t2', 2)];
    const categories: Category[] = [{ id: 'cat-1', name: 'Cat 1', order: 1 }];
    const tasks = [makeTask('k1', 1, 'cat-1', 1), makeTask('k2', 2, 'cat-1', 2)];
    const subs = [
      makeSub('t1', 'k1', {
        status: 'approved',
        awardedPoints: 1,
        submittedAt: 1000,
      }),
      makeSub('t2', 'k1', {
        status: 'approved',
        awardedPoints: 2,
        bonusPoints: 1,
        submittedAt: 1500,
      }),
      makeSub('t2', 'k2', {
        status: 'approved',
        awardedPoints: 2,
        submittedAt: 2000,
      }),
    ];

    const analytics = buildEndGameAnalytics(teams, tasks, categories, subs);
    expect(analytics.rankedTeams.map((r) => r.team.id)).toEqual(['t2', 't1']);
    expect(analytics.rankedTeams[0].totalScore).toBe(4);
    expect(analytics.rankedTeams[1].totalScore).toBe(1);
    expect(analytics.categoryBreakdowns[0].teamStats['t2'].completed).toBe(2);
    expect(analytics.submissionsByTaskId['k1']['t2'].awardedPoints).toBe(2);
    expect(
      analytics.timeline.find((s) => s.team.id === 't2')?.points.map((p) => p.cumulativeScore),
    ).toEqual([2, 4]);
  });
});
