import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';
import { useReserveSeats } from '../hooks/useReserveSeats';
import { useConfirmBooking } from '../hooks/useConfirmBooking';
import { useSeatSelection } from '../hooks/useSeatSelection';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Armchair, ChevronLeft, Clock, CheckCircle } from 'lucide-react';
import { SeatGrid } from '../components/seats/SeatGrid';
import { SeatLegend } from '../components/seats/SeatLegend';
import { SeatGridSkeleton } from '../components/seats/SeatGridSkeleton';
import { Seat } from '../types/seat.types';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id ?? '';

  // ── Selection State Hook ──────────────────────────────────
  const {
    selectedSeats,
    toggleSeat,
    clearSelection,
    selectedCount,
  } = useSeatSelection();

  // ── Local Reservation States ──────────────────────────────
  const [reservation, setReservation] = useState<{
    id: string;
    expiresAt: Date;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Queries & Mutations ───────────────────────────────────
  const { data: response, isLoading, isError, error } = useEvent(eventId);
  const reserveSeatsMutation = useReserveSeats();
  const confirmBookingMutation = useConfirmBooking();

  const event = response?.data?.event;
  // Safely cast seats response items to our strict Seat type
  const seats = (response?.data?.seats as unknown as Seat[]) ?? [];

  // Seat Price calculation details
  const ticketPrice = (event as { price?: number } | undefined)?.price ?? 450;
  const totalPrice = ticketPrice * selectedCount;

  // Countdown timer effect
  useEffect(() => {
    if (!reservation) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        // Reset reservation & selection state on timeout
        setReservation(null);
        clearSelection();
        setErrorMsg('Your seat reservation has expired. Please select seats and try again.');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation, clearSelection]);

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Back Button Skeleton */}
        <div>
          <Skeleton className="h-9 w-28 bg-muted/60" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card Skeleton */}
            <Card className="border-border/40 shadow-sm bg-card/30">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-2/3 bg-muted/50" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-5 w-1/2 bg-muted/40" />
                  <Skeleton className="h-5 w-1/3 bg-muted/40" />
                </div>
                <div className="border-t pt-4 space-y-2">
                  <Skeleton className="h-4 w-full bg-muted/30" />
                  <Skeleton className="h-4 w-5/6 bg-muted/30" />
                </div>
              </CardContent>
            </Card>

            {/* Seat Grid Card Skeleton */}
            <Card className="border-border/40 shadow-sm bg-card/30">
              <CardContent className="p-6">
                <SeatGridSkeleton />
              </CardContent>
            </Card>
          </div>

          {/* Right Column Sidebar Skeleton */}
          <div>
            <Card className="border-border/40 shadow-md bg-card/30">
              <CardContent className="p-6 space-y-6 pt-6">
                <Skeleton className="h-6 w-1/2 bg-muted/50" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 bg-muted/40" />
                  <Skeleton className="h-16 w-full bg-muted/35 rounded-lg" />
                </div>
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 bg-muted/40" />
                    <Skeleton className="h-4 w-16 bg-muted/40" />
                  </div>
                  <Skeleton className="h-10 w-full bg-muted/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error boundary layout
  if (isError || !event) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2 font-semibold">
          <ChevronLeft className="h-4 w-4" /> Back to Events
        </Button>
        <Alert variant="destructive">
          <AlertTitle className="font-bold">Error Loading Event Details</AlertTitle>
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formattedDate = new Date(event.dateTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleToggleSeat = (seat: Seat) => {
    // Selection is frozen during active holds/checkout countdowns
    if (reservation) return;
    toggleSeat(seat);
  };

  const handleReserve = async () => {
    if (selectedSeats.length === 0) return;
    setErrorMsg(null);

    // Generate unique idempotency key for seat reservation
    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await reserveSeatsMutation.mutateAsync({
        eventId,
        seatNumbers: selectedSeats,
        idempotencyKey,
      });

      if (res.success && res.data) {
        setReservation({
          id: res.data.reservationId,
          expiresAt: new Date(res.data.expiresAt),
        });
        setTimeLeft(res.data.expiresInSeconds);
      }
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleConfirm = async () => {
    if (!reservation) return;
    setErrorMsg(null);

    try {
      const res = await confirmBookingMutation.mutateAsync({
        reservationId: reservation.id,
      });

      if (res.success && res.data) {
        // Navigate to success screen, passing booking detail state
        navigate('/booking/success', {
          state: { booking: res.data },
          replace: true,
        });
      }
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleCancelReservation = () => {
    setReservation(null);
    clearSelection();
    setErrorMsg(null);
  };

  // Format countdown timer text (e.g. 05:42)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2 font-semibold">
          <ChevronLeft className="h-4 w-4" /> Back to Events
        </Button>
      </div>

      {/* Main Responsive Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Event Details, Map and Legend */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Event Details Header */}
          <Card className="border-border/40 shadow-sm overflow-hidden bg-card/45 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{event.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{event.venue}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                {event.description}
              </p>
            </CardContent>
          </Card>

          {/* Seat Layout Map Card */}
          <Card className="border-border/40 shadow-sm overflow-hidden bg-card/45 backdrop-blur-sm">
            <CardHeader className="bg-accent/10 border-b border-border/40">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Armchair className="h-5 w-5 text-primary" />
                <span>Select Your Seats</span>
              </CardTitle>
              <CardDescription>
                Click on available seats to select them. You can select up to 8 seats per order.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <SeatGrid
                seats={seats}
                selectedSeats={selectedSeats}
                onToggleSeat={handleToggleSeat}
                disabled={!!reservation}
              />
            </CardContent>
          </Card>

          {/* Seat Status Legend */}
          <SeatLegend />
        </div>

        {/* Right Column - Reservation / Booking Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/40 shadow-md sticky top-24 bg-card/70 backdrop-blur-md">
            <CardHeader className="bg-accent/5 border-b border-border/20">
              <CardTitle className="text-lg font-bold">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Context-aware error alerts inside sidebar */}
              {errorMsg && (
                <Alert variant="destructive">
                  <AlertTitle className="font-bold text-xs">Error</AlertTitle>
                  <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
                </Alert>
              )}

              {/* Chosen Seats Badge List */}
              <div className="space-y-2">
                <span className="text-sm font-semibold text-muted-foreground block">Selected Seats</span>
                {selectedSeats.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg bg-accent/5 border-border/60">
                    No seats selected yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat}
                        className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-bold transition-all duration-150"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Booking Checkout hold countdown or actions */}
              {reservation ? (
                // Seat Hold State - active checkout countdown
                <div className="p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900 space-y-4">
                  <div className="flex items-center justify-between text-sm font-bold text-amber-700 dark:text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                      <span>Seats Held For:</span>
                    </div>
                    <span className="font-mono text-base">{formatTime(timeLeft)}</span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your seats have been temporarily locked. Please click "Confirm Booking" to finalize your purchase before the countdown runs out.
                  </p>

                  <div className="flex flex-col gap-2 pt-2 border-t border-amber-200/50 dark:border-amber-900/50">
                    {/* Total Price details if price per seat is configured */}
                    <div className="flex justify-between text-sm font-semibold text-foreground py-1 mb-1">
                      <span>Total Amount:</span>
                      <span className="font-bold">₹{totalPrice}</span>
                    </div>
                    <Button
                      onClick={handleConfirm}
                      className="w-full font-bold bg-green-600 hover:bg-green-700 text-white border-green-500 shadow-lg shadow-green-600/10"
                      isLoading={confirmBookingMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancelReservation}
                      disabled={confirmBookingMutation.isPending}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel Reservation
                    </Button>
                  </div>
                </div>
              ) : (
                // Dynamic selection actions summary
                <div className="space-y-4">
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-border/40 text-sm font-semibold">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Selected Count:</span>
                      <span className="text-foreground">{selectedCount} {selectedCount === 1 ? 'Seat' : 'Seats'}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Price per Seat:</span>
                      <span className="text-foreground">₹{ticketPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold text-foreground border-t border-dashed pt-3 mt-1">
                      <span>Total Price:</span>
                      <span className="text-primary">₹{totalPrice}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleReserve}
                    disabled={selectedSeats.length === 0}
                    className="w-full font-bold shadow-md"
                    isLoading={reserveSeatsMutation.isPending}
                  >
                    Reserve Seats
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
