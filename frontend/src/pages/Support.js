import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supportApi } from '../api/support';

const statusColors = {
    open: 'primary',
    in_progress: 'warning',
    resolved: 'success',
    closed: 'secondary',
};

const priorityColors = {
    low: 'info',
    medium: 'primary',
    high: 'warning',
    urgent: 'danger',
};

function Support() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTickets();
        fetchCategories();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await supportApi.getTickets();
            setTickets(response.tickets || []);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await supportApi.getCategories();
            setCategories(response.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.title.trim()) {
            setError('Subject is required.');
            return;
        }
        if (!form.description.trim()) {
            setError('Description is required.');
            return;
        }

        setSubmitting(true);
        try {
            await supportApi.createTicket(form);
            setShowCreateModal(false);
            setForm({ title: '', description: '', category: '' });
            fetchTickets();
        } catch (err) {
            const serverMessage =
                err.response?.data?.message ||
                Object.values(err.response?.data?.messages || {}).flat()[0] ||
                'Failed to create ticket';
            setError(serverMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Support Tickets</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    New Ticket
                </button>
            </div>

            {tickets.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-ticket-detailed display-1 text-muted"></i>
                    <h4 className="mt-3">No Support Tickets</h4>
                    <p className="text-muted">
                        Need help? Create a support ticket and our team will assist you.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create Your First Ticket
                    </button>
                </div>
            ) : (
                <div className="card">
                    <div className="list-group list-group-flush">
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                to={`/support/${ticket.id}`}
                                className="list-group-item list-group-item-action"
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <span className="text-muted small">
                                                {ticket.ticket_number}
                                            </span>
                                            <span className={`badge bg-${statusColors[ticket.status]}`}>
                                                {ticket.status?.replace('_', ' ')}
                                            </span>
                                            <span className={`badge bg-${priorityColors[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <h6 className="mb-1">{ticket.title}</h6>
                                        <p className="text-muted small mb-0" style={{ maxWidth: '500px' }}>
                                            {ticket.description?.substring(0, 100)}
                                            {ticket.description?.length > 100 ? '...' : ''}
                                        </p>
                                    </div>
                                    <div className="text-end">
                                        <small className="text-muted d-block">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </small>
                                        {ticket.assigned_agent && (
                                            <small className="text-success">
                                                <i className="bi bi-person-check me-1"></i>
                                                {ticket.assigned_agent}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create Support Ticket</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowCreateModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger">{error}</div>
                                    )}
                                    <div className="mb-3">
                                        <label className="form-label">Subject</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            required
                                            placeholder="Brief description of your issue"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-select"
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.slug}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows={5}
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            required
                                            placeholder="Please describe your issue in detail. Include any relevant order numbers, product names, or error messages."
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Ticket'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Support;
