import type {
  Category,
  Submission,
  Task,
  Team,
  TeamScoreSummary,
} from '../types/game';

export function computeTeamScore(
  team: Team,
  submissions: Submission[],
): TeamScoreSummary {
  const teamSubs = submissions.filter((s) => s.teamId === team.id);
  let totalFromSubs = 0;
  let bonusPoints = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  for (const sub of teamSubs) {
    if (sub.status === 'approved') {
      approvedCount += 1;
      totalFromSubs += sub.awardedPoints;
      bonusPoints += sub.bonusPoints;
    } else if (sub.status === 'unmarked') {
      pendingCount += 1;
    } else if (sub.status === 'rejected') {
      rejectedCount += 1;
    }
  }

  const adjustments = team.penaltyPoints ?? 0;
  const basePoints = totalFromSubs - bonusPoints;

  return {
    team,
    basePoints,
    bonusPoints,
    adjustments,
    totalScore: totalFromSubs + adjustments,
    approvedCount,
    pendingCount,
    rejectedCount,
  };
}

export interface PartitionedSubmissions {
  graded: Submission[];
  unmarked: Submission[];
}

export function sortSubmissionsForAdmin(
  submissions: Submission[],
): PartitionedSubmissions {
  const graded: Submission[] = [];
  const unmarked: Submission[] = [];

  for (const sub of submissions) {
    if (sub.status === 'unmarked') {
      unmarked.push(sub);
    } else {
      graded.push(sub);
    }
  }

  graded.sort(
    (a, b) => (b.gradedAt ?? b.submittedAt) - (a.gradedAt ?? a.submittedAt),
  );
  unmarked.sort((a, b) => b.submittedAt - a.submittedAt);

  return { graded, unmarked };
}

export interface PartitionedTeamTasks {
  todoTasks: Task[];
  completedTasks: Task[];
}

export function partitionTasksForTeam(
  tasks: Task[],
  submissionsByTaskId: Record<string, Submission | undefined>,
): PartitionedTeamTasks {
  const sorted = [...tasks].sort((a, b) => a.number - b.number);
  const todoTasks: Task[] = [];
  const completedTasks: Task[] = [];

  for (const task of sorted) {
    const sub = submissionsByTaskId[task.id];
    if (sub && (sub.status === 'unmarked' || sub.status === 'approved')) {
      completedTasks.push(task);
    } else {
      todoTasks.push(task);
    }
  }

  return { todoTasks, completedTasks };
}

export interface CategoryTeamBreakdown {
  category: Category;
  teamStats: Record<
    string,
    {
      points: number;
      completed: number;
      totalInCategory: number;
    }
  >;
}

export interface TimelineSeries {
  team: Team;
  points: { timestamp: number; cumulativeScore: number; taskNumber: number }[];
}

export interface EndGameAnalytics {
  rankedTeams: TeamScoreSummary[];
  categoryBreakdowns: CategoryTeamBreakdown[];
  timeline: TimelineSeries[];
  submissionsByTaskId: Record<string, Record<string, Submission>>;
  submissionsByTeamId: Record<string, Submission[]>;
}

export function buildEndGameAnalytics(
  teams: Team[],
  tasks: Task[],
  categories: Category[],
  submissions: Submission[],
): EndGameAnalytics {
  const sortedTeams = [...teams].sort((a, b) => a.number - b.number);
  const rankedTeams = sortedTeams
    .map((team) => computeTeamScore(team, submissions))
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.approvedCount !== a.approvedCount) {
        return b.approvedCount - a.approvedCount;
      }
      return a.team.number - b.team.number;
    });

  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const categoryBreakdowns: CategoryTeamBreakdown[] = sortedCategories.map(
    (category) => {
      const tasksInCat = tasks.filter((t) => t.categoryId === category.id);
      const teamStats: CategoryTeamBreakdown['teamStats'] = {};
      for (const team of sortedTeams) {
        teamStats[team.id] = {
          points: 0,
          completed: 0,
          totalInCategory: tasksInCat.length,
        };
      }

      for (const sub of submissions) {
        if (sub.status !== 'approved') continue;
        const catId = taskById.get(sub.taskId)?.categoryId ?? sub.categoryId;
        if (catId === category.id && teamStats[sub.teamId]) {
          teamStats[sub.teamId].points += sub.awardedPoints;
          teamStats[sub.teamId].completed += 1;
        }
      }

      return { category, teamStats };
    },
  );

  const submissionsByTeamId: Record<string, Submission[]> = {};
  const submissionsByTaskId: Record<string, Record<string, Submission>> = {};

  for (const team of sortedTeams) {
    submissionsByTeamId[team.id] = [];
  }
  for (const task of tasks) {
    submissionsByTaskId[task.id] = {};
  }

  for (const sub of submissions) {
    if (!submissionsByTeamId[sub.teamId]) {
      submissionsByTeamId[sub.teamId] = [];
    }
    submissionsByTeamId[sub.teamId].push(sub);

    if (!submissionsByTaskId[sub.taskId]) {
      submissionsByTaskId[sub.taskId] = {};
    }
    submissionsByTaskId[sub.taskId][sub.teamId] = sub;
  }

  for (const teamId of Object.keys(submissionsByTeamId)) {
    submissionsByTeamId[teamId].sort((a, b) => a.taskNumber - b.taskNumber);
  }

  const timeline: TimelineSeries[] = sortedTeams.map((team) => {
    const approved = (submissionsByTeamId[team.id] ?? [])
      .filter((s) => s.status === 'approved')
      .sort((a, b) => a.submittedAt - b.submittedAt);

    let cumulative = 0;
    const points = approved.map((s) => {
      cumulative += s.awardedPoints;
      return {
        timestamp: s.submittedAt,
        cumulativeScore: cumulative,
        taskNumber: s.taskNumber,
      };
    });

    return { team, points };
  });

  return {
    rankedTeams,
    categoryBreakdowns,
    timeline,
    submissionsByTaskId,
    submissionsByTeamId,
  };
}
