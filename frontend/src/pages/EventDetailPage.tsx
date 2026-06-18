import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventDetails } from '../hooks/useEventDetails';
import { useReservation, SeatConflictError } from '../hooks/useReservation';
import { useSeatSelection } from '../hooks/useSeatSelection';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Armchair, ChevronLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { SeatGrid } from '../components/seats/SeatGrid';
import { SeatLegend } from '../components/seats/SeatLegend';
import { SeatGridSkeleton } from '../components/seats/SeatGridSkeleton';
import { ReservationTimer } from '../components/booking/ReservationTimer';
import { Seat } from '../types/seat.types';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id ?? '';

  // ── Selection State Hook ──────────────────────────────────
  const {
    selectedSeats,
    toggleSeat,
    deselectSeats,
    clearSelection,
    selectedCount,
  } = useSeatSelection();

  // ── Reservation Lifecycle Hook ────────────────────────────
  const {
    reservation,
    reserveSeats,
    confirmBooking,
    cancelReservation,
    clearReservation,
    resetExpired,
    isExpired,
    isLoading: isReservationLoading,
    isCancelling,
  } = useReservation();

  // ── Local Errors State ───────────────────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  // ── Event Details Hook with Polling Conditional ───────────
  const { event, seats, isLoading, error, refetch } = useEventDetails(eventId, !!reservation);

  // Seat Price calculation details
  const ticketPrice = (event as { price?: number } | undefined)?.price ?? 450;
  const totalPrice = ticketPrice * selectedCount;

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
  if (error || !event) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2 font-semibold">
          <ChevronLeft className="h-4 w-4" /> Back to Events
        </Button>
        <Alert variant="destructive">
          <AlertTitle className="font-bold">Error Loading Event Details</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
    resetExpired(); // Reset expired warning state when starting a new selection
    setConflictMsg(null);
    toggleSeat(seat);
  };

  const handleReservationExpired = () => {
    // Clear selection state
    clearSelection();
    // Clear reservation and set isExpired flag to true
    clearReservation(true);
  };

  const handleReserve = async () => {
    if (selectedSeats.length === 0) return;
    setErrorMsg(null);
    setConflictMsg(null);

    // Generate unique idempotency key for seat reservation
    const idempotencyKey = crypto.randomUUID();

    try {
      await reserveSeats(eventId, selectedSeats, idempotencyKey);
    } catch (err) {
      if (err instanceof SeatConflictError) {
        if (err.code === 'SEATS_UNAVAILABLE' && err.unavailableSeats.length > 0) {
          deselectSeats(err.unavailableSeats);
          refetch();
          setConflictMsg(
            `These seats are no longer available: ${err.unavailableSeats.join(', ')}`,
          );
        } else if (err.code === 'ACTIVE_RESERVATION') {
          setConflictMsg(
            'You still have an active reservation for this event. Cancel it first, then try again.',
          );
          refetch();
        } else {
          setConflictMsg(err.message);
          refetch();
        }
      } else {
        setErrorMsg(getApiErrorMessage(err));
      }
    }
  };

  const handleConfirm = async () => {
    if (!reservation) return;
    setErrorMsg(null);

    try {
      await confirmBooking(reservation.reservationId);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleCancelReservation = async () => {
    setErrorMsg(null);
    setConflictMsg(null);

    try {
      await cancelReservation();
      clearSelection();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Decorative background glow */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-brand-purple/10 rounded-full blur-[100px] -z-10" />

      {/* Back Button */}
      <div>
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2 font-bold rounded-xl border-border/60 hover:bg-secondary/40">
          <ChevronLeft className="h-4 w-4" /> Back to Events
        </Button>
      </div>

      {/* Main Responsive Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Event Details, Map and Legend */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Event Details Header */}
          <Card className="border-border/30 shadow-md overflow-hidden bg-card/60 backdrop-blur-md rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{event.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-white/95 font-medium">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-white/95 font-medium">{event.venue}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-4 border-t border-border/20">
                {event.description}
              </p>
            </CardContent>
          </Card>

          {/* Seat Layout Map Card */}
          <Card className="border-border/30 shadow-md overflow-hidden bg-card/60 backdrop-blur-md rounded-2xl">
            <CardHeader className="bg-secondary/20 border-b border-border/20">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                <Armchair className="h-5 w-5 text-primary" />
                <span>Select Your Seats</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
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
          <Card className="border border-border/30 shadow-2xl sticky top-24 bg-card/85 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-secondary/20 border-b border-border/20">
              <CardTitle className="text-lg font-bold text-white">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Context-aware error alerts inside sidebar */}
              {errorMsg && (
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/10 text-destructive-foreground">
                  <AlertTitle className="font-bold text-xs">Error</AlertTitle>
                  <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
                </Alert>
              )}

              {conflictMsg && (
                <Alert variant="destructive" className="animate-in slide-in-from-top duration-300 border-destructive/20 bg-destructive/10 text-destructive-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-bold text-xs">Seat Selection Conflict</AlertTitle>
                  <AlertDescription className="text-xs">{conflictMsg}</AlertDescription>
                </Alert>
              )}

              {/* Chosen Seats Badge List */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">Selected Seats</span>
                {selectedSeats.length === 0 ? (
                  <div className="text-xs sm:text-sm text-muted-foreground py-6 text-center border border-dashed rounded-xl bg-secondary/15 border-border/60">
                    No seats selected yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat}
                        className="px-2.5 py-1 rounded-lg bg-brand-pink/15 text-brand-pink border border-brand-pink/25 text-xs font-extrabold transition-all duration-150 shadow-sm"
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
                <div className="p-4 border rounded-xl bg-brand-purple/5 border-brand-purple/25 space-y-4">
                  <ReservationTimer
                    expiresAt={reservation.expiresAt}
                    onExpired={handleReservationExpired}
                  />

                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    Your seats have been temporarily locked. Please click "Confirm Booking" to finalize your purchase before the countdown runs out.
                  </p>

                  <div className="flex flex-col gap-2 pt-3 border-t border-border/20">
                    {/* Total Price details if price per seat is configured */}
                    <div className="flex justify-between text-sm font-semibold text-white py-1 mb-1">
                      <span>Total Amount:</span>
                      <span className="font-bold text-primary">₹{totalPrice}</span>
                    </div>
                    <Button
                      onClick={handleConfirm}
                      className="w-full font-bold bg-green-600 hover:bg-green-700 text-white border-green-500 shadow-lg shadow-green-600/10 rounded-xl h-11 transition-all duration-200"
                      isLoading={isReservationLoading}
                      disabled={
                        !reservation ||
                        isExpired ||
                        isReservationLoading
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancelReservation}
                      disabled={isReservationLoading || isCancelling}
                      className="text-xs text-muted-foreground hover:text-white rounded-xl hover:bg-secondary/40 transition-colors"
                    >
                      {isCancelling ? 'Cancelling…' : 'Cancel Reservation'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Dynamic selection actions summary
                <div className="space-y-5">
                  {isExpired && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top duration-300 border-destructive/20 bg-destructive/10 text-destructive-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="font-bold text-xs">Reservation Expired</AlertTitle>
                      <AlertDescription className="text-xs">
                        Your reservation has expired. Please select seats again.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2.5 pt-4 border-t border-border/20 text-xs sm:text-sm font-semibold">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Selected Count:</span>
                      <span className="text-white font-bold">{selectedCount} {selectedCount === 1 ? 'Seat' : 'Seats'}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Price per Seat:</span>
                      <span className="text-white font-bold">₹{ticketPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold text-white border-t border-dashed border-border/40 pt-3 mt-1">
                      <span>Total Price:</span>
                      <span className="text-primary font-extrabold text-lg">₹{totalPrice}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleReserve}
                    disabled={selectedSeats.length === 0}
                    className="w-full font-bold shadow-lg shadow-primary/20 rounded-xl h-11 text-white transition-all duration-300"
                    isLoading={isReservationLoading}
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
