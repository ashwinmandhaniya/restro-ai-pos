import { create } from 'zustand'
import api from '../lib/api'

const useReservationStore = create((set, get) => ({
  reservations: [],
  isLoading: false,
  error: null,
  viewMode: 'timeline', // 'timeline', 'calendar', 'grid'
  selectedDate: new Date().toISOString().split('T')[0],

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchReservations: async (date = null, status = null) => {
    set({ isLoading: true, error: null })
    try {
      const query = new URLSearchParams()
      if (date) query.append('date', date)
      if (status) query.append('status', status)
      
      const response = await api.get(`/tenant/reservations?${query.toString()}`)
      set({ reservations: response.data.data })
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch reservations' })
    } finally {
      set({ isLoading: false })
    }
  },

  createReservation: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/tenant/reservations', data)
      // Fetch again to update the list, or optimistically add
      get().fetchReservations(get().selectedDate)
      return { success: true, data: response.data.data }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create reservation' })
      return { success: false, error: error.response?.data?.message }
    } finally {
      set({ isLoading: false })
    }
  },

  updateReservation: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.put(`/tenant/reservations/${id}`, data)
      set((state) => ({
        reservations: state.reservations.map(r => r._id === id ? response.data.data : r)
      }))
      return { success: true, data: response.data.data }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update reservation' })
      return { success: false, error: error.response?.data?.message }
    } finally {
      set({ isLoading: false })
    }
  },

  deleteReservation: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await api.delete(`/tenant/reservations/${id}`)
      set((state) => ({
        reservations: state.reservations.filter(r => r._id !== id)
      }))
      return { success: true }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete reservation' })
      return { success: false, error: error.response?.data?.message }
    } finally {
      set({ isLoading: false })
    }
  },

  markSeated: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post(`/tenant/reservations/${id}/seat`)
      // Refresh reservations to reflect status change
      get().fetchReservations(get().selectedDate)
      return { success: true, data: response.data.data }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to mark as seated' })
      return { success: false, error: error.response?.data?.message }
    } finally {
      set({ isLoading: false })
    }
  }
}))

export default useReservationStore
