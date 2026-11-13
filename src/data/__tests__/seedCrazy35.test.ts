import { describe, expect, it } from 'vitest';
import {
  buildSeedTasks,
  DEFAULT_RULES_TEXT,
  SEED_CATEGORIES,
} from '../seedCrazy35';

describe('seedCrazy35', () => {
  it('seeds all 4 categories in order', () => {
    expect(SEED_CATEGORIES).toHaveLength(4);
    expect(SEED_CATEGORIES.map((c) => c.order)).toEqual([1, 2, 3, 4]);
  });

  it('seeds 35 sequential tasks numbered 1..35 with default 1 point', () => {
    const tasks = buildSeedTasks(1000);
    expect(tasks).toHaveLength(35);
    expect(tasks[0].number).toBe(1);
    expect(tasks[34].number).toBe(35);
    for (const task of tasks) {
      expect(task.points).toBe(1);
      expect(task.title.length).toBeGreaterThan(0);
      expect(task.description.length).toBeGreaterThan(0);
      expect(
        SEED_CATEGORIES.some((c) => c.id === task.categoryId),
      ).toBe(true);
    }
  });

  it('includes rules and scoring guidelines', () => {
    expect(DEFAULT_RULES_TEXT).toContain('Base Points');
    expect(DEFAULT_RULES_TEXT).toContain('Bonus Points');
    expect(DEFAULT_RULES_TEXT).toContain('-5 Points');
  });
});
