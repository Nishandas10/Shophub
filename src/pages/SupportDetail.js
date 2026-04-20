import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

function SupportDetail() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const response = await supportApi.getTicket(id);
            setTicket(response.ticket);
            setComments(response.comments || []);
        } catch (err) {
            console.error('Failed to fetch ticket:', err);
            setError('Failed to load ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            await supportApi.addComment(id, newComment);
            setNewComment('');
            fetchTicket(); // Refresh to get updated comments
        } catch (err) {
            console.error('Failed to add comment:', err);
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

    if (error || !ticket) {
        return (
            <div className="container py-5 text-center">
                <h4>{error || 'Ticket not found'}</h4>
                <Link to="/support" className="btn btn-primary mt-3">
                    Back to Support
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/support">Support</Link>
                    </li>
                    <li className="breadcrumb-item active">{ticket.ticket_number}</li>
                </ol>
            </nav>

            <div className="row">
                {/* Main Content */}
                <div className="col-lg-8">
                    {/* Ticket Header */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="d-flex gap-2 mb-3">
                                <span className={`badge bg-${statusColors[ticket.status]}`}>
                                    {ticket.status?.replace('_', ' ')}
                                </span>
                                <span className={`badge bg-${priorityColors[ticket.priority]}`}>
                                    {ticket.priority}
                                </span>
                                {ticket.category && (
                                    <span className="badge bg-light text-dark">
                                        {ticket.category}
                                    </span>
                                )}
                            </div>
                            <h4 className="mb-3">{ticket.title}</h4>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-chat-dots me-2"></i>
                                Conversation ({comments.length})
                            </h5>
                        </div>
                        <div className="card-body">
                            {comments.length === 0 ? (
                                <p className="text-muted text-center py-3">
                                    No replies yet. Our support team will respond soon.
                                </p>
                            ) : (
                                <div className="comments-list">
                                    {comments.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className={`d-flex mb-3 ${
                                                comment.author_role !== 'user' ? '' : 'flex-row-reverse'
                                            }`}
                                        >
                                            <div
                                                className={`p-3 rounded-3 ${
                                                    comment.author_role !== 'user'
                                                        ? 'bg-light'
                                                        : 'bg-primary bg-opacity-10'
                                                }`}
                                                style={{ maxWidth: '80%' }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <strong className="small">
                                                        {comment.author}
                                                        {comment.author_role !== 'user' && (
                                                            <span className="badge bg-secondary ms-2">
                                                                Support
                                                            </span>
                                                        )}
                                                    </strong>
                                                    <small className="text-muted ms-3">
                                                        {new Date(comment.created_at).toLocaleString()}
                                                    </small>
                                                </div>
                                                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                                    {comment.body}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply Form */}
                            {ticket.status !== 'closed' && (
                                <form onSubmit={handleSubmitComment} className="mt-4 pt-4 border-top">
                                    <div className="mb-3">
                                        <label className="form-label">Add a Reply</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Type your message here..."
                                            required
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting || !newComment.trim()}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-send me-2"></i>
                                                Send Reply
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {ticket.status === 'closed' && (
                                <div className="alert alert-secondary mt-4 mb-0">
                                    <i className="bi bi-lock me-2"></i>
                                    This ticket is closed. Please create a new ticket if you need further assistance.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">Ticket Details</h6>
                        </div>
                        <div className="card-body">
                            <table className="table table-borderless table-sm mb-0">
                                <tbody>
                                    <tr>
                                        <td className="text-muted">Ticket Number</td>
                                        <td className="fw-semibold">{ticket.ticket_number}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Status</td>
                                        <td>
                                            <span className={`badge bg-${statusColors[ticket.status]}`}>
                                                {ticket.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Priority</td>
                                        <td>
                                            <span className={`badge bg-${priorityColors[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                    </tr>
                                    {ticket.assigned_agent && (
                                        <tr>
                                            <td className="text-muted">Assigned To</td>
                                            <td className="fw-semibold">{ticket.assigned_agent}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="text-muted">Created</td>
                                        <td>{new Date(ticket.created_at).toLocaleString()}</td>
                                    </tr>
                                    {ticket.resolved_at && (
                                        <tr>
                                            <td className="text-muted">Resolved</td>
                                            <td>{new Date(ticket.resolved_at).toLocaleString()}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card mt-4">
                        <div className="card-body text-center">
                            <i className="bi bi-headset display-4 text-primary mb-3"></i>
                            <h6>Need Quick Help?</h6>
                            <p className="small text-muted mb-0">
                                Our support team typically responds within 24 hours.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SupportDetail;
