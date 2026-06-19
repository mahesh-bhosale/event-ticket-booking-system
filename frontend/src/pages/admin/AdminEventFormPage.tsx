import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function AdminEventFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [totalSeats, setTotalSeats] = useState('80');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isEditMode && id) {
      fetchEvent(id);
    }
  }, [id, isEditMode]);

  const fetchEvent = async (eventId: string) => {
    try {
      const events = await adminApi.getEvents();
      const event = events.find(e => e._id === eventId);
      if (!event) throw new Error('Event not found');

      setName(event.name);
      setDescription(event.description);
      setVenue(event.venue);
      // Format to YYYY-MM-DDTHH:MM for datetime-local input
      const dt = new Date(event.dateTime);
      const tzOffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
      setDateTime(localISOTime);
      
      setTotalSeats(event.totalSeats.toString());
      setCategory(event.category || '');
      setPrice(event.price != null ? event.price.toString() : '');
      setLocation(event.location || '');
      setImage(event.image);
      setIsActive(event.isActive);
    } catch (err: any) {
      setError(err.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        description,
        venue,
        dateTime: new Date(dateTime).toISOString(),
        totalSeats: parseInt(totalSeats, 10),
        category: category || undefined,
        price: price ? parseInt(price, 10) : undefined,
        location: location || undefined,
        image,
        isActive,
      };

      if (isEditMode && id) {
        // Prevent sending totalSeats on update to avoid confusion, though it's in the schema it shouldn't change
        const { totalSeats: _, ...updatePayload } = payload;
        await adminApi.updateEvent(id, updatePayload);
      } else {
        await adminApi.createEvent(payload);
      }

      navigate('/admin/events');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while saving');
      setIsSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="rounded-xl h-10 w-10 shrink-0">
          <Link to="/admin/events">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Update event details' : 'Add a new event to the platform'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/20 border border-destructive/50 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="e.g. The Tomatina Festival"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Description *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Detailed event description..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Venue *</label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. Bar Bank - Juhu"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">City / Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-white color-scheme-dark"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white flex justify-between">
                      Total Seats *
                      <span className="text-muted-foreground text-xs font-normal ml-2">(Locked to 80)</span>
                    </label>
                    <input
                      type="number"
                      required
                      disabled={true}
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. Concert"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Base Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="0"
                    />
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Image & Status */}
          <div className="space-y-6">
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground pt-1">Provide a direct link to an image.</p>
                </div>

                <div className="pt-2">
                  <label className="text-sm font-medium text-white mb-2 block">Image Preview</label>
                  <div className="w-full aspect-[3/4] bg-muted/30 rounded-xl border border-border/50 overflow-hidden flex items-center justify-center relative">
                    {image ? (
                      <img 
                        src={image} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).alt = 'Invalid Image URL';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-xs">No image provided</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/30 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-muted border border-border/50 peer-checked:bg-primary transition-colors"></div>
                      <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-[20px]"></div>
                    </div>
                    <span className="text-sm font-medium text-white">
                      Active (Visible to users)
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full font-bold text-md h-12 shadow-brand-glow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  {isEditMode ? 'Save Changes' : 'Create Event'}
                </>
              )}
            </Button>
          </div>

        </div>
      </form>
    </div>
  );
}
