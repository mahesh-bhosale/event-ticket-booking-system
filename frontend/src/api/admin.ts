import axiosClient from './client';
import { Event } from '../types/event.types';

export const adminApi = {
  getEvents: async (): Promise<Event[]> => {
    const response = await axiosClient.get('/admin/events');
    return response.data.data;
  },

  createEvent: async (data: Partial<Event>): Promise<Event> => {
    const response = await axiosClient.post('/admin/events', data);
    return response.data.data;
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    const response = await axiosClient.put(`/admin/events/${id}`, data);
    return response.data.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/events/${id}`);
  },
};
