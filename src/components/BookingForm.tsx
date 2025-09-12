
import { useState } from "react";
import { Check, CalendarIcon, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { trackBooking } from "@/components/Analytics";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BookingForm() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [apartmentId, setApartmentId] = useState("1"); // Default apartment
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to make a booking",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate || !guestName || !guestEmail) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('smoobu-booking', {
        body: {
          apartmentId,
          guestName,
          guestEmail,
          guestPhone,
          checkIn: format(startDate, 'yyyy-MM-dd'),
          checkOut: format(endDate, 'yyyy-MM-dd'),
          adults: parseInt(adults),
          children: parseInt(children),
          notes,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking created successfully!",
      });

      // Track booking completion for analytics
      const totalPrice = data?.totalPrice || 0;
      trackBooking(apartmentId, totalPrice, 'EUR');

      setSubmitted(true);
      
      // Reset form after showing success
      setTimeout(() => {
        setSubmitted(false);
        setStartDate(undefined);
        setEndDate(undefined);
        setGuestName("");
        setGuestEmail("");
        setGuestPhone("");
        setNotes("");
      }, 3000);

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="glass-card p-6 space-y-6 animate-fade-in [animation-delay:200ms]"
    >
      <h3 className="text-2xl font-bold text-center mb-6">{t.bookingForm.title}</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Check-in Date */}
          <div className="space-y-2">
            <label htmlFor="check-in" className="block text-sm font-medium">
              {t.bookingForm.checkIn}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="check-in"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>{t.bookingForm.selectDate}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Check-out Date */}
          <div className="space-y-2">
            <label htmlFor="check-out" className="block text-sm font-medium">
              {t.bookingForm.checkOut}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="check-out"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>{t.bookingForm.selectDate}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => date < (startDate || new Date())}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Adults */}
          <div className="space-y-2">
            <label htmlFor="adults" className="block text-sm font-medium">
              {t.bookingForm.adults}
            </label>
            <Select value={adults} onValueChange={setAdults}>
              <SelectTrigger id="adults" className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? t.bookingForm.adult : t.bookingForm.adults}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Children */}
          <div className="space-y-2">
            <label htmlFor="children" className="block text-sm font-medium">
              {t.bookingForm.children}
            </label>
            <Select value={children} onValueChange={setChildren}>
              <SelectTrigger id="children" className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? t.bookingForm.child : t.bookingForm.children}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Guest Information */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-lg font-semibold">Guest Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="guest-name" className="block text-sm font-medium">
                Full Name *
              </label>
              <Input
                id="guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="guest-email" className="block text-sm font-medium">
                Email *
              </label>
              <Input
                id="guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="guest-phone" className="block text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="guest-phone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium">
              Special Requests
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes..."
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <Button type="submit" className="w-full btn-primary relative" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating booking...
          </>
        ) : submitted ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            {t.bookingForm.bookingConfirmed}
          </>
        ) : (
          <>
            <Users className="mr-2 h-4 w-4" />
            {t.bookingForm.checkAvailability}
          </>
        )}
      </Button>
    </form>
  );
}
