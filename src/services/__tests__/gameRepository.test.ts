import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoRepository } from '../gameRepository';

describe('createDemoRepository restartGame', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears submissions and team adjustments while preserving tasks, categories, and teams', async () => {
    const repo = createDemoRepository();
    await repo.updateGame({ status: 'active', durationMinutes: 90 });
    await repo.addTeamAdjustment('team-1', {
      id: 'adj-1',
      delta: -5,
      reason: 'Late',
      createdAt: 1000,
    });
    await repo.submitProof({
      id: 'team-1_task-1',
      teamId: 'team-1',
      taskId: 'task-1',
      taskNumber: 1,
      taskTitle: 'Bow to the devil',
      categoryId: 'cat-1',
      teamName: 'Purple Panthers',
      teamNumber: 1,
      teamColor: '#4B1D8C',
      mediaUrl: 'data:image/jpeg;base64,abc',
      mediaPath: 'demo/1',
      mediaType: 'image',
      status: 'approved',
      basePoints: 1,
      bonusPoints: 0,
      awardedPoints: 1,
      submittedAt: 1000,
      gradedAt: 1200,
    });

    await repo.restartGame();

    const captured: {
      game: Awaited<ReturnType<typeof repo.ensureInitialized>> | null;
      subCount: number;
      taskCount: number;
      teamCount: number;
      team1Penalty: number;
    } = {
      game: null,
      subCount: -1,
      taskCount: -1,
      teamCount: -1,
      team1Penalty: -999,
    };

    const unsub = repo.subscribe(
      (snap) => {
        captured.game = snap.game;
        captured.subCount = snap.submissions.length;
        captured.taskCount = snap.tasks.length;
        captured.teamCount = snap.teams.length;
        captured.team1Penalty =
          snap.teams.find((t) => t.id === 'team-1')?.penaltyPoints ?? -999;
      },
      () => {},
    );
    unsub();

    expect(captured.game?.status).toBe('setup');
    expect(captured.game?.durationMinutes).toBe(90);
    expect(captured.subCount).toBe(0);
    expect(captured.taskCount).toBe(44);
    expect(captured.teamCount).toBe(4);
    expect(captured.team1Penalty).toBe(0);
  });

  it('auto-migrates legacy v1 35-task snapshots to 44 tasks across 5 categories while preserving teams, rules, and settings', () => {
    localStorage.setItem(
      'crazy44_demo_snapshot_v1',
      JSON.stringify({
        game: {
          title: 'Crazy 44',
          status: 'setup',
          adminToken: 'secret-keep-me',
          durationMinutes: 120,
          startedAt: null,
          endsAt: null,
          endedAt: null,
          ntfyTopic: 'my-ntfy',
          cloudinaryCloudName: 'my-cloud',
          cloudinaryUploadPreset: 'crazy44',
          rulesText: 'Custom rules preserved',
          updatedAt: 500,
        },
        categories: [{ id: 'cat-1', name: 'Old Cat', order: 1 }],
        tasks: [
          {
            id: 'task-1',
            number: 1,
            title: 'Old Task',
            description: 'Old desc',
            categoryId: 'cat-1',
            points: 1,
            createdAt: 500,
            updatedAt: 500,
          },
        ],
        teams: [
          {
            id: 'team-custom',
            number: 1,
            name: 'Custom Squad',
            color: '#4B1D8C',
            accessToken: 't-tok',
            penaltyPoints: 0,
            adjustments: [],
            createdAt: 500,
          },
        ],
        submissions: [],
      }),
    );

    const repo = createDemoRepository();
    let migratedSnap: Parameters<Parameters<typeof repo.subscribe>[0]>[0] | null =
      null;
    const unsub = repo.subscribe(
      (s) => {
        migratedSnap = s;
      },
      () => {},
    );
    unsub();

    expect(migratedSnap).not.toBeNull();
    expect(migratedSnap!.tasks).toHaveLength(44);
    expect(migratedSnap!.categories).toHaveLength(5);
    expect(migratedSnap!.game.tasksSeedVersion).toBe(2);
    expect(migratedSnap!.game.adminToken).toBe('secret-keep-me');
    expect(migratedSnap!.game.cloudinaryCloudName).toBe('my-cloud');
    expect(migratedSnap!.game.cloudinaryUploadPreset).toBe('crazy44');
    expect(migratedSnap!.game.ntfyTopic).toBe('my-ntfy');
    expect(migratedSnap!.game.rulesText).toBe('Custom rules preserved');
    expect(migratedSnap!.teams).toHaveLength(1);
    expect(migratedSnap!.teams[0].name).toBe('Custom Squad');
  });
});
