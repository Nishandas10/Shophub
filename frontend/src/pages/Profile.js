import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [activeTab, setActiveTab] = useState('profile');

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone: '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [profileSuccess, setProfileSuccess] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Address form state
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressForm, setAddressForm] = useState({
        label: 'Home',
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false,
    });
    const [addressErrors, setAddressErrors] = useState({});
    const [savingAddress, setSavingAddress] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.get('/profile');
            setProfile(res.data);
            setAddresses(res.data.addresses || []);
            setProfileForm(prev => ({
                ...prev,
                name: res.data.name || '',
                email: res.data.email || '',
                phone: res.data.phone || '',
            }));
        } catch (e) {
            console.error('Failed to fetch profile', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileErrors({});
        setProfileSuccess('');

        try {
            const data = {
                name: profileForm.name,
                email: profileForm.email,
                phone: profileForm.phone,
            };

            if (profileForm.password) {
                data.current_password = profileForm.current_password;
                data.password = profileForm.password;
                data.password_confirmation = profileForm.password_confirmation;
            }

            const res = await api.put('/profile', data);
            setProfileSuccess('Profile updated successfully!');
            setUser(res.data.user);
            setProfileForm(prev => ({
                ...prev,
                current_password: '',
                password: '',
                password_confirmation: '',
            }));
        } catch (err) {
            if (err.response?.status === 422) {
                setProfileErrors(err.response.data.errors || {});
            } else {
                setProfileErrors({ general: err.response?.data?.message || 'Failed to update profile.' });
            }
        } finally {
            setSavingProfile(false);
        }
    };

    const resetAddressForm = () => {
        setAddressForm({
            label: 'Home',
            full_name: user?.name || '',
            phone: profile?.phone || '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            pincode: '',
            is_default: addresses.length === 0,
        });
        setEditingAddress(null);
        setAddressErrors({});
    };

    const handleAddAddress = () => {
        resetAddressForm();
        setShowAddressForm(true);
    };

    const handleEditAddress = (address) => {
        setAddressForm({
            label: address.label,
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || '',
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            is_default: address.is_default,
        });
        setEditingAddress(address);
        setShowAddressForm(true);
        setAddressErrors({});
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        setSavingAddress(true);
        setAddressErrors({});

        try {
            if (editingAddress) {
                await api.put(`/addresses/${editingAddress.id}`, addressForm);
            } else {
                await api.post('/addresses', addressForm);
            }
            setShowAddressForm(false);
            fetchProfile();
        } catch (err) {
            if (err.response?.status === 422) {
                setAddressErrors(err.response.data.errors || {});
            } else {
                setAddressErrors({ general: err.response?.data?.message || 'Failed to save address.' });
            }
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;

        try {
            await api.delete(`/addresses/${addressId}`);
            fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete address.');
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            await api.put(`/addresses/${addressId}/default`);
            fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to set default address.');
        }
    };

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border" />
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2 className="mb-4">My Account</h2>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        👤 Profile
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'addresses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('addresses')}
                    >
                        📍 Addresses ({addresses.length})
                    </button>
                </li>
            </ul>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Profile Information</h5>
                            </div>
                            <div className="card-body">
                                {profileSuccess && (
                                    <div className="alert alert-success">{profileSuccess}</div>
                                )}
                                {profileErrors.general && (
                                    <div className="alert alert-danger">{profileErrors.general}</div>
                                )}

                                <form onSubmit={handleProfileSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Full Name</label>
                                            <input
                                                type="text"
                                                className={`form-control ${profileErrors.name ? 'is-invalid' : ''}`}
                                                value={profileForm.name}
                                                onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                            {profileErrors.name && <div className="invalid-feedback">{profileErrors.name[0]}</div>}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className={`form-control ${profileErrors.email ? 'is-invalid' : ''}`}
                                                value={profileForm.email}
                                                onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                            />
                                            {profileErrors.email && <div className="invalid-feedback">{profileErrors.email[0]}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            className={`form-control ${profileErrors.phone ? 'is-invalid' : ''}`}
                                            value={profileForm.phone}
                                            onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="+91 98765 43210"
                                        />
                                        {profileErrors.phone && <div className="invalid-feedback">{profileErrors.phone[0]}</div>}
                                    </div>

                                    <hr className="my-4" />
                                    <h6 className="mb-3">Change Password (optional)</h6>

                                    <div className="mb-3">
                                        <label className="form-label">Current Password</label>
                                        <input
                                            type="password"
                                            className={`form-control ${profileErrors.current_password ? 'is-invalid' : ''}`}
                                            value={profileForm.current_password}
                                            onChange={e => setProfileForm(prev => ({ ...prev, current_password: e.target.value }))}
                                        />
                                        {profileErrors.current_password && <div className="invalid-feedback">{profileErrors.current_password[0]}</div>}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">New Password</label>
                                            <input
                                                type="password"
                                                className={`form-control ${profileErrors.password ? 'is-invalid' : ''}`}
                                                value={profileForm.password}
                                                onChange={e => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                                            />
                                            {profileErrors.password && <div className="invalid-feedback">{profileErrors.password[0]}</div>}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Confirm New Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={profileForm.password_confirmation}
                                                onChange={e => setProfileForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={savingProfile}
                                    >
                                        {savingProfile ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Saving...
                                            </>
                                        ) : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card">
                            <div className="card-body text-center">
                                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                     style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                                    {profile?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <h5>{profile?.name}</h5>
                                <p className="text-muted mb-1">{profile?.email}</p>
                                {profile?.phone && <p className="text-muted">{profile.phone}</p>}
                                <span className={`badge ${profile?.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                                    {profile?.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
                <div>
                    {!showAddressForm ? (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Saved Addresses</h5>
                                <button className="btn btn-primary" onClick={handleAddAddress}>
                                    + Add New Address
                                </button>
                            </div>

                            {addresses.length === 0 ? (
                                <div className="card">
                                    <div className="card-body text-center py-5">
                                        <p className="text-muted mb-3">No addresses saved yet.</p>
                                        <button className="btn btn-outline-primary" onClick={handleAddAddress}>
                                            Add Your First Address
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="row">
                                    {addresses.map(address => (
                                        <div key={address.id} className="col-md-6 mb-3">
                                            <div className={`card h-100 ${address.is_default ? 'border-primary' : ''}`}>
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <span className="badge bg-secondary me-2">{address.label}</span>
                                                            {address.is_default && (
                                                                <span className="badge bg-primary">Default</span>
                                                            )}
                                                        </div>
                                                        <div className="dropdown">
                                                            <button className="btn btn-link p-0" data-bs-toggle="dropdown">
                                                                ⋮
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li>
                                                                    <button className="dropdown-item" onClick={() => handleEditAddress(address)}>
                                                                        Edit
                                                                    </button>
                                                                </li>
                                                                {!address.is_default && (
                                                                    <li>
                                                                        <button className="dropdown-item" onClick={() => handleSetDefault(address.id)}>
                                                                            Set as Default
                                                                        </button>
                                                                    </li>
                                                                )}
                                                                <li><hr className="dropdown-divider" /></li>
                                                                <li>
                                                                    <button className="dropdown-item text-danger" onClick={() => handleDeleteAddress(address.id)}>
                                                                        Delete
                                                                    </button>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <h6 className="mb-1">{address.full_name}</h6>
                                                    <p className="mb-1 small">{address.address_line1}</p>
                                                    {address.address_line2 && (
                                                        <p className="mb-1 small">{address.address_line2}</p>
                                                    )}
                                                    <p className="mb-1 small">
                                                        {address.city}, {address.state} - {address.pincode}
                                                    </p>
                                                    <p className="mb-0 small text-muted">📞 {address.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Address Form */
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">{editingAddress ? 'Edit Address' : 'Add New Address'}</h5>
                                <button
                                    className="btn btn-link"
                                    onClick={() => setShowAddressForm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="card-body">
                                {addressErrors.general && (
                                    <div className="alert alert-danger">{addressErrors.general}</div>
                                )}

                                <form onSubmit={handleAddressSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Address Label</label>
                                            <select
                                                className="form-select"
                                                value={addressForm.label}
                                                onChange={e => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                                            >
                                                <option value="Home">Home</option>
                                                <option value="Work">Work</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Full Name *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${addressErrors.full_name ? 'is-invalid' : ''}`}
                                                value={addressForm.full_name}
                                                onChange={e => setAddressForm(prev => ({ ...prev, full_name: e.target.value }))}
                                                required
                                            />
                                            {addressErrors.full_name && <div className="invalid-feedback">{addressErrors.full_name[0]}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Phone Number *</label>
                                        <input
                                            type="tel"
                                            className={`form-control ${addressErrors.phone ? 'is-invalid' : ''}`}
                                            value={addressForm.phone}
                                            onChange={e => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                                            required
                                        />
                                        {addressErrors.phone && <div className="invalid-feedback">{addressErrors.phone[0]}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Address Line 1 *</label>
                                        <input
                                            type="text"
                                            className={`form-control ${addressErrors.address_line1 ? 'is-invalid' : ''}`}
                                            value={addressForm.address_line1}
                                            onChange={e => setAddressForm(prev => ({ ...prev, address_line1: e.target.value }))}
                                            placeholder="House/Flat No., Building Name, Street"
                                            required
                                        />
                                        {addressErrors.address_line1 && <div className="invalid-feedback">{addressErrors.address_line1[0]}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Address Line 2</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={addressForm.address_line2}
                                            onChange={e => setAddressForm(prev => ({ ...prev, address_line2: e.target.value }))}
                                            placeholder="Landmark, Area (optional)"
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">City *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${addressErrors.city ? 'is-invalid' : ''}`}
                                                value={addressForm.city}
                                                onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                                required
                                            />
                                            {addressErrors.city && <div className="invalid-feedback">{addressErrors.city[0]}</div>}
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">State *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${addressErrors.state ? 'is-invalid' : ''}`}
                                                value={addressForm.state}
                                                onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                                required
                                            />
                                            {addressErrors.state && <div className="invalid-feedback">{addressErrors.state[0]}</div>}
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Pincode *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${addressErrors.pincode ? 'is-invalid' : ''}`}
                                                value={addressForm.pincode}
                                                onChange={e => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                                                maxLength="6"
                                                required
                                            />
                                            {addressErrors.pincode && <div className="invalid-feedback">{addressErrors.pincode[0]}</div>}
                                        </div>
                                    </div>

                                    <div className="form-check mb-4">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="isDefault"
                                            checked={addressForm.is_default}
                                            onChange={e => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                                        />
                                        <label className="form-check-label" htmlFor="isDefault">
                                            Set as default address
                                        </label>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={savingAddress}
                                        >
                                            {savingAddress ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Saving...
                                                </>
                                            ) : (editingAddress ? 'Update Address' : 'Save Address')}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowAddressForm(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
