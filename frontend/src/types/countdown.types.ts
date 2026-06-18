export interface CountdownResult {
  minutes: number;
  seconds: number;
  secondsLeft: number;
  formattedTime: string;
  isExpired: boolean;
}

export interface ReservationTimerProps {
  expiresAt: string;
  onExpired?: () => void;
}
