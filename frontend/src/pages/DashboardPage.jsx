import React, { useState, useEffect } from 'react';
import { Package, MapPin, User, Coins, Truck, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function DashboardPage({ onContinueShopping }) {
  const { user, updateProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('orders');
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
      setOrders(Array.isArray(orderRes?.orders) ? orderRes.orders : []);
      setTotalSpent(orderRes?.total_spent || '0');
      setRewardPoints(orderRes?.reward_points || 0);
      setAddresses(Array.isArray(addrRes?.addresses) ? addrRes.addresses : []);
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
    <div style={{ maxWidth: 1200, margin: 'clamp(18px, 4vw, 40px) auto', padding: '0 14px' }}>
      
      {/* Header Profile Badge */}
      <div 
        style={{
          borderRadius: 24,
          padding: 'clamp(18px, 4vw, 32px) clamp(16px, 4vw, 36px)',
          marginBottom: 24,
          background: 'var(--bg-hero)',
          border: '1px solid var(--border-hero)',
          boxShadow: '0 8px 30px rgba(217, 119, 6, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{
            width: 'clamp(50px, 10vw, 68px)',
            height: 'clamp(50px, 10vw, 68px)',
            borderRadius: 18,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(1.35rem, 4vw, 1.8rem)',
            fontWeight: 800,
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(217, 119, 6, 0.3)',
            flexShrink: 0,
          }}>
            {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--text-main)' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </h1>
              <span className="badge-gold">VIP Member</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginTop: 4, fontWeight: 500, wordBreak: 'break-word' }}>
              {user?.email || 'Customer Account'}
            </p>
          </div>
        </div>

        <button onClick={onContinueShopping} className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.88rem' }}>
          Explore Store ➔
        </button>
      </div>

      {/* 4 Stat Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 155px), 1fr))',
        gap: 14,
        marginBottom: 28,
      }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 'clamp(14px, 3vw, 22px)', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Total Orders</span>
            <Package size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--text-main)' }}>
            {orders.length}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 'clamp(14px, 3vw, 22px)', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Total Spent</span>
            <span style={{ color: 'var(--price-color)', fontWeight: 800 }}>INR</span>
          </div>
          <div style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--price-color)' }}>
            ₹{Number(totalSpent).toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 'clamp(14px, 3vw, 22px)', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Active Shipments</span>
            <Truck size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--text-main)' }}>
            {activeShipmentsCount}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 'clamp(14px, 3vw, 22px)', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>UrbanCoins</span>
            <Coins size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: '#10b981' }}>
            {rewardPoints}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: 4 }}>
            1 Coin = ₹1 instant discount
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="no-scrollbar" style={{
        display: 'flex',
        gap: 6,
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 24,
        paddingBottom: 4,
        overflowX: 'auto',
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: 'none',
            padding: '10px 14px',
            fontSize: '0.88rem',
            fontWeight: 800,
            color: activeTab === 'orders' ? 'var(--price-color)' : 'var(--text-dim)',
            borderBottom: activeTab === 'orders' ? '2px solid #d97706' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Package size={16} />
          Order History ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          style={{
            background: 'none',
            padding: '10px 14px',
            fontSize: '0.88rem',
            fontWeight: 800,
            color: activeTab === 'addresses' ? 'var(--price-color)' : 'var(--text-dim)',
            borderBottom: activeTab === 'addresses' ? '2px solid #d97706' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <MapPin size={16} />
          Address Book ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            padding: '10px 14px',
            fontSize: '0.88rem',
            fontWeight: 800,
            color: activeTab === 'profile' ? 'var(--price-color)' : 'var(--text-dim)',
            borderBottom: activeTab === 'profile' ? '2px solid #d97706' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <User size={16} />
          Profile Settings
        </button>
      </div>

      {/* TAB 1: ORDER HISTORY */}
      {activeTab === 'orders' && (
        <div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', borderRadius: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <Package size={44} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 8 }}>No orders placed yet</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginBottom: 20 }}>
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
                    style={{
                      borderRadius: 20,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)'
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
                      borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            Order #{order.id}
                          </span>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            background: isDelivered ? 'rgba(16, 185, 129, 0.12)' : (isShipped ? 'rgba(59, 130, 246, 0.12)' : 'var(--badge-bg)'),
                            color: isDelivered ? '#10b981' : (isShipped ? '#3b82f6' : 'var(--badge-text)'),
                            border: `1px solid ${isDelivered ? 'rgba(16, 185, 129, 0.3)' : (isShipped ? 'rgba(59, 130, 246, 0.3)' : 'var(--badge-border)')}`
                          }}>
                            {order.order_status}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--price-color)' }}>
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
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
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {item.product_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--price-color)' }}>
                            ₹{Number(item.get_total_price || (item.price * item.quantity)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Address Footer */}
                    <div style={{
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                      color: 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <MapPin size={14} color="#d97706" />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
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
            <form onSubmit={handleAddAddress} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 'clamp(16px, 4vw, 24px)', borderRadius: 20, marginBottom: 24, boxShadow: '0 4px 18px rgba(15,23,42,0.06)' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 16 }}>New Address Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Street Address</label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>State</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Postal Code / PIN</label>
                  <input
                    type="text"
                    required
                    value={newPostal}
                    onChange={(e) => setNewPostal(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button type="submit" className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.88rem' }}>Save Address</button>
                <button type="button" onClick={() => setShowAddAddress(false)} className="btn-dark" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>Cancel</button>
              </div>
            </form>
          )}

          {/* Saved Addresses List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
            {addresses.map((addr) => (
              <div key={addr.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 20, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 18px rgba(15,23,42,0.05)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{addr.full_name}</div>
                    {addr.is_default && <span className="badge-gold">Default</span>}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    {addr.street_address}<br />
                    {addr.city}, {addr.state} - {addr.postal_code}
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleDeleteAddress(addr.id)} style={{ background: 'none', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
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
        <div style={{ maxWidth: 600, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 'clamp(18px, 4vw, 32px)', borderRadius: 24, boxShadow: '0 4px 18px rgba(15,23,42,0.06)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 18 }}>
            Personal Details
          </h3>

          {profileMsg && (
            <div style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)', padding: '10px 14px', borderRadius: 12, marginBottom: 16, fontSize: '0.88rem', border: '1px solid var(--badge-border)' }}>
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-main)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-main)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-main)' }}
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
