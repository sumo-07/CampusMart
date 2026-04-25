import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { addAddress, setDefaultAddress } from '../../utils/addressUtils';
import '../css/addressModal.css';

export const AddressModal = ({ isOpen, onClose }) => {
    const { user, setUser } = useContext(AuthContext);
    
    const [showNewForm, setShowNewForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New Address State
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [pincode, setPincode] = useState("");
    const [phone, setPhone] = useState("");

    if (!isOpen) return null;

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

    const handleSaveNewAddress = async () => {
        if (!fullName || !address || !city || !pincode || !phone) {
            alert("Please fill in all details.");
            return;
        }

        if (!/^\d{10}$/.test(phone)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }
        if (!/^\d{5,6}$/.test(pincode)) {
            alert("Please enter a valid numeric pincode (5-6 digits).");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = { fullName, address, city, pincode, phone };
            const updatedAddresses = await addAddress(payload);
            setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
            setShowNewForm(false);
            setFullName(""); setAddress(""); setCity(""); setPincode(""); setPhone("");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to save address");
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
                            {addr.isDefault && <span className="default-badge">DEFAULT</span>}
                            <p className="address-name">{addr.fullName}</p>
                            <p className="address-details">{addr.address}</p>
                            <p className="address-details">{addr.city}, {addr.pincode}</p>
                            <p className="address-details">Phone: {addr.phone}</p>
                        </div>
                    ))}
                </div>

                {!showNewForm && (
                    <button className="add-new-btn" onClick={() => setShowNewForm(true)}>
                        + Add a new address
                    </button>
                )}

                {showNewForm && (
                    <div className="new-address-form">
                        <h3 style={{ fontSize: '1rem', color: '#1e293b' }}>New Address</h3>
                        <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
                        <input type="text" placeholder="Street Address" value={address} onChange={e => setAddress(e.target.value)} />
                        <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                        <input type="text" placeholder="Pincode (e.g. 110001)" value={pincode} onChange={e => setPincode(e.target.value)} />
                        <input type="text" placeholder="10-digit Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="save-btn" style={{ flex: 1 }} onClick={handleSaveNewAddress}>
                                Save Address
                            </button>
                            <button className="save-btn" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={() => setShowNewForm(false)}>
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
