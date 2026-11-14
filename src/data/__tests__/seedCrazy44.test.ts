import { describe, expect, it } from 'vitest';
import {
  buildSeedTasks,
  CURRENT_TASKS_SEED_VERSION,
  DEFAULT_RULES_TEXT,
  SEED_CATEGORIES,
} from '../seedCrazy44';

describe('seedCrazy44', () => {
  it('seeds all 5 categories in order', () => {
    expect(CURRENT_TASKS_SEED_VERSION).toBe(2);
    expect(SEED_CATEGORIES).toHaveLength(5);
    expect(SEED_CATEGORIES.map((c) => c.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('seeds 44 sequential tasks numbered 1..44 with default 1 point', () => {
    const tasks = buildSeedTasks(1000);
    expect(tasks).toHaveLength(44);
    expect(tasks[0].number).toBe(1);
    expect(tasks[0].title).toBe('Bow to the devil');
    expect(tasks[37].number).toBe(38);
    expect(tasks[37].title).toBe('Ink commitment');
    expect(tasks[37].points).toBe(1);
    expect(tasks[43].number).toBe(44);
    expect(tasks[43].title).toBe('Human shadow');
    for (const task of tasks) {
      expect(task.points).toBe(1);
      expect(task.title.length).toBeGreaterThan(0);
      expect(task.description.length).toBeGreaterThan(0);
      expect(
        SEED_CATEGORIES.some((c) => c.id === task.categoryId),
      ).toBe(true);
    }
  });

  it('preserves website rules and scoring guidelines', () => {
    expect(DEFAULT_RULES_TEXT).toContain('Base Points');
    expect(DEFAULT_RULES_TEXT).toContain('Bonus Points');
    expect(DEFAULT_RULES_TEXT).toContain('-5 Points');
  });
});
