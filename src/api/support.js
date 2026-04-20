import api from './axios';

export const supportApi = {
    // Get all tickets for the authenticated user
    getTickets: async () => {
        const response = await api.get('/support/tickets');
        return response.data;
    },

    // Create a new support ticket
    createTicket: async (data) => {
        const response = await api.post('/support/tickets', data);
        return response.data;
    },

    // Get a specific ticket with comments
    getTicket: async (ticketId) => {
        const response = await api.get(`/support/tickets/${ticketId}`);
        return response.data;
    },

    // Add a comment to a ticket
    addComment: async (ticketId, body) => {
        const response = await api.post(`/support/tickets/${ticketId}/comments`, { body });
        return response.data;
    },

    // Get available categories
    getCategories: async () => {
        const response = await api.get('/support/categories');
        return response.data;
    },
};

export default supportApi;
