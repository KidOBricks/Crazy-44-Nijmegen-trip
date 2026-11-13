import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('Crazy 44 App Routes', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '#/';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders LandingPage with Crazy 44 branding and setup options', () => {
    render(<App />);
    expect(screen.getByText('Welcome to Crazy 44')).toBeDefined();
    expect(
      screen.getByText('Launch Local Demo (Multi-Tab Preview)'),
    ).toBeDefined();
  });

  it('renders AdminPage in Local Demo mode with 35 seeded tasks', async () => {
    window.location.hash = '#/admin?token=demo-admin';
    render(<App />);
    expect(await screen.findByText('Crazy 44 Admin')).toBeDefined();
    expect(await screen.findByText('Tasks (35)')).toBeDefined();
    expect(await screen.findByText('Bow to the devil')).toBeDefined();
  });

  it('renders TeamPage waiting lobby in Local Demo mode before game start', async () => {
    window.location.hash = '#/team/team-1?t=demo-t1';
    render(<App />);
    expect(await screen.findByText('Purple Panthers')).toBeDefined();
    expect(await screen.findByText('Waiting for Game Start')).toBeDefined();
  });
});
