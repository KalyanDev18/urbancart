import React, { useState, useEffect } from 'react';
import {
  Package,
  MapPin,
  User,
  Coins,
  Truck,
  Trash2,
  Plus,
  Headphones,
  RotateCcw,
  XCircle,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import InvoiceModal from '../components/InvoiceModal';

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Changed payment or address',
  'Found a better price',
  'Delivery taking too long',
];

const RETURN_REASONS = [
  'Size or fit issue',
  'Defective or damaged item',
  'Wrong item delivered',
  'Quality not as expected',
];

function getStatusPillStyle(orderStatus) {
  switch (orderStatus) {
    case 'Delivered':
      return {
        background: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.32)',
      };
    case 'Shipped':
      return {
        background: 'rgba(59, 130, 246, 0.12)',
        color: '#3b82f6',
        border: '1px solid rgba(59, 130, 246, 0.32)',
      };
    case 'Cancelled':
      return {
        background: 'rgba(239, 68, 68, 0.12)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.32)',
      };
    case 'Return Requested':
    case 'Returned':
      return {
        background: 'rgba(168, 85, 247, 0.14)',
        color: '#c084fc',
        border: '1px solid rgba(168, 85, 247, 0.35)',
      };
    default:
      return {
        background: 'var(--badge-bg)',
        color: 'var(--badge-text)',
        border: '1px solid var(--badge-border)',
      };
  }
}

export default function DashboardPage({ onContinueShopping, initialTab = 'orders' }) {
  const { user, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab || 'orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [totalSpent, setTotalSpent] = useState('0');
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Cancel / Return modal state
  const [actionModal, setActionModal] = useState(null); // { mode: 'cancel' | 'return', order }
  const [actionReason, setActionReason] = useState('');
  const [returnResolution, setReturnResolution] = useState('REFUND');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionBanner, setActionBanner] = useState('');

  // Support ticket state
  const [supportOrderId, setSupportOrderId] = useState('');
  const [supportIssueType, setSupportIssueType] = useState('REFUND');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportFeedback, setSupportFeedback] = useState('');

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

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, addrRes, ticketRes] = await Promise.all([
        api.getMyOrders().catch(() => ({ orders: [], total_spent: '0', reward_points: 0 })),
        api.getAddresses().catch(() => ({ addresses: [] })),
        api.getSupportTickets().catch(() => ({ tickets: [] })),
      ]);
      setOrders(Array.isArray(orderRes?.orders) ? orderRes.orders : []);
      setTotalSpent(orderRes?.total_spent || '0');
      setRewardPoints(orderRes?.reward_points || 0);
      setAddresses(Array.isArray(addrRes?.addresses) ? addrRes.addresses : []);
      setTickets(Array.isArray(ticketRes?.tickets) ? ticketRes.tickets : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openActionModal = (mode, order) => {
    setActionError('');
    setActionReason(mode === 'cancel' ? CANCEL_REASONS[0] : RETURN_REASONS[0]);
    setReturnResolution('REFUND');
    setActionModal({ mode, order });
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionModal?.order) return;
    setActionLoading(true);
    setActionError('');
    try {
      const { mode, order } = actionModal;
      const res =
        mode === 'cancel'
          ? await api.cancelOrder(order.id, actionReason)
          : await api.returnOrder(order.id, { reason: actionReason, resolution: returnResolution });

      setActionModal(null);
      setActionBanner(res?.message || `Order #${order.id} updated successfully!`);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Could not process your request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSupportForOrder = (order) => {
    setSupportOrderId(String(order.id));
    setSupportIssueType(order.order_status === 'Delivered' ? 'RETURN' : 'CANCEL');
    setSupportSubject(`Help with Order #${order.id}`);
    setSupportFeedback('');
    setActiveTab('support');
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;
    setSupportLoading(true);
    setSupportFeedback('');
    try {
      const res = await api.createSupportTicket({
        order_id: supportOrderId ? Number(supportOrderId) : null,
        issue_type: supportIssueType,
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
      });
      setSupportFeedback(res?.message || 'Support ticket submitted! Our care team will respond within 2–4 hours.');
      setSupportSubject('');
      setSupportMessage('');
      await loadData();
    } catch (err) {
      setSupportFeedback(err.message || 'Failed to submit ticket.');
    } finally {
      setSupportLoading(false);
    }
  };

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
  const refundedOrders = orders.filter(
    (o) => o.refund_reference || o.payment_status === 'Refund Initiated' || o.payment_status === 'Refunded'
  );

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
          onClick={() => setActiveTab('support')}
          style={{
            background: 'none',
            padding: '10px 14px',
            fontSize: '0.88rem',
            fontWeight: 800,
            color: activeTab === 'support' ? 'var(--price-color)' : 'var(--text-dim)',
            borderBottom: activeTab === 'support' ? '2px solid #d97706' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Headphones size={16} />
          Support &amp; Refunds ({tickets.length})
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

      {/* Action Confirmation Banner */}
      {actionBanner && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#10b981',
          padding: '12px 16px',
          borderRadius: 14,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          fontSize: '0.88rem',
          fontWeight: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{actionBanner}</span>
          </div>
          <button onClick={() => setActionBanner('')} style={{ background: 'none', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

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
                const canCancel = order.order_status === 'Processing' || order.order_status === 'Shipped';
                const canReturn = order.order_status === 'Delivered';
                const hasRefund =
                  Boolean(order.refund_reference) ||
                  order.payment_status === 'Refund Initiated' ||
                  order.payment_status === 'Refunded' ||
                  order.order_status === 'Cancelled' ||
                  order.order_status === 'Return Requested' ||
                  order.order_status === 'Returned';

                return (
                  <div
                    key={order.id}
                    style={{
                      borderRadius: 20,
                      padding: 'clamp(16px, 3vw, 24px)',
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
                      paddingBottom: 14,
                      borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            Order #{order.id}
                          </span>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            ...getStatusPillStyle(order.order_status),
                          }}>
                            {order.order_status}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--price-color)' }}>
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {order.payment_method} • {order.payment_status}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {item.product_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--price-color)' }}>
                            ₹{Number(item.get_total_price || (item.price * item.quantity)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cancel / Return / Refund Status Box */}
                    {hasRefund && (
                      <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RefreshCw size={15} color="#10b981" />
                          <span>
                            <strong>{order.payment_status}</strong>
                            {Number(order.refund_amount) > 0 && ` • ₹${Number(order.refund_amount).toLocaleString('en-IN')}`}
                            {(order.cancel_reason || order.return_reason) && ` — ${order.cancel_reason || order.return_reason}`}
                          </span>
                        </div>
                        {order.refund_reference && (
                          <span style={{ fontWeight: 800, color: 'var(--price-color)', fontSize: '0.76rem' }}>
                            Ref: {order.refund_reference}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Address & Cancel / Return / Support Actions Footer */}
                    <div style={{
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} color="#d97706" />
                        <span>Shipped to: {order.address}, {order.city} - {order.postal_code}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {canCancel && (
                          <button
                            onClick={() => openActionModal('cancel', order)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#ef4444',
                              padding: '7px 12px',
                              borderRadius: 10,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <XCircle size={14} />
                            Cancel Order
                          </button>
                        )}

                        {canReturn && (
                          <button
                            onClick={() => openActionModal('return', order)}
                            style={{
                              background: 'var(--badge-bg)',
                              border: '1px solid var(--badge-border)',
                              color: 'var(--badge-text)',
                              padding: '7px 12px',
                              borderRadius: 10,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <RotateCcw size={14} />
                            Return / Refund
                          </button>
                        )}

                        <button
                          onClick={() => setInvoiceOrder(order)}
                          style={{
                            background: 'rgba(217, 119, 6, 0.12)',
                            border: '1px solid rgba(217, 119, 6, 0.35)',
                            color: 'var(--price-color)',
                            padding: '7px 12px',
                            borderRadius: 10,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            cursor: 'pointer',
                          }}
                          title="View & Download Official GST Tax Invoice"
                        >
                          <FileText size={14} />
                          Invoice
                        </button>

                        <button
                          onClick={() => handleOpenSupportForOrder(order)}
                          className="btn-dark"
                          style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: 10 }}
                        >
                          <Headphones size={14} />
                          Need Help
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPORT & REFUNDS */}
      {activeTab === 'support' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 22 }}>
          {/* Raise Support Ticket Form */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 'clamp(18px, 4vw, 28px)', borderRadius: 24, boxShadow: '0 4px 18px rgba(15,23,42,0.06)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
              Chat &amp; Customer Care Desk
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginBottom: 16 }}>
              Raise a ticket for refunds, returns, or urgent order help (2–4 hr response SLA).
            </p>

            {supportFeedback && (
              <div style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)', border: '1px solid var(--badge-border)', padding: '10px 14px', borderRadius: 12, marginBottom: 16, fontSize: '0.84rem', fontWeight: 600 }}>
                {supportFeedback}
              </div>
            )}

            <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 5 }}>
                  Related Order (Optional)
                </label>
                <select
                  value={supportOrderId}
                  onChange={(e) => setSupportOrderId(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)' }}
                >
                  <option value="">General Account / No Specific Order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Order #{o.id} — ₹{Number(o.total_amount).toLocaleString('en-IN')} ({o.order_status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 5 }}>
                  Issue Category
                </label>
                <select
                  value={supportIssueType}
                  onChange={(e) => setSupportIssueType(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)' }}
                >
                  <option value="REFUND">Refund Status / Bank Credit</option>
                  <option value="RETURN">Return &amp; Reverse Pickup</option>
                  <option value="CANCEL">Order Cancellation</option>
                  <option value="DELIVERY">Delivery &amp; Courier Help</option>
                  <option value="OTHER">Other Question</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 5 }}>
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need return pickup or refund update"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 5 }}>
                  Message *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details so our support team can resolve it fast..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <button type="submit" disabled={supportLoading} className="btn-gold" style={{ padding: '12px', fontSize: '0.92rem' }}>
                <Headphones size={16} />
                {supportLoading ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>

          {/* Active Refunds + Support Ticket Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Refunds Overview */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 'clamp(16px, 4vw, 24px)', borderRadius: 24 }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>
                Refund &amp; Return Tracker ({refundedOrders.length})
              </h4>
              {refundedOrders.length === 0 ? (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
                  No refunds or return pickups active right now.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {refundedOrders.map((ro) => (
                    <div key={ro.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          Order #{ro.id} ({ro.order_status})
                        </span>
                        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>
                          ₹{Number(ro.refund_amount || ro.total_amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Status: <strong>{ro.payment_status}</strong> {ro.refund_reference ? `• Ref: ${ro.refund_reference}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tickets List */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 'clamp(16px, 4vw, 24px)', borderRadius: 24 }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>
                Your Support Tickets ({tickets.length})
              </h4>
              {tickets.length === 0 ? (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
                  You haven&apos;t raised any support tickets yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tickets.map((t) => (
                    <div key={t.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          #{t.id} • {t.subject}
                        </span>
                        <span className="badge-gold" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                          {t.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: t.admin_reply ? 8 : 0 }}>
                        {t.message}
                      </p>
                      {t.admin_reply && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <strong style={{ color: 'var(--price-color)' }}>UrbanCart Care:</strong> {t.admin_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADDRESS BOOK */}
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

      {/* TAB 4: PROFILE SETTINGS */}
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

      {/* Cancel / Return Reason Modal */}
      {actionModal && (
        <div
          onClick={() => setActionModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(6, 9, 17, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: 440,
              borderRadius: 24,
              padding: 'clamp(18px, 4vw, 26px)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {actionModal.mode === 'cancel'
                    ? `Cancel Order #${actionModal.order.id}`
                    : `Return Order #${actionModal.order.id}`}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Order Value: ₹{Number(actionModal.order.total_amount).toLocaleString('en-IN')} ({actionModal.order.payment_method})
                </p>
              </div>
              <button onClick={() => setActionModal(null)} style={{ background: 'none', color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#ef4444', padding: '8px 12px', borderRadius: 10, fontSize: '0.82rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={15} />
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {actionModal.mode === 'return' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Preferred Resolution
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setReturnResolution('REFUND')}
                      style={{
                        padding: '9px 10px',
                        borderRadius: 10,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: returnResolution === 'REFUND' ? 'var(--badge-bg)' : 'var(--bg-surface)',
                        border: returnResolution === 'REFUND' ? '2px solid #d97706' : '1px solid var(--border-strong)',
                        color: returnResolution === 'REFUND' ? 'var(--badge-text)' : 'var(--text-main)',
                      }}
                    >
                      Instant Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => setReturnResolution('REPLACEMENT')}
                      style={{
                        padding: '9px 10px',
                        borderRadius: 10,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: returnResolution === 'REPLACEMENT' ? 'var(--badge-bg)' : 'var(--bg-surface)',
                        border: returnResolution === 'REPLACEMENT' ? '2px solid #d97706' : '1px solid var(--border-strong)',
                        color: returnResolution === 'REPLACEMENT' ? 'var(--badge-text)' : 'var(--text-main)',
                      }}
                    >
                      Free Replacement
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Select Reason
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {(actionModal.mode === 'cancel' ? CANCEL_REASONS : RETURN_REASONS).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setActionReason(r)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 9999,
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        background: actionReason === r ? 'var(--badge-bg)' : 'var(--bg-surface)',
                        border: actionReason === r ? '1px solid #d97706' : '1px solid var(--border-strong)',
                        color: actionReason === r ? 'var(--badge-text)' : 'var(--text-muted)',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason..."
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'none' }}
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                {actionModal.mode === 'cancel'
                  ? actionModal.order.payment_status === 'Paid'
                    ? 'Paid orders trigger an automatic refund to your original UPI / Card within 2–3 business days.'
                    : 'COD pending orders are cancelled immediately with zero charge.'
                  : '7-Day Free Doorstep Pickup within 24–48 hrs. Refund settles to UPI / original source once verified.'}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-gold"
                  style={{ flex: 1, padding: '11px', fontSize: '0.88rem' }}
                >
                  {actionLoading
                    ? 'Processing...'
                    : actionModal.mode === 'cancel'
                      ? 'Confirm Cancel & Refund'
                      : 'Schedule Return Pickup'}
                </button>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="btn-dark"
                  style={{ padding: '11px 16px', fontSize: '0.86rem' }}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}

    </div>
  );
}
