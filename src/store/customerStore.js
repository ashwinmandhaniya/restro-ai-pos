import { create } from 'zustand';
import api from '../lib/api';

const useCustomerStore = create((set, get) => ({
  customers: [],
  loading: false,
  error: null,
  loyaltySettings: null,

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/tenant/customers');
      set({ customers: data.data || [], loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, loading: false });
    }
  },

  addCustomer: async (customerData) => {
    try {
      const { data } = await api.post('/tenant/customers', customerData);
      set({ customers: [data.data, ...get().customers] });
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  adjustLoyaltyPoints: async (customerId, pointsToAddOrDeduct, reason) => {
    try {
      const { data } = await api.put(`/tenant/customers/${customerId}/points`, {
        points: pointsToAddOrDeduct,
        reason
      });
      // Replace customer in state
      set({
        customers: get().customers.map(c => 
          c._id === customerId ? { ...c, loyaltyPoints: data.data.loyaltyPoints } : c
        )
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to adjust points' };
    }
  },

  updateLoyaltySettings: async (settings) => {
    try {
      const { data } = await api.post('/tenant/customers/loyalty-settings', settings);
      set({ loyaltySettings: data.data });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update settings' };
    }
  }
}));

export default useCustomerStore;
