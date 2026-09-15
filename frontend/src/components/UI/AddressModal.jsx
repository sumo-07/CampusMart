import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { addAddress, setDefaultAddress, updateAddress, deleteAddress } from '../../utils/addressUtils';
import '../css/addressModal.css';

export const AddressModal = ({ isOpen, onClose }) => {
    const { user, setUser } = useContext(AuthContext);
    
    const [showNewForm, setShowNewForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Address Form State (shared for new and edit)
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [pincode, setPincode] = useState("");
    const [phone, setPhone] = useState("");

    if (!isOpen) return null;

    const resetForm = () => {
        setFullName("");
        setAddress("");
        setCity("");
        setPincode("");
        setPhone("");
        setShowNewForm(false);
        setEditingAddressId(null);
    };

    const handleSelectAddress = async (addressId) => {
        setIsSubmitting(true);
        try {
            const updatedAddresses = await setDefaultAddress(addressId);
            setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
            onClose(); // Auto close on select
        } catch (error) {
            alert(error.response?.data?.message || "Failed to set default address");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartEdit = (addr, e) => {
        e.stopPropagation();
        setShowNewForm(false);
        setEditingAddressId(addr._id);
        setFullName(addr.fullName || "");
        setAddress(addr.address || "");
        setCity(addr.city || "");
        setPincode(addr.pincode || "");
        setPhone(addr.phone || "");
    };

    const handleDeleteAddress = async (addressId, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this address?")) {
            return;
        }

        setIsSubmitting(true);
        try {
            const updatedAddresses = await deleteAddress(addressId);
            setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
            if (editingAddressId === addressId) {
                resetForm();
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete address");
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateForm = () => {
        if (!fullName.trim() || !address.trim() || !city.trim() || !pincode.trim() || !phone.trim()) {
            alert("Please fill in all details.");
            return false;
        }

        if (!/^\d{10}$/.test(phone.trim())) {
            alert("Please enter a valid 10-digit mobile number.");
            return false;
        }
        if (!/^\d{5,6}$/.test(pincode.trim())) {
            alert("Please enter a valid numeric pincode (5-6 digits).");
            return false;
        }
        return true;
    };

    const handleSaveNewAddress = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const payload = { fullName, address, city, pincode, phone };
            const updatedAddresses = await addAddress(payload);
            setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
            resetForm();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to save address");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveEditAddress = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const payload = { fullName, address, city, pincode, phone };
            const updatedAddresses = await updateAddress(editingAddressId, payload);
            setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
            resetForm();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update address");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                
                <div className="modal-header">
                    <h2 className="modal-title">Choose your location</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>
                        Delivery options and delivery speeds may vary for different locations
                    </p>
                </div>

                <div className="address-list">
                    {user?.addresses && user.addresses.map((addr) => (
                        <div 
                            key={addr._id} 
                            className={`address-item ${addr.isDefault ? 'selected' : ''}`}
                            onClick={() => !addr.isDefault && handleSelectAddress(addr._id)}
                        >
                            <div className="address-card-header">
                                <div className="address-name-wrap">
                                    <span className="address-name">{addr.fullName}</span>
                                    {addr.isDefault && <span className="default-badge">DEFAULT</span>}
                                </div>
                                <div className="address-actions">
                                    <button
                                        type="button"
                                        className="address-action-btn edit"
                                        onClick={(e) => handleStartEdit(addr, e)}
                                        title="Edit this address"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="address-action-btn delete"
                                        onClick={(e) => handleDeleteAddress(addr._id, e)}
                                        title="Delete this address"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                            <p className="address-details">{addr.address}</p>
                            <p className="address-details">{addr.city}, {addr.pincode}</p>
                            <p className="address-details">Phone: {addr.phone}</p>
                        </div>
                    ))}
                </div>

                {!showNewForm && !editingAddressId && (
                    <button 
                        className="add-new-btn" 
                        onClick={() => {
                            resetForm();
                            setShowNewForm(true);
                        }}
                    >
                        + Add a new address
                    </button>
                )}

                {(showNewForm || editingAddressId) && (
                    <div className="new-address-form">
                        <h3 style={{ fontSize: '1rem', color: '#1e293b' }}>
                            {editingAddressId ? "Edit Address" : "New Address"}
                        </h3>
                        <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
                        <input type="text" placeholder="Street Address" value={address} onChange={e => setAddress(e.target.value)} />
                        <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                        <input type="text" placeholder="Pincode (e.g. 110001)" value={pincode} onChange={e => setPincode(e.target.value)} />
                        <input type="text" placeholder="10-digit Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                className="save-btn" 
                                style={{ flex: 1 }} 
                                onClick={editingAddressId ? handleSaveEditAddress : handleSaveNewAddress}
                            >
                                {editingAddressId ? "Update Address" : "Save Address"}
                            </button>
                            <button className="save-btn" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {isSubmitting && (
                    <div className="loading-overlay">Updating...</div>
                )}
            </div>
        </div>
    );
};
