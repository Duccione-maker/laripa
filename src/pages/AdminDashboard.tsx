import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { it } from "date-fns/locale";
import { subDays } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  RefreshCw, BarChart2, Tag, CalendarIcon,
  Plus, Pencil, Trash2, Monitor, Smartphone,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const APT_NAMES: Record<string, string> = {
  "1": "Padronale",
  "2": "Ghiri",
  "3": "Fienile",
  "4": "Nidi",
};

// Guest names that are just apartment names = owner blocks, not real bookings
const OWNER_BLOCK_NAMES = new Set(Object.values(APT_NAMES).map(n => n.toLowerCase()));

function isOwnerBlock(guestName: string | null): boolean {
  return OWNER_BLOCK_NAMES.has((guestName ?? "").trim().toLowerCase());
}

function ChannelBadge({ channel }: { channel: string | null }) {
  const ch = (channel ?? "").trim();
  if (/airbnb/i.test(ch))
    return <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-xs">{ch}</Badge>;
  if (/booking/i.test(ch))
    return <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">{ch}</Badge>;
  if (/direct|diretto|stripe/i.test(ch))
    return <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">{ch || "Diretto"}</Badge>;
  if (!ch || ch === "Smoobu")
    return <Badge variant="outline" className="text-xs text-muted-foreground">—</Badge>;
  return <Badge variant="secondary" className="text-xs">{ch}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs">Confermata</Badge>;
  if (status === "pending")
    return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white text-xs">In attesa</Badge>;
  return <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs">Annullata</Badge>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  apartment_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  total_price: number | null;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface AnalyticsEvent {
  id: string;
  event_type: string;
  page_path: string | null;
  session_id: string | null;
  country_code: string | null;
  user_agent: string | null;
  created_at: string;
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = subDays(new Date(), 30).toISOString();
    supabase
      .from("analytics_events")
      .select("*")
      .eq("event_type", "page_view")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setEvents((data as AnalyticsEvent[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Caricamento analytics...</div>;

  const totalViews = events.length;
  const uniqueSessions = new Set(events.map(e => e.session_id)).size;
  const mobile = events.filter(e => /Mobi|Android|iPhone|iPad/i.test(e.user_agent ?? "")).length;
  const desktop = totalViews - mobile;

  // Daily chart
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) dayMap[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
  events.forEach(e => { const d = e.created_at.split("T")[0]; if (d in dayMap) dayMap[d]++; });
  const chartData = Object.entries(dayMap).map(([date, views]) => ({
    date: format(parseISO(date), "d MMM", { locale: it }),
    views,
  }));

  // Top pages
  const pageCount: Record<string, number> = {};
  events.forEach(e => { const p = e.page_path ?? "/"; pageCount[p] = (pageCount[p] ?? 0) + 1; });
  const topPages = Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top countries
  const countryCount: Record<string, number> = {};
  events.forEach(e => { const c = e.country_code ?? "Unknown"; countryCount[c] = (countryCount[c] ?? 0) + 1; });
  const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Visite totali</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalViews}</div><p className="text-xs text-muted-foreground">ultimi 30 giorni</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Visitatori unici</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{uniqueSessions}</div><p className="text-xs text-muted-foreground">sessioni distinte</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Monitor className="h-3 w-3" />Desktop</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{desktop}</div><p className="text-xs text-muted-foreground">{totalViews ? Math.round(desktop / totalViews * 100) : 0}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Smartphone className="h-3 w-3" />Mobile</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{mobile}</div><p className="text-xs text-muted-foreground">{totalViews ? Math.round(mobile / totalViews * 100) : 0}%</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Visite per giorno</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Top 5 pagine</CardTitle></CardHeader>
          <CardContent>
            <Table><TableBody>
              {topPages.map(([page, count]) => (
                <TableRow key={page}>
                  <TableCell className="font-mono text-sm">{page}</TableCell>
                  <TableCell className="text-right font-bold">{count}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top 5 paesi</CardTitle></CardHeader>
          <CardContent>
            <Table><TableBody>
              {topCountries.map(([country, count]) => (
                <TableRow key={country}>
                  <TableCell className="font-medium">{country}</TableCell>
                  <TableCell className="text-right font-bold">{count}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Discount Codes Tab ───────────────────────────────────────────────────────

function DiscountCodesTab() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState({ code: "", discount_type: "percent", value: "", active: true, expires_at: "" });

  const fetchCodes = useCallback(async () => {
    const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
    setCodes((data as DiscountCode[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const openNew = () => {
    setEditing(null);
    setForm({ code: "", discount_type: "percent", value: "", active: true, expires_at: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: DiscountCode) => {
    setEditing(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      value: String(c.value),
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      value: parseFloat(form.value),
      active: form.active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    if (!payload.code || isNaN(payload.value)) {
      toast({ title: "Codice e valore sono obbligatori", variant: "destructive" }); return;
    }
    const { error } = editing
      ? await supabase.from("discount_codes").update(payload).eq("id", editing.id)
      : await supabase.from("discount_codes").insert(payload);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Codice aggiornato" : "Codice creato" });
    setDialogOpen(false);
    fetchCodes();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("discount_codes").delete().eq("id", id);
    if (error) { toast({ title: "Errore eliminazione", variant: "destructive" }); return; }
    toast({ title: "Codice eliminato" });
    fetchCodes();
  };

  const toggleActive = async (c: DiscountCode) => {
    await supabase.from("discount_codes").update({ active: !c.active }).eq("id", c.id);
    fetchCodes();
  };

  if (loading)
    return <div className="flex items-center justify-center h-32 text-muted-foreground">Caricamento...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-2" />Nuovo codice</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codice</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valore</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Attivo</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.discount_type === "fixed" ? "Fisso €" : "Percentuale %"}</Badge>
                  </TableCell>
                  <TableCell>{c.discount_type === "fixed" ? `€${c.value}` : `${c.value}%`}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.expires_at ? format(parseISO(c.expires_at), "d MMM yyyy", { locale: it }) : "—"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nessun codice sconto</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifica codice" : "Nuovo codice sconto"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Codice *</Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="ESTATE2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentuale %</SelectItem>
                    <SelectItem value="fixed">Fisso €</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Valore *</Label>
                <Input
                  type="number" min="0"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.discount_type === "fixed" ? "49" : "10"}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Scadenza (opzionale)</Label>
              <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Attivo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave}>{editing ? "Salva modifiche" : "Crea codice"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────

function BookingsTab() {
  const { toast } = useToast();
  const [all, setAll] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [aptFilter, setAptFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("check_in", { ascending: true });
    if (error) toast({ title: "Errore caricamento prenotazioni", variant: "destructive" });
    const real = ((data as Booking[]) ?? []).filter(b => !isOwnerBlock(b.guest_name));
    setAll(real);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = all.filter(b => {
    if (!showAll && b.check_in < today) return false;
    if (aptFilter !== "all" && b.apartment_id !== aptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.guest_name?.toLowerCase().includes(q) || b.guest_email?.toLowerCase().includes(q);
    }
    return true;
  });

  const confirmed = all.filter(b => b.status === "confirmed");
  const revenue = confirmed.reduce((s, b) => s + (b.total_price ?? 0), 0);

  if (loading)
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Caricamento...</div>;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Prenotazioni</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{all.length}</div><p className="text-xs text-muted-foreground">totali</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Confermate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{confirmed.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ricavi</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">€{revenue.toFixed(0)}</div><p className="text-xs text-muted-foreground">confermate</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">In tabella</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{filtered.length}</div><p className="text-xs text-muted-foreground">filtrate</p></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Cerca ospite o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px]"
        />
        <Select value={aptFilter} onValueChange={setAptFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Appartamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli apt.</SelectItem>
            {Object.entries(APT_NAMES).map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showAll ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? "Solo future" : "Includi passate"}
        </Button>
        <Button variant="outline" size="icon" onClick={fetchBookings}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ospite</TableHead>
                  <TableHead>Appartamento</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Notti</TableHead>
                  <TableHead>Ospiti</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Portale</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => {
                  const nights = differenceInCalendarDays(
                    parseISO(b.check_out),
                    parseISO(b.check_in)
                  );
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="font-medium whitespace-nowrap">{b.guest_name}</div>
                        {b.guest_email && (
                          <div className="text-xs text-muted-foreground">{b.guest_email}</div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {APT_NAMES[b.apartment_id] ?? `Apt ${b.apartment_id}`}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{b.check_in}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{b.check_out}</TableCell>
                      <TableCell className="text-sm">{nights > 0 ? nights : "—"}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {b.adults} ad.{b.children > 0 ? ` · ${b.children} bamb.` : ""}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {b.total_price != null ? `€${b.total_price}` : "—"}
                      </TableCell>
                      <TableCell><ChannelBadge channel={b.notes} /></TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Nessuna prenotazione trovata
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const syncWithSmoobu = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("smoobu-booking", {
      body: { action: "sync" },
    });
    setSyncing(false);
    if (error) {
      toast({ title: "Errore sync", description: error.message, variant: "destructive" });
      return;
    }
    const parts: string[] = [];
    if ((data?.synced ?? 0) > 0) parts.push(`${data.synced} nuove`);
    if ((data?.updated ?? 0) > 0) parts.push(`${data.updated} aggiornate`);
    toast({
      title: "Sync completato",
      description: parts.length > 0 ? parts.join(", ") + " prenotazioni" : "Nessuna novità",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={syncWithSmoobu} variant="outline" size="sm" disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sync in corso..." : "Sync Smoobu"}
          </Button>
        </div>

        <Tabs defaultValue="bookings">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />Prenotazioni
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />Analytics
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />Codici sconto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings"><BookingsTab /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="discounts"><DiscountCodesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
