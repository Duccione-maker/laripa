import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarIcon, Users, Euro, RefreshCw, BarChart2, Tag, Plus, Trash2, Pencil, Monitor, Smartphone } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const APARTMENT_NAMES: Record<string, string> = {
  '1': 'Padronale', '2': 'Ghiri', '3': 'Fienile', '4': 'Nidi',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  id: string; apartment_id: string; guest_name: string; guest_email: string;
  guest_phone: string; check_in: string; check_out: string; adults: number;
  children: number; total_price: number; currency: string; status: string;
  notes: string; created_at: string;
}

interface DiscountCode {
  id: string; code: string; discount_type: string; value: number;
  active: boolean; expires_at: string | null; created_at: string;
}

interface AnalyticsEvent {
  id: string; event_type: string; page_path: string | null;
  session_id: string | null; country_code: string | null;
  user_agent: string | null; created_at: string;
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
      .then(({ data }) => { setEvents((data as AnalyticsEvent[]) ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Caricamento analytics...</div>;

  // Unique sessions = unique visitors
  const uniqueSessions = new Set(events.map(e => e.session_id)).size;
  const totalViews = events.length;

  // Views per day (last 30)
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    dayMap[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0;
  }
  events.forEach(e => {
    const d = e.created_at.split('T')[0];
    if (d in dayMap) dayMap[d]++;
  });
  const chartData = Object.entries(dayMap).map(([date, views]) => ({
    date: format(parseISO(date), 'd MMM', { locale: it }),
    views,
  }));

  // Top 5 pages
  const pageCount: Record<string, number> = {};
  events.forEach(e => { const p = e.page_path ?? '/'; pageCount[p] = (pageCount[p] ?? 0) + 1; });
  const topPages = Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top 5 countries
  const countryCount: Record<string, number> = {};
  events.forEach(e => { const c = e.country_code ?? 'Unknown'; countryCount[c] = (countryCount[c] ?? 0) + 1; });
  const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Desktop vs Mobile
  const mobile = events.filter(e => /Mobi|Android|iPhone|iPad/i.test(e.user_agent ?? '')).length;
  const desktop = totalViews - mobile;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Visite totali</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalViews}</div><p className="text-xs text-muted-foreground">ultimi 30 giorni</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Visitatori unici</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{uniqueSessions}</div><p className="text-xs text-muted-foreground">sessioni distinte</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Monitor className="h-3 w-3"/>Desktop</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{desktop}</div><p className="text-xs text-muted-foreground">{totalViews ? Math.round(desktop/totalViews*100) : 0}%</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Smartphone className="h-3 w-3"/>Mobile</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{mobile}</div><p className="text-xs text-muted-foreground">{totalViews ? Math.round(mobile/totalViews*100) : 0}%</p></CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle>Visite per giorno</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top pages + top countries */}
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
  const [form, setForm] = useState({ code: '', discount_type: 'percent', value: '', active: true, expires_at: '' });

  const fetchCodes = useCallback(async () => {
    const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    setCodes((data as DiscountCode[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', discount_type: 'percent', value: '', active: true, expires_at: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: DiscountCode) => {
    setEditing(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      value: String(c.value),
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
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
      ? await supabase.from('discount_codes').update(payload).eq('id', editing.id)
      : await supabase.from('discount_codes').insert(payload);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Codice aggiornato" : "Codice creato" });
    setDialogOpen(false);
    fetchCodes();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) { toast({ title: "Errore eliminazione", variant: "destructive" }); return; }
    toast({ title: "Codice eliminato" });
    fetchCodes();
  };

  const toggleActive = async (c: DiscountCode) => {
    await supabase.from('discount_codes').update({ active: !c.active }).eq('id', c.id);
    fetchCodes();
  };

  if (loading) return <div className="flex items-center justify-center h-32 text-muted-foreground">Caricamento...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-2"/>Nuovo codice</Button>
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
                  <TableCell><Badge variant="outline">{c.discount_type === 'fixed' ? 'Fisso €' : 'Percentuale %'}</Badge></TableCell>
                  <TableCell>{c.discount_type === 'fixed' ? `€${c.value}` : `${c.value}%`}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.expires_at ? format(parseISO(c.expires_at), 'd MMM yyyy', { locale: it }) : '—'}
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4"/></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4"/></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Modifica codice' : 'Nuovo codice sconto'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Codice *</Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ESTATE2026"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentuale %</SelectItem>
                    <SelectItem value="fixed">Fisso €</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Valore *</Label>
                <Input type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.discount_type === 'fixed' ? '49' : '10'}/>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Scadenza (opzionale)</Label>
              <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}/>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))}/>
              <Label>Attivo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave}>{editing ? 'Salva modifiche' : 'Crea codice'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────
function BookingsTab() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) { toast({ title: "Errore caricamento prenotazioni", variant: "destructive" }); }
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    let f = bookings;
    if (search) f = f.filter(b =>
      b.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_email?.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== 'all') f = f.filter(b => b.status === statusFilter);
    setFiltered(f);
  }, [bookings, search, statusFilter]);

  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.total_price ?? 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Caricamento...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Totale</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{bookings.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ricavi</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">€{totalRevenue.toFixed(0)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">Confermate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'confirmed').length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-600">In attesa</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</div></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Cerca per nome o email..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1"/>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="pending">In attesa</SelectItem>
            <SelectItem value="confirmed">Confermata</SelectItem>
            <SelectItem value="cancelled">Annullata</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchBookings}><RefreshCw className="h-4 w-4"/></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ospite</TableHead>
                  <TableHead>Apt</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Ospiti</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Creata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{b.guest_email}</div>
                    </TableCell>
                    <TableCell>{APARTMENT_NAMES[b.apartment_id] ?? `Apt ${b.apartment_id}`}</TableCell>
                    <TableCell className="text-sm">{b.check_in}</TableCell>
                    <TableCell className="text-sm">{b.check_out}</TableCell>
                    <TableCell>{b.adults} ad.{b.children > 0 ? ` ${b.children} bamb.` : ''}</TableCell>
                    <TableCell>{b.total_price ? `€${b.total_price}` : '—'}</TableCell>
                    <TableCell>
                      <Badge className={b.status === 'confirmed' ? 'bg-green-500' : b.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(parseISO(b.created_at), 'd MMM HH:mm', { locale: it })}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nessuna prenotazione</TableCell></TableRow>
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

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const [syncing, setSyncing] = useState(false);

  const syncWithSmoobu = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke('smoobu-booking', { body: { action: 'sync' } });
    setSyncing(false);
    if (error) { toast({ title: "Errore sync", description: error.message, variant: "destructive" }); return; }
    const parts = [];
    if ((data?.synced ?? 0) > 0) parts.push(`${data.synced} nuove`);
    if ((data?.updated ?? 0) > 0) parts.push(`${data.updated} aggiornate`);
    toast({
      title: "Sync completato",
      description: parts.length > 0 ? parts.join(', ') + ' prenotazioni' : 'Nessuna novità',
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={syncWithSmoobu} variant="outline" size="sm" disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`}/>
            {syncing ? 'Sync in corso...' : 'Sync Smoobu'}
          </Button>
        </div>

        <Tabs defaultValue="analytics">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4"/>Analytics
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Tag className="h-4 w-4"/>Codici sconto
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4"/>Prenotazioni
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="discounts"><DiscountCodesTab /></TabsContent>
          <TabsContent value="bookings"><BookingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
