import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function ProductForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
    });
    const [image, setImage] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [features, setFeatures] = useState('');

    useEffect(() => {
        if (isEdit) {
            api.get(`/products/${id}`).then(res => {
                const p = res.data;
                setForm({
                    name: p.name,
                    description: p.description || '',
                    price: p.price,
                    category: p.category,
                    stock: p.stock,
                });
            }).catch(() => navigate('/admin/products'));
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerateDescription = async () => {
        if (!form.name) {
            alert('Please enter a product name first.');
            return;
        }
        setAiLoading(true);
        try {
            const res = await api.post('/admin/ai/generate-description', {
                name: form.name,
                features: features || form.category || 'general product',
            });
            if (res.data.description) {
                setForm(prev => ({ ...prev, description: res.data.description }));
            }
        } catch (err) {
            alert('Failed to generate description.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        const formData = new FormData();
        Object.keys(form).forEach(key => formData.append(key, form[key]));
        if (image) formData.append('image', image);

        try {
            if (isEdit) {
                formData.append('_method', 'PUT');
                await api.post(`/admin/products/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.post('/admin/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            navigate('/admin/products');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>

            <div className="row">
                <div className="col-md-8">
                    <form onSubmit={handleSubmit}>
                        <div className="card">
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">Product Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        name="description"
                                        className="form-control"
                                        rows="5"
                                        value={form.description}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Price *</label>
                                        <input
                                            type="number"
                                            name="price"
                                            step="0.01"
                                            min="0"
                                            className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                            value={form.price}
                                            onChange={handleChange}
                                            required
                                        />
                                        {errors.price && <div className="invalid-feedback">{errors.price[0]}</div>}
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Category *</label>
                                        <input
                                            type="text"
                                            name="category"
                                            className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                                            value={form.category}
                                            onChange={handleChange}
                                            required
                                        />
                                        {errors.category && <div className="invalid-feedback">{errors.category[0]}</div>}
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Stock *</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            min="0"
                                            className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                                            value={form.stock}
                                            onChange={handleChange}
                                            required
                                        />
                                        {errors.stock && <div className="invalid-feedback">{errors.stock[0]}</div>}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Product Image</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={(e) => setImage(e.target.files[0])}
                                    />
                                </div>

                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/products')}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">🤖 AI Description Generator</h6>
                        </div>
                        <div className="card-body">
                            <p className="small text-muted">
                                Enter product features and let AI generate a marketing description.
                            </p>
                            <div className="mb-3">
                                <label className="form-label small">Product Features / Keywords</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    placeholder="e.g., wireless, bluetooth 5.0, noise cancelling, 30hr battery"
                                    value={features}
                                    onChange={(e) => setFeatures(e.target.value)}
                                />
                            </div>
                            <button
                                className="btn btn-outline-primary w-100"
                                onClick={handleGenerateDescription}
                                disabled={aiLoading || !form.name}
                            >
                                {aiLoading ? 'Generating...' : 'Generate Description'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
