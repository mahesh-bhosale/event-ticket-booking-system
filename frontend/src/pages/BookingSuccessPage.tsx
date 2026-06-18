import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import type { BookingConfirmResult } from '../types/event.types';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Calendar, MapPin, Armchair, Ticket } from 'lucide-react';

export default function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract booking info from routing state
  const state = location.state as { booking?: BookingConfirmResult } | null;
  const booking = state?.booking;

  // If accessed directly without booking state, redirect back to home page
  if (!booking) {
    return <Navigate to="/" replace />;
  }

  const formattedDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedBookedTime = new Date(booking.bookedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-purple/10 rounded-full blur-[100px] -z-10" />

      {/* Visual Success Indicator */}
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/30 shadow-lg shadow-green-500/10 animate-bounce">
          <Check className="h-8 w-8 stroke-[3]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Booking Confirmed!</h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Your ticket reservation has been successfully confirmed. See your details below.
        </p>
      </div>

      {/* Ticket Details Card */}
      <Card className="border border-border/30 shadow-2xl overflow-hidden relative bg-card/65 backdrop-blur-md rounded-2xl">
        {/* Ticket Side Punch Holes */}
        <div className="absolute top-[80%] -left-3 h-6 w-6 rounded-full bg-background border border-border/30 -translate-y-1/2 z-20" />
        <div className="absolute top-[80%] -right-3 h-6 w-6 rounded-full bg-background border border-border/30 -translate-y-1/2 z-20" />

        {/* Ticket Header Graphic */}
        <div className="bg-brand-gradient text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-white animate-pulse" />
            <span className="text-xs uppercase font-black tracking-widest opacity-95">Official Admission Ticket</span>
          </div>
          <span className="text-sm font-mono font-bold tracking-wider">{booking.bookingReference}</span>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Event Name */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Event Name</span>
            <h2 className="text-2xl font-extrabold text-white">{booking.eventName}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/20">
            {/* Event Time */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date & Time</span>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-semibold">
                <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Venue Location</span>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-semibold">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{booking.venue}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/20">
            {/* Seat Numbers */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Confirmed Seats</span>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-semibold">
                <Armchair className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {booking.seatNumbers.map((seat) => (
                    <span
                      key={seat}
                      className="px-2 py-0.5 rounded-lg bg-brand-pink/15 text-brand-pink text-xs font-extrabold border border-brand-pink/25"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Booked At */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Transaction Time</span>
              <div className="text-xs sm:text-sm text-white font-semibold">
                {formattedBookedTime}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Ticket Footer Tear-off Line */}
        <div className="border-t border-dashed border-border/40 py-5 px-6 bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Show reference at gate</span>
          <span className="font-mono font-bold text-white tracking-widest">{booking.bookingId}</span>
        </div>
      </Card>

      {/* Button Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => navigate('/')} className="font-bold rounded-xl shadow-lg shadow-primary/20 h-10 px-6 text-white transition-all duration-300">
          View More Events
        </Button>
      </div>
    </div>
  );
}
