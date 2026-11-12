import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  MessageSquare,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Search,
  DollarSign,
  Users,
} from 'lucide-react';
import { api, API_BASE_URL, optimizeImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ORDER_STATUSES = [
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Return Requested',
  'Returned',
];

const PAYMENT_STATUSES = [
  'Pending',
  'Paid',
  'Failed',
  'Refund Initiated',
  'Refunded',
];

const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved'];

const INITIAL_NEW_PRODUCT = {
  name: '',
  category: 'Electronics',
  price: '',
  compare_at_price: '',
  stock: '25',
  image_url: '',
  description: '',
  is_featured: false,
};

export default function AdminPage({ onRequireAuth, onContinueShopping }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState('');

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [orderFilter, setOrderFilter] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(INITIAL_NEW_PRODUCT);

  const [orderDrafts, setOrderDrafts] = useState({});
  const [productDrafts, setProductDrafts] = useState({});
  const [ticketDrafts, setTicketDrafts] = useState({});
  const [busyKey, setBusyKey] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadOverview = useCallback(async () => {
    if (!isAuthenticated || !user?.is_staff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.getAdminOverview();
      setStats(data.stats || {});
      const fetchedOrders = data.orders || [];
      const fetchedProducts = data.products || [];
      const fetchedTickets = data.tickets || [];

      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setTickets(fetchedTickets);

      const nextOrderDrafts = {};
      fetchedOrders.forEach((o) => {
        nextOrderDrafts[o.id] = {
          order_status: o.order_status,
          payment_status: o.payment_status,
        };
      });
      setOrderDrafts(nextOrderDrafts);

      const nextProductDrafts = {};
      fetchedProducts.forEach((p) => {
        nextProductDrafts[p.id] = {
          price: String(p.price),
          stock: String(p.stock),
          is_featured: Boolean(p.is_featured),
        };
      });
      setProductDrafts(nextProductDrafts);

      const nextTicketDrafts = {};
      fetchedTickets.forEach((t) => {
        nextTicketDrafts[t.id] = {
          status: t.status,
          admin_reply: t.admin_reply || '',
        };
      });
      setTicketDrafts(nextTicketDrafts);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.is_staff]);

  useEffect(() => {
    if (!authLoading) {
      loadOverview();
    }
  }, [authLoading, loadOverview]);

  const djangoAdminUrl = `${API_BASE_URL || ''}/admin/`;

  const handleSaveOrder = async (orderId) => {
    const draft = orderDrafts[orderId];
    if (!draft) return;
    setBusyKey(`order-${orderId}`);
    try {
      const res = await api.adminUpdateOrder(orderId, draft);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      showToast(res.message || `Order #${orderId} updated.`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order.');
    } finally {
      setBusyKey('');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setBusyKey('create-product');
    setErrorMsg('');
    try {
      const res = await api.adminCreateProduct({
        ...newProduct,
        price: Number(newProduct.price),
        compare_at_price: newProduct.compare_at_price ? Number(newProduct.compare_at_price) : 0,
        stock: Number(newProduct.stock || 0),
      });
      setProducts((prev) => [res.product, ...prev]);
      setNewProduct(INITIAL_NEW_PRODUCT);
      setShowAddProduct(false);
      showToast(`Added "${res.product?.name}" to catalog!`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create product.');
    } finally {
      setBusyKey('');
    }
  };

  const handleSaveProduct = async (productId) => {
    const draft = productDrafts[productId];
    if (!draft) return;
    setBusyKey(`prod-${productId}`);
    try {
      const res = await api.adminUpdateProduct(productId, {
        price: Number(draft.price),
        stock: Number(draft.stock),
        is_featured: Boolean(draft.is_featured),
      });
      setProducts((prev) => prev.map((p) => (p.id === productId ? res.product : p)));
      showToast(`Updated "${res.product?.name}"!`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update product.');
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`Delete "${name}" from catalog?`)) return;
    setBusyKey(`del-${productId}`);
    try {
      await api.adminDeleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`Removed "${name}".`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete product.');
    } finally {
      setBusyKey('');
    }
  };

  const handleSaveTicket = async (ticketId) => {
    const draft = ticketDrafts[ticketId];
    if (!draft) return;
    setBusyKey(`ticket-${ticketId}`);
    try {
      const res = await api.adminUpdateTicket(ticketId, draft);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.ticket : t)));
      showToast(`Updated Ticket #${ticketId}!`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update ticket.');
    } finally {
      setBusyKey('');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
        Loading UrbanCart Admin Control Center...
      </div>
    );
  }

  if (!isAuthenticated || !user?.is_staff) {
    return (
      <div className="container" style={{ padding: '56px 20px', maxWidth: 520, margin: '0 auto' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 20,
          padding: 32,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.14)',
            color: 'var(--amber-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: 8 }}>Admin Access Required</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', marginBottom: 22 }}>
            {!isAuthenticated
              ? 'Please sign in with an administrator account (Password or verified Admin Email OTP) to manage orders, catalog, and support tickets.'
              : `Signed in as ${user?.email || user?.username}, which does not have staff privileges.`}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isAuthenticated && (
              <button onClick={onRequireAuth} className="btn-gold">
                Admin Sign In
              </button>
            )}
            <a
              href={djangoAdminUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 999,
                border: '1px solid var(--border-strong)',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              Django Admin ↗ <ExternalLink size={14} />
            </a>
            <button
              onClick={onContinueShopping}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                background: 'var(--btn-dark-bg)',
                color: 'var(--btn-dark-text)',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrders = orderFilter === 'ALL'
    ? orders
    : orders.filter((o) => o.order_status === orderFilter);

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-surface)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
  };

  return (
    <div className="container" style={{ padding: '28px 16px 64px', maxWidth: 1180, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 22,
      }}>
        <div>
          <button
            onClick={onContinueShopping}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              color: 'var(--text-dim)',
              fontSize: '0.84rem',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            <ArrowLeft size={14} /> Back to Storefront
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(1.35rem, 3vw, 1.85rem)', margin: 0 }}>
              UrbanCart Admin Panel
            </h1>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 999,
              background: 'rgba(245, 158, 11, 0.16)',
              color: 'var(--amber-dark)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
            }}>
              STAFF ACCESS
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Signed in as {user?.email || user?.username} • Live catalog, orders, refunds & care desk
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={loadOverview}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <a
            href={djangoAdminUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-gold"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Django Admin (/admin/) <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Notifications */}
      {toast && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 16,
          background: 'rgba(16, 185, 129, 0.14)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#10b981',
          fontWeight: 600,
          fontSize: '0.88rem',
        }}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 16,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.32)',
          color: '#ef4444',
          fontWeight: 600,
          fontSize: '0.88rem',
        }}>
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      {/* KPI Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          {
            label: 'Gross Revenue',
            value: `₹${Number(stats?.gross_revenue || 0).toLocaleString('en-IN')}`,
            sub: `Refunds: ₹${Number(stats?.refund_total || 0).toLocaleString('en-IN')}`,
            icon: DollarSign,
            accent: '#10b981',
          },
          {
            label: 'Total Orders',
            value: stats?.total_orders ?? orders.length,
            sub: `${stats?.pending_orders ?? 0} pending / active`,
            icon: Package,
            accent: '#f59e0b',
          },
          {
            label: 'Catalog Products',
            value: stats?.total_products ?? products.length,
            sub: `${stats?.low_stock_products ?? 0} low stock (≤5)`,
            icon: ShoppingBag,
            accent: '#3b82f6',
          },
          {
            label: 'Open Support Tickets',
            value: stats?.active_tickets ?? 0,
            sub: `${tickets.length} total customer tickets`,
            icon: MessageSquare,
            accent: '#8b5cf6',
          },
          {
            label: 'Customers',
            value: stats?.total_customers ?? 0,
            sub: 'Registered store shoppers',
            icon: Users,
            accent: '#ec4899',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  {card.label}
                </span>
                <Icon size={17} color={card.accent} />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 4 }}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { id: 'products', label: `Products (${products.length})`, icon: ShoppingBag },
          { id: 'tickets', label: `Support Desk (${tickets.length})`, icon: MessageSquare },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.88rem',
                background: active ? 'var(--amber-primary)' : 'var(--bg-card)',
                color: active ? '#0b0f19' : 'var(--text-main)',
                border: active ? '1px solid var(--amber-primary)' : '1px solid var(--border-subtle)',
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {['ALL', ...ORDER_STATUSES].map((st) => (
              <button
                key={st}
                onClick={() => setOrderFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: orderFilter === st ? 'var(--text-main)' : 'var(--bg-card)',
                  color: orderFilter === st ? 'var(--bg-card)' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
              No orders in this status filter yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredOrders.map((order) => {
                const draft = orderDrafts[order.id] || {
                  order_status: order.order_status,
                  payment_status: order.payment_status,
                };
                return (
                  <div
                    key={order.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 16,
                      padding: 18,
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                          Order #{order.id} • {order.full_name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                          {order.email} • {order.city} ({order.postal_code}) • {order.payment_method} • {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--price-color)' }}>
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </div>
                        {order.refund_reference && (
                          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                            Refund: ₹{order.refund_amount} ({order.refund_reference})
                          </div>
                        )}
                      </div>
                    </div>

                    {(order.cancel_reason || order.return_reason) && (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        fontSize: '0.82rem',
                        color: 'var(--text-main)',
                        marginBottom: 12,
                      }}>
                        {order.cancel_reason ? `Cancel Reason: ${order.cancel_reason}` : `Return Reason: ${order.return_reason}`}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {(order.items || []).map((item) => (
                        <span
                          key={item.id}
                          style={{
                            fontSize: '0.78rem',
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {item.quantity} × {item.product_name} (₹{item.price})
                        </span>
                      ))}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: 10,
                      alignItems: 'end',
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>
                          Order Status
                        </label>
                        <select
                          value={draft.order_status}
                          onChange={(e) => setOrderDrafts((prev) => ({
                            ...prev,
                            [order.id]: { ...draft, order_status: e.target.value },
                          }))}
                          style={inputStyle}
                        >
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>
                          Payment / Refund Status
                        </label>
                        <select
                          value={draft.payment_status}
                          onChange={(e) => setOrderDrafts((prev) => ({
                            ...prev,
                            [order.id]: { ...draft, payment_status: e.target.value },
                          }))}
                          style={inputStyle}
                        >
                          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <button
                        onClick={() => handleSaveOrder(order.id)}
                        disabled={busyKey === `order-${order.id}`}
                        className="btn-gold"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 39 }}
                      >
                        <Save size={15} />
                        {busyKey === `order-${order.id}` ? 'Saving...' : 'Update Order'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search catalog by name or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
            <button
              onClick={() => setShowAddProduct((v) => !v)}
              className="btn-gold"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} />
              {showAddProduct ? 'Close Form' : 'Add Product'}
            </button>
          </div>

          {showAddProduct && (
            <form
              onSubmit={handleCreateProduct}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-amber)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Create New Catalog Product</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Product Name *</label>
                  <input
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., UrbanPro Wireless Buds"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Category *</label>
                  <input
                    required
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="Electronics / Clothing / Footwear"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="2999"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>MRP / Compare Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.compare_at_price}
                    onChange={(e) => setNewProduct({ ...newProduct, compare_at_price: e.target.value })}
                    placeholder="4999"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Stock *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Image URL</label>
                  <input
                    type="url"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Short product highlights..."
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={newProduct.is_featured}
                    onChange={(e) => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                  />
                  Mark as Featured Bestseller
                </label>
                <button type="submit" disabled={busyKey === 'create-product'} className="btn-gold">
                  {busyKey === 'create-product' ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredProducts.map((p) => {
              const draft = productDrafts[p.id] || {
                price: String(p.price),
                stock: String(p.stock),
                is_featured: Boolean(p.is_featured),
              };
              return (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 14,
                    padding: 14,
                    display: 'grid',
                    gridTemplateColumns: '64px minmax(180px, 1.5fr) repeat(3, minmax(95px, 0.7fr)) auto',
                    gap: 12,
                    alignItems: 'center',
                  }}
                  className="admin-product-row"
                >
                  <img
                    src={optimizeImageUrl(p.image_url, 160)}
                    alt={p.name}
                    style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', background: 'var(--bg-surface)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      #{p.id} • {p.category} • {Number(p.review_count) > 0 ? `★ ${p.rating} (${p.review_count})` : 'No reviews'}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={draft.price}
                      onChange={(e) => setProductDrafts((prev) => ({
                        ...prev,
                        [p.id]: { ...draft, price: e.target.value },
                      }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={draft.stock}
                      onChange={(e) => setProductDrafts((prev) => ({
                        ...prev,
                        [p.id]: { ...draft, stock: e.target.value },
                      }))}
                      style={inputStyle}
                    />
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={draft.is_featured}
                      onChange={(e) => setProductDrafts((prev) => ({
                        ...prev,
                        [p.id]: { ...draft, is_featured: e.target.checked },
                      }))}
                    />
                    Featured
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleSaveProduct(p.id)}
                      disabled={busyKey === `prod-${p.id}`}
                      className="btn-gold"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      disabled={busyKey === `del-${p.id}`}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.28)',
                      }}
                      title="Delete product"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SUPPORT DESK */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tickets.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
              No customer support tickets yet.
            </div>
          ) : (
            tickets.map((t) => {
              const draft = ticketDrafts[t.id] || { status: t.status, admin_reply: t.admin_reply || '' };
              return (
                <div
                  key={t.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 16,
                    padding: 18,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: 'rgba(245, 158, 11, 0.14)',
                        color: 'var(--amber-dark)',
                      }}>
                        #{t.id} • {t.issue_type}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>{t.subject}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {t.customer_name} ({t.customer_email}) {t.order ? `• Order #${t.order}` : ''}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    {t.message}
                  </p>

                  <div className="admin-ticket-reply-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>
                        Admin Response
                      </label>
                      <textarea
                        rows={2}
                        value={draft.admin_reply}
                        onChange={(e) => setTicketDrafts((prev) => ({
                          ...prev,
                          [t.id]: { ...draft, admin_reply: e.target.value },
                        }))}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
                      <select
                        value={draft.status}
                        onChange={(e) => setTicketDrafts((prev) => ({
                          ...prev,
                          [t.id]: { ...draft, status: e.target.value },
                        }))}
                        style={inputStyle}
                      >
                        {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => handleSaveTicket(t.id)}
                        disabled={busyKey === `ticket-${t.id}`}
                        className="btn-gold"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Save size={15} />
                        {busyKey === `ticket-${t.id}` ? 'Saving...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
