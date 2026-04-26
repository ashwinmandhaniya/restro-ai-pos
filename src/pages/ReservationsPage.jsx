import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Clock, Users, Plus, Check, X, Phone,
  MapPin, UserCircle, ChevronLeft, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import useReservationStore from '@/store/reservationStore';
import useTableStore from '@/store/tableStore';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, parseISO } from 'date-fns';

const statusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/30' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/30' },
  seated:    { label: 'Seated',    cls: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30' },
  completed: { label: 'Done',      cls: 'bg-surface-100 text-surface-500 ring-1 ring-surface-200 dark:bg-surface-700/50 dark:text-surface-400 dark:ring-surface-600/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30' },
  'no-show': { label: 'No-Show',   cls: 'bg-pink-100 text-pink-700 ring-1 ring-pink-300 dark:bg-pink-500/15 dark:text-pink-400 dark:ring-pink-500/30' },
};

function DateNavigator({ value, onChange }) {
  const date = parseISO(value);
  const isToday = value === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-1 py-1 shadow-sm">
      <button
        onClick={() => onChange(format(subDays(date, 1), 'yyyy-MM-dd'))}
        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        />
        <div className="px-3 py-1.5 text-sm font-medium text-surface-900 dark:text-white min-w-[140px] text-center select-none pointer-events-none">
          {isToday ? 'Today · ' : ''}{format(date, 'dd MMM yyyy')}
        </div>
      </div>

      <button
        onClick={() => onChange(format(addDays(date, 1), 'yyyy-MM-dd'))}
        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function StatsBar({ reservations }) {
  const stats = [
    { label: 'Total',     value: reservations.length,                                        light: 'text-surface-800', dark: 'dark:text-white' },
    { label: 'Confirmed', value: reservations.filter(r => r.status === 'confirmed').length,  light: 'text-blue-600',    dark: 'dark:text-blue-400' },
    { label: 'Seated',    value: reservations.filter(r => r.status === 'seated').length,     light: 'text-emerald-600', dark: 'dark:text-emerald-400' },
    { label: 'Pending',   value: reservations.filter(r => r.status === 'pending').length,    light: 'text-amber-600',   dark: 'dark:text-amber-400' },
    { label: 'No-Show',   value: reservations.filter(r => r.status === 'no-show').length,    light: 'text-pink-600',    dark: 'dark:text-pink-400' },
  ];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 py-3 border-b border-surface-200 dark:border-surface-800 mb-4">
      {stats.map(s => (
        <div key={s.label} className="flex items-center gap-2">
          <span className={cn('text-xl font-bold tabular-nums', s.light, s.dark)}>{s.value}</span>
          <span className="text-xs text-surface-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function ReservationCard({ res, onClick }) {
  const sc = statusConfig[res.status] || statusConfig.pending;
  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 hover:shadow-md rounded-2xl p-4 cursor-pointer transition-all"
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-surface-900 dark:text-white truncate">{res.customerName}</h3>
            <p className="text-xs text-surface-500 capitalize">{res.source || 'walk-in'}</p>
          </div>
        </div>
        <span className={cn('flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide', sc.cls)}>
          {sc.label}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
          <Clock className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <span>{res.timeSlot?.start}{res.timeSlot?.end && res.timeSlot.end !== 'TBD' ? ` – ${res.timeSlot.end}` : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{res.guestCount} {res.guestCount === 1 ? 'Guest' : 'Guests'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className={cn('w-3.5 h-3.5 flex-shrink-0', res.tableIds?.length > 0 ? 'text-amber-500' : 'text-red-400')} />
          <span className={res.tableIds?.length > 0 ? 'text-surface-600 dark:text-surface-400' : 'text-red-500 dark:text-red-400'}>
            {res.tableIds?.length > 0 ? res.tableIds.map(t => t.name || t).join(', ') : 'Unassigned'}
          </span>
        </div>
      </div>

      {res.noShowRiskScore !== undefined && res.noShowRiskScore > 60 && (
        <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-surface-400 uppercase tracking-wide">No-Show Risk</span>
            <span className={cn('text-xs font-bold', res.noShowRiskScore > 75 ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400')}>
              {res.noShowRiskScore}%
            </span>
          </div>
          <div className="h-1 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', res.noShowRiskScore > 75 ? 'bg-red-500' : 'bg-amber-500')}
              style={{ width: `${res.noShowRiskScore}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ReservationsPage() {
  const {
    reservations, isLoading, viewMode, setViewMode,
    selectedDate, setSelectedDate, fetchReservations,
    markSeated
  } = useReservationStore();
  const { fetchTables } = useTableStore();
  const { addNotification } = useUIStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [walkInForm, setWalkInForm] = useState({ name: '', phone: '', guests: 2, time: '' });

  useEffect(() => {
    fetchReservations(selectedDate);
    fetchTables();
  }, [selectedDate, fetchReservations, fetchTables]);

  const handleSeat = async (res) => {
    const result = await markSeated(res._id);
    if (result.success) {
      addNotification({ title: 'Success', message: 'Guests have been seated and a POS order created.', type: 'success' });
      setSelectedRes(null);
    } else {
      addNotification({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  return (
    <div className="-m-6 flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>

      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/60 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Reservations</h1>
          <p className="text-xs text-surface-500 mt-0.5">Manage table bookings and walk-ins</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DateNavigator value={selectedDate} onChange={setSelectedDate} />

          {/* View toggle */}
          <div className="flex bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-1 gap-1">
            {[
              { mode: 'timeline', Icon: LayoutGrid },
              { mode: 'list',     Icon: List },
            ].map(({ mode, Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  viewMode === mode
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-700'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline capitalize">{mode}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-primary-600/20"
          >
            <Plus className="w-4 h-4" />
            Walk-in / New
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Cards + Stats */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-50 dark:bg-surface-950">
          {reservations.length > 0 && <StatsBar reservations={reservations} />}

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm flex items-center justify-center mb-4">
                <CalendarDays className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-surface-700 dark:text-surface-300 font-semibold mb-1">No reservations</h3>
              <p className="text-surface-500 text-sm max-w-xs">
                No bookings for {format(parseISO(selectedDate), 'MMMM d, yyyy')}.<br/>
                Add a walk-in or new booking to get started.
              </p>
            </div>
          ) : (
            <div className={cn(
              'grid gap-4',
              viewMode === 'timeline'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1 max-w-2xl'
            )}>
              {reservations.map(res => (
                <ReservationCard
                  key={res._id}
                  res={res}
                  onClick={() => setSelectedRes(res)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail Sidebar */}
        <AnimatePresence>
          {selectedRes && (
            <motion.aside
              key="sidebar"
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-[340px] flex-shrink-0 border-l border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800 flex-shrink-0">
                <h2 className="font-bold text-surface-900 dark:text-white">Reservation Details</h2>
                <button
                  onClick={() => setSelectedRes(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">{selectedRes.customerName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-surface-500 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedRes.customerPhone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-surface-500 text-sm">Status</span>
                  <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide', (statusConfig[selectedRes.status] || statusConfig.pending).cls)}>
                    {(statusConfig[selectedRes.status] || statusConfig.pending).label}
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Date',   value: format(parseISO(selectedRes.date || selectedDate), 'MMM d, yyyy') },
                    { label: 'Time',   value: `${selectedRes.timeSlot?.start || '—'}${selectedRes.timeSlot?.end && selectedRes.timeSlot.end !== 'TBD' ? ` – ${selectedRes.timeSlot.end}` : ''}` },
                    { label: 'Guests', value: `${selectedRes.guestCount} ${selectedRes.guestCount === 1 ? 'Guest' : 'Guests'}` },
                    { label: 'Table',  value: selectedRes.tableIds?.length > 0 ? selectedRes.tableIds.map(t => t.name || t).join(', ') : 'Auto-assign' },
                    { label: 'Source', value: selectedRes.source || 'Walk-in', capitalize: true },
                  ].map(({ label, value, capitalize }) => (
                    <div key={label} className="flex justify-between items-center py-2.5 px-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                      <span className="text-surface-500 text-sm">{label}</span>
                      <span className={cn('text-sm font-semibold text-surface-900 dark:text-white', capitalize && 'capitalize')}>{value}</span>
                    </div>
                  ))}
                </div>

                {selectedRes.specialRequests && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                    <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">Special Request</p>
                    <p className="text-surface-700 dark:text-surface-300 text-sm">{selectedRes.specialRequests}</p>
                  </div>
                )}

                {selectedRes.noShowRiskScore !== undefined && (
                  <div className="p-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-surface-500 text-xs font-semibold uppercase tracking-wide">AI No-Show Risk</span>
                      <span className={cn('text-sm font-bold',
                        selectedRes.noShowRiskScore > 75 ? 'text-red-600 dark:text-red-400' :
                        selectedRes.noShowRiskScore > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      )}>
                        {selectedRes.noShowRiskScore}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500',
                          selectedRes.noShowRiskScore > 75 ? 'bg-red-500' :
                          selectedRes.noShowRiskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${selectedRes.noShowRiskScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-surface-200 dark:border-surface-800 space-y-2 flex-shrink-0">
                {selectedRes.status === 'confirmed' && (
                  <button
                    onClick={() => handleSeat(selectedRes)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Mark as Seated
                  </button>
                )}
                {['pending', 'confirmed'].includes(selectedRes.status) && (
                  <button className="w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-colors border border-red-200 dark:border-red-500/20">
                    Cancel Reservation
                  </button>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Add Walk-in Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-surface-900 dark:text-white">New Booking</h2>
                  <p className="text-xs text-surface-500 mt-0.5">Add a walk-in or new reservation</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Guest Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={walkInForm.name}
                    onChange={e => setWalkInForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:border-primary-500 text-surface-900 dark:text-white placeholder-surface-400 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={walkInForm.phone}
                    onChange={e => setWalkInForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:border-primary-500 text-surface-900 dark:text-white placeholder-surface-400 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Guests</label>
                    <input
                      type="number" min={1} max={20}
                      value={walkInForm.guests}
                      onChange={e => setWalkInForm(f => ({ ...f, guests: e.target.value }))}
                      className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:border-primary-500 text-surface-900 dark:text-white rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Time</label>
                    <input
                      type="time"
                      value={walkInForm.time}
                      onChange={e => setWalkInForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:border-primary-500 text-surface-900 dark:text-white rounded-xl px-4 py-2.5 outline-none transition-colors text-sm [color-scheme:dark]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full mt-2 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary-600/20"
                >
                  Confirm Booking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
