import React, { useEffect, useRef } from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { ReservationTimerProps } from '../../types/countdown.types';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const ReservationTimer: React.FC<ReservationTimerProps> = ({
  expiresAt,
  onExpired,
}) => {
  const { secondsLeft, formattedTime, isExpired } = useCountdown(expiresAt, onExpired);

  const hasShown60sToast = useRef(false);
  const hasShownExpiredToast = useRef(false);

  // Reset toast triggers if the expiration deadline changes (e.g. user makes a new reservation)
  useEffect(() => {
    hasShown60sToast.current = false;
    hasShownExpiredToast.current = false;
  }, [expiresAt]);

  // Sonner warning toast at 60s remaining
  useEffect(() => {
    if (secondsLeft > 0 && secondsLeft <= 60 && !hasShown60sToast.current) {
      hasShown60sToast.current = true;
      toast.warning("Warning: Less than 1 minute remaining to complete your booking.");
    }
  }, [secondsLeft]);

  // Sonner error toast on expiration
  useEffect(() => {
    if (isExpired && !hasShownExpiredToast.current) {
      hasShownExpiredToast.current = true;
      toast.error("Reservation expired. Please select seats again.");
    }
  }, [isExpired]);

  // Expiration State: Replace timer UI with a destructive alert
  if (isExpired) {
    return (
      <Alert variant="destructive" className="w-full animate-in fade-in duration-300" aria-live="polite">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-bold">Reservation Expired</AlertTitle>
        <AlertDescription>
          Your reservation has expired. Please select seats again.
        </AlertDescription>
      </Alert>
    );
  }

  const isUrgent = secondsLeft <= 60;
  // Progress ratio (out of 600s / 10m maximum duration)
  const progress = Math.max(0, Math.min(100, (secondsLeft / 600) * 100));

  return (
    <Card 
      className={`border-border/40 shadow-md transition-all duration-300 ${
        isUrgent ? 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10' : 'bg-card'
      }`} 
      aria-live="polite"
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock className={`h-4 w-4 ${isUrgent ? 'text-destructive animate-pulse' : 'text-primary'}`} />
            <span>Reservation Time Remaining</span>
          </div>
          <span
            className={`font-mono text-lg font-bold tracking-wider ${
              isUrgent ? 'text-destructive animate-pulse' : 'text-foreground'
            }`}
          >
            {formattedTime}
          </span>
        </div>

        {/* Progress Bar */}
        <Progress
          value={progress}
          indicatorClassName={isUrgent ? 'bg-destructive' : 'bg-primary'}
          className="h-1.5"
        />

        {/* Urgency warning message */}
        {isUrgent && (
          <div className="text-[11px] font-semibold text-destructive flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Less than 1 minute remaining</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReservationTimer;
