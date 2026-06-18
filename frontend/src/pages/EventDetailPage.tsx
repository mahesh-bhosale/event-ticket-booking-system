import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';
import { useReserveSeats } from '../hooks/useReserveSeats';
import { useConfirmBooking } from '../hooks/useConfirmBooking';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, Armchair, ChevronLeft, Clock, CheckCircle } from 'lucide-react';
import { PageLoader } from '../components/common/PageLoader';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const eventId = id ?? '';

  // ── States ────────────────────────────────────────────────
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservation, setReservation] = useState<{
    id: string;
    expiresAt: Date;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Hooks ─────────────────────────────────────────────────
  const { data: response, isLoading, isError, error } = useEvent(eventId);
  const reserveSeatsMutation = useReserveSeats();
  const confirmBookingMutation = useConfirmBooking();

  const event = response?.data?.event;
  const seats = response?.data?.seats ?? [];

  // Countdown timer effect
  useEffect(() => {
    if (!reservation) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        // Reset reservation state on timeout
        setReservation(null);
        setSelectedSeats([]);
        setErrorMsg('Your seat reservation has expired. Please select seats and try again.');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation]);

  if (isLoading) {
    return <PageLoader />;
  }

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

  // Seat layout configuration
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const handleSeatClick = (seatNumber: string, status: string) => {
    // If seats are currently locked under an active reservation timer, disable selection changes
    if (reservation) return;

    if (status !== 'available') return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      }
      if (prev.length >= 8) {
        setErrorMsg('You can select a maximum of 8 seats per booking.');
        return prev;
      }
      setErrorMsg(null);
      return [...prev, seatNumber];
    });
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
    setSelectedSeats([]);
    setErrorMsg(null);
  };

  // Format countdown text (e.g. 05:42)
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Seat Map & Event Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Event Details Header */}
          <Card className="border-border/40 shadow-sm">
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
              <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t">
                {event.description}
              </p>
            </CardContent>
          </Card>

          {/* Interactive Seat Grid */}
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="bg-accent/10 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Armchair className="h-5 w-5 text-primary" />
                <span>Select Your Seats</span>
              </CardTitle>
              <CardDescription>
                Click on available seats to select them. You can select up to 8 seats.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              {/* Screen Indicator */}
              <div className="w-full max-w-md bg-muted/80 text-center py-1.5 rounded text-xs font-semibold tracking-widest text-muted-foreground border mb-12 uppercase">
                Stage / Screen Area
              </div>

              {/* Grid Scrollable Wrapper */}
              <div className="w-full overflow-x-auto pb-4 flex justify-center">
                <div className="grid gap-2 min-w-[340px]">
                  {rows.map((row) => (
                    <div key={row} className="flex items-center gap-2 justify-center">
                      {/* Row Label */}
                      <span className="w-6 text-sm font-bold text-muted-foreground text-center mr-1">
                        {row}
                      </span>
                      
                      {/* Columns */}
                      {columns.map((col) => {
                        const seatNumber = `${row}${col}`;
                        const seat = seats.find((s) => s.seatNumber === seatNumber);
                        const status = seat?.status ?? 'booked';
                        const isSelected = selectedSeats.includes(seatNumber);

                        let seatBg = 'bg-background border-border hover:bg-primary/20 hover:border-primary/50 text-foreground cursor-pointer';
                        if (status === 'reserved') {
                          seatBg = 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-300 cursor-not-allowed';
                        } else if (status === 'booked') {
                          seatBg = 'bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed';
                        }
                        if (isSelected) {
                          seatBg = 'bg-primary border-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow';
                        }

                        return (
                          <button
                            key={col}
                            onClick={() => handleSeatClick(seatNumber, status)}
                            disabled={status !== 'available' || !!reservation}
                            className={`h-7 w-7 sm:h-8 sm:w-8 rounded border flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-150 ${seatBg}`}
                            title={`Seat ${seatNumber} (${status})`}
                            aria-label={`Seat ${seatNumber} is ${isSelected ? 'selected' : status}`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Seat Legend */}
              <div className="flex flex-wrap gap-4 items-center justify-center text-xs font-medium text-muted-foreground mt-6 pt-4 border-t w-full">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded border bg-background border-border" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded border bg-primary border-primary" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded border bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-900" />
                  <span>Reserved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded border bg-muted border-muted-foreground/20" />
                  <span>Booked</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Booking Summary */}
        <div className="space-y-6">
          <Card className="border-border/40 shadow-md sticky top-24">
            <CardHeader className="bg-accent/5">
              <CardTitle className="text-lg font-bold">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Dynamic Error Messaging inside sidebar context */}
              {errorMsg && (
                <Alert variant="destructive">
                  <AlertTitle className="font-bold">Error</AlertTitle>
                  <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
                </Alert>
              )}

              {/* Chosen Seats List */}
              <div className="space-y-2">
                <span className="text-sm font-semibold text-muted-foreground">Selected Seats</span>
                {selectedSeats.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg bg-accent/5">
                    No seats selected yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat}
                        className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-bold"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Conditional Rendering of Holds or Action Buttons */}
              {reservation ? (
                // HOLD STATE - COUNTDOWN AND CONFIRM
                <div className="p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900 space-y-4">
                  <div className="flex items-center justify-between text-sm font-bold text-amber-700 dark:text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                      <span>Seats Held For:</span>
                    </div>
                    <span className="font-mono text-base">{formatTime(timeLeft)}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your seats have been temporarily locked. Please click "Confirm Booking" to finalize your purchase before the countdown runs out.
                  </p>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={handleConfirm}
                      className="w-full font-bold bg-green-600 hover:bg-green-700 text-white border-green-500"
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
                // SELECTION STATE - RESERVE BUTTON
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm font-semibold pt-4 border-t">
                    <span>Total Selected</span>
                    <span>{selectedSeats.length} seats</span>
                  </div>

                  <Button
                    onClick={handleReserve}
                    disabled={selectedSeats.length === 0}
                    className="w-full font-bold"
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
