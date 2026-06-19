import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, MapPin, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { Event } from '../../types/event.types';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function AdminEventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?\n\nThis will remove the event and all associated seats. This action cannot be undone.`)) {
      return;
    }

    try {
      await adminApi.deleteEvent(id);
      setEvents((prev) => prev.filter((event) => event._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete event. It may have existing bookings.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Manage Events</h1>
          <p className="text-muted-foreground mt-1">Admin dashboard for event management</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/admin/events/create">
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/20 border border-destructive/50 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card className="bg-card/50 border-border/30">
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-4 opacity-20" />
              <p>No events found</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event._id} className={`bg-card/50 border-border/30 overflow-hidden transition-all hover:bg-card/80 ${!event.isActive ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="sm:w-48 h-32 sm:h-auto shrink-0 relative bg-muted">
                  {event.image ? (
                    <img src={event.image} alt={event.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">No Image</div>
                  )}
                  {!event.isActive && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white text-xs font-bold rounded-md uppercase">
                      Inactive
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">{event.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.dateTime).toLocaleString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: 'numeric', minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue}{event.location ? `, ${event.location}` : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 text-xs">
                    {event.category && (
                      <span className="px-2 py-1 rounded bg-secondary/50 text-secondary-foreground">
                        {event.category}
                      </span>
                    )}
                    {event.price != null && (
                      <span className="px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                        ₹{event.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                      {event.totalSeats} seats
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 flex sm:flex-col justify-end gap-2 border-t sm:border-t-0 sm:border-l border-border/30 bg-black/20">
                  <Button variant="outline" size="sm" asChild className="w-full justify-center">
                    <Link to={`/admin/events/${event._id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(event._id, event.name)}
                    className="w-full justify-center bg-destructive/80 hover:bg-destructive text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
