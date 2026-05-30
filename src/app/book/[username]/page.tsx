"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";

type Slot = string;

export default function BookingPage() {
  const params = useParams();
  const username = params.username as string;
  
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [eventSlug, setEventSlug] = useState("consultation-30min"); // Default for now

  useEffect(() => {
    async function fetchSlots() {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch(`/api/v2/slots?username=${username}&eventTypeSlug=${eventSlug}&timeZone=${timeZone}`);
        const result = await res.json();
        
        if (result.status === "success") {
          setSlots(result.data);
        } else {
          setError(result.error?.message || "Failed to load availability");
        }
      } catch (err) {
        setError("An error occurred while fetching slots");
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchSlots();
    }
  }, [username, eventSlug]);

  const handleBook = async () => {
    if (!selectedSlot || !guestName || !guestEmail) return;
    
    setBooking(true);
    setError(null);
    
    try {
      const res = await fetch("/api/v2/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          eventTypeSlug: eventSlug,
          start: selectedSlot,
          attendee: {
            name: guestName,
            email: guestEmail,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });
      
      const result = await res.json();
      
      if (result.status === "success") {
        setConfirmed(true);
      } else {
        setError(result.error?.message || "Booking failed");
      }
    } catch (err) {
      setError("An error occurred during booking");
    } finally {
      setBooking(false);
    }
  };

  const formatSlot = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateKey: string) => {
    return new Date(dateKey + "T12:00:00").toLocaleDateString([], { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-8 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-zinc-400 mb-8">
            A calendar invitation has been sent to {guestEmail}.
          </p>
          <Link 
            href="/"
            className="block w-full py-4 bg-white text-black rounded-2xl font-semibold hover:bg-zinc-200 transition"
          >
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">Planxo</span>
          </Link>
          <div className="text-sm text-zinc-400">Book with {username}</div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tighter mb-4">Schedule a meeting</h1>
          <p className="text-xl text-zinc-400 max-w-md mx-auto">
            Choose a time that works for you.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <div className="font-semibold text-2xl capitalize">{username}</div>
              <div className="text-zinc-400">Host @ Planxo</div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-zinc-500">Loading availability...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-6">
                {Object.keys(slots).length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-zinc-500">No availability found for this host.</p>
                  </div>
                ) : (
                  Object.entries(slots).map(([date, daySlots]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(date)}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {daySlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-3 rounded-xl border text-center transition-all
                              ${selectedSlot === slot 
                                ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                                : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
                              }`}
                          >
                            {formatSlot(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedSlot && (
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition"
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <button
                    onClick={handleBook}
                    disabled={booking || !guestName || !guestEmail}
                    className="w-full py-4 rounded-2xl font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed
                      bg-white text-black hover:bg-zinc-200 flex items-center justify-center gap-2"
                  >
                    {booking && <Loader2 className="w-5 h-5 animate-spin" />}
                    {booking ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
