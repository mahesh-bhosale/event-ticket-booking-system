import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCountdown } from '../useCountdown';
import { ReservationTimer } from '../../components/booking/ReservationTimer';

// Mock sonner notifications to avoid side effects during tests
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useCountdown Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('calculates correct initial countdown time', () => {
    const expiresAt = new Date(Date.now() + 600 * 1000).toISOString(); // 10 minutes
    const { result } = renderHook(() => useCountdown(expiresAt));

    expect(result.current.minutes).toBe(10);
    expect(result.current.seconds).toBe(0);
    expect(result.current.secondsLeft).toBe(600);
    expect(result.current.formattedTime).toBe('10:00');
    expect(result.current.isExpired).toBe(false);
  });

  test('updates countdown every second', () => {
    const expiresAt = new Date(Date.now() + 10 * 1000).toISOString(); // 10 seconds
    const { result } = renderHook(() => useCountdown(expiresAt));

    expect(result.current.secondsLeft).toBe(10);
    expect(result.current.formattedTime).toBe('00:10');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.secondsLeft).toBe(9);
    expect(result.current.formattedTime).toBe('00:09');

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.secondsLeft).toBe(5);
    expect(result.current.formattedTime).toBe('00:05');
  });

  test('formats MM:SS correctly with leading zeros', () => {
    const expiresAt = new Date(Date.now() + 65 * 1000).toISOString(); // 1m 5s
    const { result } = renderHook(() => useCountdown(expiresAt));

    expect(result.current.formattedTime).toBe('01:05');

    act(() => {
      vi.advanceTimersByTime(10000); // 10s
    });

    expect(result.current.formattedTime).toBe('00:55');
  });

  test('handles expiration correctly', () => {
    const expiresAt = new Date(Date.now() + 3 * 1000).toISOString(); // 3s
    const onExpired = vi.fn();
    const { result } = renderHook(() => useCountdown(expiresAt, onExpired));

    expect(result.current.isExpired).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedTime).toBe('00:00');
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  test('recovers from tab/laptop sleep correctly using Date.now() calculation', () => {
    const startTime = Date.now();
    const expiresAt = new Date(startTime + 600 * 1000).toISOString(); // 10 minutes
    
    // Spy on Date.now to simulate clock advancement
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(startTime);

    const { result } = renderHook(() => useCountdown(expiresAt));
    expect(result.current.secondsLeft).toBe(600);

    // Simulate laptop sleep/inactive tab by jumping the clock by 5 minutes:
    dateSpy.mockReturnValue(startTime + 300 * 1000);

    // Simulate tab refocus
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.secondsLeft).toBe(300);
    expect(result.current.formattedTime).toBe('05:00');
    expect(result.current.isExpired).toBe(false);
  });

  test('calls onExpired exactly once and avoids repeated invocations', () => {
    const expiresAt = new Date(Date.now() + 2 * 1000).toISOString();
    const onExpired = vi.fn();
    renderHook(() => useCountdown(expiresAt, onExpired));

    act(() => {
      vi.advanceTimersByTime(2000); // Expired
    });

    expect(onExpired).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000); // Extra time tick
    });

    // Should still only have been called once
    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});

describe('ReservationTimer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('renders countdown title and formatted time', () => {
    const expiresAt = new Date(Date.now() + 600 * 1000).toISOString();
    render(<ReservationTimer expiresAt={expiresAt} />);

    expect(screen.getByText('Reservation Time Remaining')).toBeDefined();
    expect(screen.getByText('10:00')).toBeDefined();
  });

  test('renders destructive alert when expired', () => {
    const expiresAt = new Date(Date.now() - 1000).toISOString(); // Already expired
    render(<ReservationTimer expiresAt={expiresAt} />);

    expect(screen.getByText('Reservation Expired')).toBeDefined();
    expect(screen.getByText('Your reservation has expired. Please select seats again.')).toBeDefined();
  });

  test('renders urgency warnings when under 60 seconds', () => {
    const expiresAt = new Date(Date.now() + 45 * 1000).toISOString(); // 45 seconds left
    render(<ReservationTimer expiresAt={expiresAt} />);

    expect(screen.getByText('Less than 1 minute remaining')).toBeDefined();
  });
});
