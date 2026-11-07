import React, { useState, useEffect } from 'react';
import { Package, MapPin, User, Coins, Truck, Clock, CheckCircle2, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function DashboardPage({ onContinueShopping }) {
  const { user, updateProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'profile'
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [totalSpent, setTotalSpent] = useState('0');
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState('');

  // Add address modal / state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPostal, setNewPostal] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, addrRes] = await Promise.all([
        api.getMyOrders().catch(() => ({ orders: [], total_spent: '0', reward_points: 0 })),
        api.getAddresses().catch(() => ({ addresses: [] })),
      ]);
      setOrders(orderRes.orders || []);
      setTotalSpent(orderRes.total_spent || '0');
      setRewardPoints(orderRes.reward_points || 0);
      setAddresses(addrRes.addresses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ first_name: firstName, last_name: lastName, email });
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg(err.message || 'Failed to update profile.');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.addAddress({
        full_name: newFullName,
        street_address: newStreet,
        city: newCity,
        state: newState,
        postal_code: newPostal,
        is_default: addresses.length === 0,
      });
      setShowAddAddress(false);
      setNewFullName('');
      setNewStreet('');
      setNewCity('');
      setNewPostal('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.deleteAddress(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const activeShipmentsCount = orders.filter((o) => o.order_status === 'Processing' || o.order_status === 'Shipped').length;

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>
      
      {/* Header Profile Badge */}
      <div 
        className="glass"
        style={{
          borderRadius: 24,
          padding: '32px 36px',
          marginBottom: 32,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: 800,
            color: '#090d16',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)'
          }}>
            {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </h1>
              <span className="badge-gold">VIP Member</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: 4 }}>
              {user?.email || 'Customer Account'}
            </p>
          </div>
        </div>

        <button onClick={onContinueShopping} className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          Explore Store ➔
        </button>
      </div>

      {/* 4 Stat Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 36,
      }}>
        <div className="glass" style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 12 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Total Orders</span>
            <Package size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {orders.length}
          </div>
        </div>

        <div className="glass" style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 12 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Total Spent</span>
            <span style={{ color: '#fbbf24', fontWeight: 800 }}>INR</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
            ₹{Number(totalSpent).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="glass" style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 12 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Active Shipments</span>
            <Truck size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {activeShipmentsCount}
          </div>
        </div>

        <div className="glass" style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 12 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>UrbanCoins</span>
            <Coins size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
            {rewardPoints}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
            1 Coin = ₹1 instant discount
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{
        display: 'flex',
        gap: 12,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: 28,
        paddingBottom: 4,
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: 'none',
            padding: '12px 18px',
            fontSize: '0.94rem',
            fontWeight: 700,
            color: activeTab === 'orders' ? '#fbbf24' : '#94a3b8',
            borderBottom: activeTab === 'orders' ? '2px solid #f59e0b' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Package size={17} />
          Order History ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          style={{
            background: 'none',
            padding: '12px 18px',
            fontSize: '0.94rem',
            fontWeight: 700,
            color: activeTab === 'addresses' ? '#fbbf24' : '#94a3b8',
            borderBottom: activeTab === 'addresses' ? '2px solid #f59e0b' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <MapPin size={17} />
          Address Book ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            padding: '12px 18px',
            fontSize: '0.94rem',
            fontWeight: 700,
            color: activeTab === 'profile' ? '#fbbf24' : '#94a3b8',
            borderBottom: activeTab === 'profile' ? '2px solid #f59e0b' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <User size={17} />
          Profile Settings
        </button>
      </div>

      {/* TAB 1: ORDER HISTORY */}
      {activeTab === 'orders' && (
        <div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="glass" style={{ padding: 60, textAlign: 'center', borderRadius: 24 }}>
              <Package size={44} color="#64748b" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', marginBottom: 8 }}>No orders placed yet</h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: 20 }}>
                Explore trending streetwear hoodies, sneakers, and gadgets in our store.
              </p>
              <button onClick={onContinueShopping} className="btn-gold">
                Start Shopping
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {orders.map((order) => {
                const isDelivered = order.order_status === 'Delivered';
                const isShipped = order.order_status === 'Shipped';

                return (
                  <div
                    key={order.id}
                    className="glass"
                    style={{
                      borderRadius: 20,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {/* Order Top Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      paddingBottom: 16,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                            Order #{order.id}
                          </span>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            background: isDelivered ? 'rgba(16, 185, 129, 0.15)' : (isShipped ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                            color: isDelivered ? '#10b981' : (isShipped ? '#3b82f6' : '#fbbf24'),
                            border: `1px solid ${isDelivered ? 'rgba(16, 185, 129, 0.3)' : (isShipped ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)')}`
                          }}>
                            {order.order_status}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          Payment: {order.payment_status}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                              {item.product_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#cbd5e1' }}>
                            ₹{Number(item.get_total_price || (item.price * item.quantity)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Address Footer */}
                    <div style={{
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '0.82rem',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <MapPin size={14} color="#f59e0b" />
                      Shipped to: {order.address}, {order.city} - {order.postal_code}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADDRESS BOOK */}
      {activeTab === 'addresses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              Saved Shipping Addresses
            </h3>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="btn-gold"
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <Plus size={16} />
              Add New Address
            </button>
          </div>

          {/* Add Address Form */}
          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="glass" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>New Address Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 4 }}>Street Address</label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 4 }}>City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 4 }}>State</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 4 }}>Postal Code / PIN</label>
                  <input
                    type="text"
                    required
                    value={newPostal}
                    onChange={(e) => setNewPostal(e.target.value)}
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#f8fafc' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <button type="submit" className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.88rem' }}>Save Address</button>
                <button type="button" onClick={() => setShowAddAddress(false)} className="btn-dark" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>Cancel</button>
              </div>
            </form>
          )}

          {/* Saved Addresses List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {addresses.map((addr) => (
              <div key={addr.id} className="glass" style={{ padding: 22, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{addr.full_name}</div>
                    {addr.is_default && <span className="badge-gold">Default</span>}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    {addr.street_address}<br />
                    {addr.city}, {addr.state} - {addr.postal_code}
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleDeleteAddress(addr.id)} style={{ background: 'none', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <div className="glass" style={{ maxWidth: 600, padding: 32, borderRadius: 24 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
            Personal Details
          </h3>

          {profileMsg && (
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '10px 14px', borderRadius: 12, marginBottom: 16, fontSize: '0.88rem' }}>
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: '#cbd5e1', marginBottom: 6 }}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: '#cbd5e1', marginBottom: 6 }}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: '#cbd5e1', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#f8fafc' }}
              />
            </div>

            <button type="submit" className="btn-gold" style={{ marginTop: 12, padding: '14px', fontSize: '0.94rem' }}>
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
