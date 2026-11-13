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
  Mail,
  Store,
  Truck,
  Edit2,
  Phone,
  MapPin,
  Check,
  X,
  Building,
  Star,
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

const VEHICLE_TYPES = [
  'Bike',
  'Scooter',
  'Electric Bike',
  'Van',
  'Auto',
];

const AGENT_STATUSES = ['Available', 'Out for Delivery', 'Off Duty'];

const INITIAL_NEW_PRODUCT = {
  name: '',
  category: 'Electronics',
  price: '',
  compare_at_price: '',
  stock: '25',
  image_url: '',
  description: '',
  is_featured: false,
  seller_id: '',
};

const INITIAL_NEW_SELLER = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  city: '',
  state: 'Delhi',
  address: '',
  gst_number: '',
  rating: '4.8',
  is_active: true,
};

const INITIAL_NEW_AGENT = {
  name: '',
  phone: '',
  email: '',
  vehicle_type: 'Bike',
  vehicle_number: '',
  city: 'Delhi',
  assigned_area: '',
  status: 'Available',
  rating: '4.9',
  is_active: true,
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
  const [sellers, setSellers] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [tickets, setTickets] = useState([]);

  // Filters & searches
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellerFilter, setSellerFilter] = useState('ALL');
  const [agentSearch, setAgentSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('ALL');

  // Creation forms
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(INITIAL_NEW_PRODUCT);

  const [showAddSeller, setShowAddSeller] = useState(false);
  const [newSeller, setNewSeller] = useState(INITIAL_NEW_SELLER);

  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgent, setNewAgent] = useState(INITIAL_NEW_AGENT);

  // Full Edit Modals
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSeller, setEditingSeller] = useState(null);
  const [editingAgent, setEditingAgent] = useState(null);

  // Drafts
  const [orderDrafts, setOrderDrafts] = useState({});
  const [productDrafts, setProductDrafts] = useState({});
  const [ticketDrafts, setTicketDrafts] = useState({});
  const [busyKey, setBusyKey] = useState('');

  // Email diagnostics state
  const [testEmailInput, setTestEmailInput] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

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
      const fetchedSellers = data.sellers || [];
      const fetchedAgents = data.delivery_agents || [];

      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setTickets(fetchedTickets);
      setSellers(fetchedSellers);
      setDeliveryAgents(fetchedAgents);

      const nextOrderDrafts = {};
      fetchedOrders.forEach((o) => {
        nextOrderDrafts[o.id] = {
          order_status: o.order_status,
          payment_status: o.payment_status,
          delivery_agent_id: o.delivery_agent || '',
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

  // --- ORDER HANDLERS ---
  const handleSaveOrder = async (orderId) => {
    const draft = orderDrafts[orderId];
    if (!draft) return;
    setBusyKey(`order-${orderId}`);
    try {
      const payload = {
        order_status: draft.order_status,
        payment_status: draft.payment_status,
      };
      if (draft.delivery_agent_id !== undefined) {
        payload.delivery_agent_id = draft.delivery_agent_id || null;
      }
      const res = await api.adminUpdateOrder(orderId, payload);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      showToast(res.message || `Order #${orderId} updated.`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order.');
    } finally {
      setBusyKey('');
    }
  };

  // --- PRODUCT HANDLERS ---
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
        seller_id: newProduct.seller_id ? Number(newProduct.seller_id) : null,
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

  const handleQuickSaveProduct = async (productId) => {
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

  const handleSaveProductFull = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setBusyKey(`edit-prod-${editingProduct.id}`);
    try {
      const res = await api.adminUpdateProduct(editingProduct.id, {
        name: editingProduct.name,
        category: editingProduct.category,
        price: Number(editingProduct.price),
        compare_at_price: Number(editingProduct.compare_at_price || 0),
        stock: Number(editingProduct.stock || 0),
        image_url: editingProduct.image_url,
        description: editingProduct.description,
        is_featured: Boolean(editingProduct.is_featured),
        seller_id: editingProduct.seller ? Number(editingProduct.seller) : null,
      });
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.product : p)));
      setEditingProduct(null);
      showToast(`Product "${res.product?.name}" updated successfully!`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product.');
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`Delete "${name}" from catalog?`)) return;
    setBusyKey(`del-prod-${productId}`);
    try {
      await api.adminDeleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`Removed "${name}".`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete product.');
    } finally {
      setBusyKey('');
    }
  };

  // --- SELLER HANDLERS ---
  const handleCreateSeller = async (e) => {
    e.preventDefault();
    setBusyKey('create-seller');
    setErrorMsg('');
    try {
      const res = await api.adminCreateSeller(newSeller);
      setSellers((prev) => [res.seller, ...prev]);
      setNewSeller(INITIAL_NEW_SELLER);
      setShowAddSeller(false);
      showToast(`Seller "${res.seller?.name}" added!`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create seller.');
    } finally {
      setBusyKey('');
    }
  };

  const handleSaveSeller = async (e) => {
    e.preventDefault();
    if (!editingSeller) return;
    setBusyKey(`edit-seller-${editingSeller.id}`);
    try {
      const res = await api.adminUpdateSeller(editingSeller.id, editingSeller);
      setSellers((prev) => prev.map((s) => (s.id === editingSeller.id ? res.seller : s)));
      setEditingSeller(null);
      showToast(`Seller "${res.seller?.name}" updated!`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update seller.');
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteSeller = async (sellerId, name) => {
    if (!window.confirm(`Delete seller "${name}"? Products linked to this seller will remain available.`)) return;
    setBusyKey(`del-seller-${sellerId}`);
    try {
      await api.adminDeleteSeller(sellerId);
      setSellers((prev) => prev.filter((s) => s.id !== sellerId));
      showToast(`Seller "${name}" deleted.`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete seller.');
    } finally {
      setBusyKey('');
    }
  };

  const handleToggleSellerActive = async (seller) => {
    setBusyKey(`toggle-seller-${seller.id}`);
    try {
      const res = await api.adminUpdateSeller(seller.id, { is_active: !seller.is_active });
      setSellers((prev) => prev.map((s) => (s.id === seller.id ? res.seller : s)));
      showToast(`Seller "${seller.name}" is now ${res.seller?.is_active ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to toggle status.');
    } finally {
      setBusyKey('');
    }
  };

  // --- DELIVERY AGENT HANDLERS ---
  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setBusyKey('create-agent');
    setErrorMsg('');
    try {
      const res = await api.adminCreateDeliveryAgent(newAgent);
      setDeliveryAgents((prev) => [res.delivery_agent, ...prev]);
      setNewAgent(INITIAL_NEW_AGENT);
      setShowAddAgent(false);
      showToast(`Delivery Agent "${res.delivery_agent?.name}" added!`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create delivery agent.');
    } finally {
      setBusyKey('');
    }
  };

  const handleSaveAgent = async (e) => {
    e.preventDefault();
    if (!editingAgent) return;
    setBusyKey(`edit-agent-${editingAgent.id}`);
    try {
      const res = await api.adminUpdateDeliveryAgent(editingAgent.id, editingAgent);
      setDeliveryAgents((prev) => prev.map((a) => (a.id === editingAgent.id ? res.delivery_agent : a)));
      setEditingAgent(null);
      showToast(`Delivery Agent "${res.delivery_agent?.name}" updated!`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update agent.');
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteAgent = async (agentId, name) => {
    if (!window.confirm(`Remove delivery agent "${name}" from fleet?`)) return;
    setBusyKey(`del-agent-${agentId}`);
    try {
      await api.adminDeleteDeliveryAgent(agentId);
      setDeliveryAgents((prev) => prev.filter((a) => a.id !== agentId));
      showToast(`Delivery Agent "${name}" removed.`);
      loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete agent.');
    } finally {
      setBusyKey('');
    }
  };

  const handleChangeAgentStatus = async (agentId, statusVal) => {
    setBusyKey(`status-agent-${agentId}`);
    try {
      const res = await api.adminUpdateDeliveryAgent(agentId, { status: statusVal });
      setDeliveryAgents((prev) => prev.map((a) => (a.id === agentId ? res.delivery_agent : a)));
      showToast(`Agent status changed to ${statusVal}.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change agent status.');
    } finally {
      setBusyKey('');
    }
  };

  // --- SUPPORT TICKET HANDLER ---
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

  // --- EMAIL TEST HANDLER ---
  const handleRunEmailTest = async (e) => {
    e.preventDefault();
    if (!testEmailInput) return;
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const res = await api.adminTestEmail(testEmailInput);
      setTestEmailResult(res);
      if (res.email_sent) {
        showToast(`✓ Test email delivered to ${testEmailInput}`);
      } else {
        showToast('⚠️ Test email could not be delivered.');
      }
    } catch (err) {
      setTestEmailResult({ email_sent: false, error: err.message });
    } finally {
      setTestEmailLoading(false);
    }
  };

  // Filtered lists
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    return o.order_status === orderFilter;
  });

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.seller_name?.toLowerCase().includes(q)
    );
  });

  const filteredSellers = sellers.filter((s) => {
    if (sellerFilter === 'ACTIVE' && !s.is_active) return false;
    if (sellerFilter === 'INACTIVE' && s.is_active) return false;
    if (!sellerSearch) return true;
    const q = sellerSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.contact_person?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  });

  const filteredAgents = deliveryAgents.filter((a) => {
    if (agentFilter !== 'ALL' && a.status !== agentFilter) return false;
    if (!agentSearch) return true;
    const q = agentSearch.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.assigned_area?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.vehicle_number?.toLowerCase().includes(q)
    );
  });

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
              ? 'Please sign in with an administrator account (Password or verified Admin Email OTP) to manage orders, catalog, sellers, and delivery fleet.'
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
                padding: '10px 18px',
                borderRadius: 12,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Django Admin (/admin/) <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-surface)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
    overflowY: 'auto',
  };

  const modalContentStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-amber)',
    borderRadius: 20,
    padding: '24px 28px',
    maxWidth: 640,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
  };

  return (
    <div className="container" style={{ padding: '28px 16px 64px', maxWidth: 1200, margin: '0 auto' }}>
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
              UrbanCart Admin Control Center
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
              STAFF ACTIVE
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Signed in as {user?.email || user?.username} • Manage Products, Sellers, Delivery Agents, Orders & Support
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
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#10b981',
          fontWeight: 700,
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
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
            label: 'Orders',
            value: stats?.total_orders ?? orders.length,
            sub: `${stats?.pending_orders ?? 0} active / pending`,
            icon: Package,
            accent: '#f59e0b',
          },
          {
            label: 'Products',
            value: stats?.total_products ?? products.length,
            sub: `${stats?.low_stock_products ?? 0} low stock (≤5)`,
            icon: ShoppingBag,
            accent: '#3b82f6',
          },
          {
            label: 'Sellers',
            value: stats?.total_sellers ?? sellers.length,
            sub: `${sellers.filter(s => s.is_active).length} active merchants`,
            icon: Store,
            accent: '#eab308',
          },
          {
            label: 'Delivery Fleet',
            value: stats?.total_delivery_agents ?? deliveryAgents.length,
            sub: `${deliveryAgents.filter(a => a.status === 'Available').length} agents on duty`,
            icon: Truck,
            accent: '#06b6d4',
          },
          {
            label: 'Support Tickets',
            value: stats?.active_tickets ?? 0,
            sub: `${tickets.length} total customer tickets`,
            icon: MessageSquare,
            accent: '#8b5cf6',
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
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  {card.label}
                </span>
                <Icon size={17} color={card.accent} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
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
          { id: 'sellers', label: `Sellers (${sellers.length})`, icon: Store },
          { id: 'delivery', label: `Delivery Fleet (${deliveryAgents.length})`, icon: Truck },
          { id: 'tickets', label: `Support Desk (${tickets.length})`, icon: MessageSquare },
          { id: 'mail', label: 'Email Diagnostics', icon: Mail },
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
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===================== TAB 1: ORDERS ===================== */}
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
                  delivery_agent_id: order.delivery_agent || '',
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
                        <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                          Order #{order.id} • {order.full_name}
                          {order.delivery_agent_name && (
                            <span style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'rgba(6, 182, 212, 0.16)',
                              color: '#06b6d4',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              <Truck size={12} /> Assigned: {order.delivery_agent_name} ({order.delivery_agent_phone})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 2 }}>
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
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 10,
                        padding: '8px 12px',
                        marginBottom: 12,
                        fontSize: '0.82rem',
                        color: '#ef4444',
                      }}>
                        {order.cancel_reason && <div><strong>Cancellation Reason:</strong> {order.cancel_reason}</div>}
                        {order.return_reason && <div><strong>Return Reason:</strong> {order.return_reason}</div>}
                      </div>
                    )}

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>
                          Assign Delivery Agent
                        </label>
                        <select
                          value={draft.delivery_agent_id || ''}
                          onChange={(e) => setOrderDrafts((prev) => ({
                            ...prev,
                            [order.id]: { ...draft, delivery_agent_id: e.target.value },
                          }))}
                          style={inputStyle}
                        >
                          <option value="">-- No Agent Assigned --</option>
                          {deliveryAgents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.vehicle_type} - {a.status})
                            </option>
                          ))}
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

      {/* ===================== TAB 2: PRODUCTS ===================== */}
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
                placeholder="Search catalog by name, category, or seller..."
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
              {showAddProduct ? 'Close Form' : 'Insert New Product'}
            </button>
          </div>

          {/* INSERT PRODUCT FORM */}
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
              <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Insert New Product into Catalog</h3>
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
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Seller / Vendor</label>
                  <select
                    value={newProduct.seller_id}
                    onChange={(e) => setNewProduct({ ...newProduct, seller_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">-- Direct Store Brand --</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city || 'Vendor'})
                      </option>
                    ))}
                  </select>
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
                  {busyKey === 'create-product' ? 'Creating...' : 'Insert Product'}
                </button>
              </div>
            </form>
          )}

          {/* PRODUCTS LIST */}
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
                    gridTemplateColumns: '64px minmax(180px, 1.5fr) repeat(2, minmax(90px, 0.7fr)) auto',
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
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 2 }}>
                      #{p.id} • {p.category} {p.seller_name ? `• Seller: ${p.seller_name}` : ''} • {Number(p.review_count) > 0 ? `★ ${p.rating} (${p.review_count})` : 'No reviews'}
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
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => handleQuickSaveProduct(p.id)}
                      disabled={busyKey === `prod-${p.id}`}
                      className="btn-gold"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Quick Save Price & Stock"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditingProduct(p)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-main)',
                      }}
                      title="Full Edit (Name, Seller, Image, MRP)"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      disabled={busyKey === `del-prod-${p.id}`}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.28)',
                      }}
                      title="Delete product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: SELLERS / MERCHANTS ===================== */}
      {activeTab === 'sellers' && (
        <div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', gap: 10, flex: '1 1 320px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search sellers by store, person, or city..."
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['ALL', 'ACTIVE', 'INACTIVE'].map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setSellerFilter(flt)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: sellerFilter === flt ? 'var(--text-main)' : 'var(--bg-card)',
                      color: sellerFilter === flt ? 'var(--bg-card)' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAddSeller((v) => !v)}
              className="btn-gold"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} />
              {showAddSeller ? 'Close Form' : 'Insert New Seller'}
            </button>
          </div>

          {/* INSERT SELLER FORM */}
          {showAddSeller && (
            <form
              onSubmit={handleCreateSeller}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-amber)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Register New Seller / Vendor</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Store / Company Name *</label>
                  <input
                    required
                    value={newSeller.name}
                    onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                    placeholder="e.g. Apex Lifestyle Hub"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Contact Person</label>
                  <input
                    value={newSeller.contact_person}
                    onChange={(e) => setNewSeller({ ...newSeller, contact_person: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Phone Number</label>
                  <input
                    value={newSeller.phone}
                    onChange={(e) => setNewSeller({ ...newSeller, phone: e.target.value })}
                    placeholder="+91 98112 00000"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Email Address</label>
                  <input
                    type="email"
                    value={newSeller.email}
                    onChange={(e) => setNewSeller({ ...newSeller, email: e.target.value })}
                    placeholder="vendor@company.in"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>City</label>
                  <input
                    value={newSeller.city}
                    onChange={(e) => setNewSeller({ ...newSeller, city: e.target.value })}
                    placeholder="New Delhi"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>State</label>
                  <input
                    value={newSeller.state}
                    onChange={(e) => setNewSeller({ ...newSeller, state: e.target.value })}
                    placeholder="Delhi"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>GSTIN / Tax ID</label>
                  <input
                    value={newSeller.gst_number}
                    onChange={(e) => setNewSeller({ ...newSeller, gst_number: e.target.value.toUpperCase() })}
                    placeholder="07AAAAA0000A1Z5"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Seller Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newSeller.rating}
                    onChange={(e) => setNewSeller({ ...newSeller, rating: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Warehouse / Office Address</label>
                <textarea
                  rows={2}
                  value={newSeller.address}
                  onChange={(e) => setNewSeller({ ...newSeller, address: e.target.value })}
                  placeholder="Complete business address..."
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={newSeller.is_active}
                    onChange={(e) => setNewSeller({ ...newSeller, is_active: e.target.checked })}
                  />
                  Active Seller (Authorized to sell products)
                </label>
                <button type="submit" disabled={busyKey === 'create-seller'} className="btn-gold">
                  {busyKey === 'create-seller' ? 'Registering...' : 'Register Seller'}
                </button>
              </div>
            </form>
          )}

          {/* SELLERS LIST */}
          {filteredSellers.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
              No sellers found matching the criteria. Click "Insert New Seller" to register one!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {filteredSellers.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 16,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Store size={18} color="var(--amber-primary)" />
                          {s.name}
                        </div>
                        {s.contact_person && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 2 }}>
                            Contact: {s.contact_person}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: s.is_active ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                        color: s.is_active ? '#10b981' : '#ef4444',
                      }}>
                        {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                      {s.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={13} color="var(--text-dim)" /> {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={13} color="var(--text-dim)" /> {s.email}
                        </div>
                      )}
                      {(s.city || s.state) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={13} color="var(--text-dim)" /> {s.city}{s.city && s.state ? ', ' : ''}{s.state}
                        </div>
                      )}
                      {s.gst_number && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                          GSTIN: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.gst_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 8,
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: 'var(--amber-dark)',
                      }}>
                        ★ {s.rating}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                        {s.products_count ?? 0} Products
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleToggleSellerActive(s)}
                        disabled={busyKey === `toggle-seller-${s.id}`}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: s.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: s.is_active ? '#ef4444' : '#10b981',
                          border: 'none',
                        }}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setEditingSeller(s)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 8,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          color: 'var(--text-main)',
                        }}
                        title="Update Seller"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteSeller(s.id, s.name)}
                        disabled={busyKey === `del-seller-${s.id}`}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 8,
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.28)',
                        }}
                        title="Delete Seller"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 4: DELIVERY AGENTS ===================== */}
      {activeTab === 'delivery' && (
        <div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', gap: 10, flex: '1 1 320px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search agents by name, phone, area, or vehicle..."
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['ALL', ...AGENT_STATUSES].map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setAgentFilter(flt)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: agentFilter === flt ? 'var(--text-main)' : 'var(--bg-card)',
                      color: agentFilter === flt ? 'var(--bg-card)' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAddAgent((v) => !v)}
              className="btn-gold"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} />
              {showAddAgent ? 'Close Form' : 'Insert Delivery Agent'}
            </button>
          </div>

          {/* INSERT DELIVERY AGENT FORM */}
          {showAddAgent && (
            <form
              onSubmit={handleCreateAgent}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-amber)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Add New Delivery Agent to Fleet</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Agent Name *</label>
                  <input
                    required
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Phone Number *</label>
                  <input
                    required
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                    placeholder="agent@urbancart.in"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Vehicle Type *</label>
                  <select
                    value={newAgent.vehicle_type}
                    onChange={(e) => setNewAgent({ ...newAgent, vehicle_type: e.target.value })}
                    style={inputStyle}
                  >
                    {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Vehicle Plate Number</label>
                  <input
                    value={newAgent.vehicle_number}
                    onChange={(e) => setNewAgent({ ...newAgent, vehicle_number: e.target.value.toUpperCase() })}
                    placeholder="DL 01 AB 1234"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>City</label>
                  <input
                    value={newAgent.city}
                    onChange={(e) => setNewAgent({ ...newAgent, city: e.target.value })}
                    placeholder="Delhi / Mumbai"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Assigned Delivery Area</label>
                  <input
                    value={newAgent.assigned_area}
                    onChange={(e) => setNewAgent({ ...newAgent, assigned_area: e.target.value })}
                    placeholder="e.g. South Delhi, Saket & CP"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Duty Status</label>
                  <select
                    value={newAgent.status}
                    onChange={(e) => setNewAgent({ ...newAgent, status: e.target.value })}
                    style={inputStyle}
                  >
                    {AGENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={newAgent.is_active}
                    onChange={(e) => setNewAgent({ ...newAgent, is_active: e.target.checked })}
                  />
                  Active Fleet Member
                </label>
                <button type="submit" disabled={busyKey === 'create-agent'} className="btn-gold">
                  {busyKey === 'create-agent' ? 'Adding Agent...' : 'Insert Delivery Agent'}
                </button>
              </div>
            </form>
          )}

          {/* AGENTS LIST */}
          {filteredAgents.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
              No delivery agents found. Click "Insert Delivery Agent" to add drivers & couriers!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {filteredAgents.map((a) => {
                const statusColor =
                  a.status === 'Available' ? '#10b981' :
                  a.status === 'Out for Delivery' ? '#f59e0b' : '#94a3b8';
                return (
                  <div
                    key={a.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 16,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Truck size={18} color="#06b6d4" />
                            {a.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Phone size={12} /> {a.phone}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: 999,
                          background: `${statusColor}22`,
                          color: statusColor,
                          border: `1px solid ${statusColor}44`,
                        }}>
                          {a.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Vehicle:</span> {a.vehicle_type} {a.vehicle_number ? `(${a.vehicle_number})` : ''}
                        </div>
                        {a.assigned_area && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={13} color="var(--text-dim)" /> {a.assigned_area} ({a.city})
                          </div>
                        )}
                        {a.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={13} color="var(--text-dim)" /> {a.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select
                          value={a.status}
                          onChange={(e) => handleChangeAgentStatus(a.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 8,
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-strong)',
                            color: 'var(--text-main)',
                          }}
                        >
                          {AGENT_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                          {a.active_deliveries_count ?? 0} active
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setEditingAgent(a)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 8,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-strong)',
                            color: 'var(--text-main)',
                          }}
                          title="Update Agent"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(a.id, a.name)}
                          disabled={busyKey === `del-agent-${a.id}`}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 8,
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.28)',
                          }}
                          title="Remove Agent"
                        >
                          <Trash2 size={13} />
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

      {/* ===================== TAB 5: SUPPORT DESK ===================== */}
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

      {/* ===================== TAB 6: EMAIL DIAGNOSTICS ===================== */}
      {activeTab === 'mail' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 'clamp(18px, 4vw, 28px)' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
              🧪 Live Email Deliverability Test & Diagnostics
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', margin: 0 }}>
              Test sending an actual email to any address (customer, test Gmail, Yahoo, etc.) to verify if your email provider delivers externally or blocks it.
            </p>
          </div>

          <form onSubmit={handleRunEmailTest} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <input
              type="email"
              required
              placeholder="Enter any recipient email (e.g. friend@gmail.com)"
              value={testEmailInput}
              onChange={(e) => setTestEmailInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: 260,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 12,
                padding: '12px 14px',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
              }}
            />
            <button
              type="submit"
              disabled={testEmailLoading}
              className="btn-gold"
              style={{ padding: '12px 20px', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Mail size={16} />
              {testEmailLoading ? 'Testing Live Delivery...' : 'Send Test Email'}
            </button>
          </form>

          {testEmailResult && (
            <div style={{
              background: testEmailResult.email_sent ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${testEmailResult.email_sent ? '#10b981' : '#ef4444'}`,
              borderRadius: 14,
              padding: 18,
              marginTop: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1rem', color: testEmailResult.email_sent ? '#10b981' : '#ef4444', marginBottom: 8 }}>
                {testEmailResult.email_sent ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                {testEmailResult.email_sent ? 'Delivery Succeeded!' : 'Delivery Failed!'}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                {testEmailResult.email_sent
                  ? `An automated test email was successfully dispatched to ${testEmailResult.recipient}. Check your inbox (and Spam folder).`
                  : `Error: ${testEmailResult.error}`}
              </p>
              {testEmailResult.advice && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px', marginTop: 10, fontSize: '0.84rem', color: 'var(--amber-primary)', lineHeight: 1.5 }}>
                  💡 <strong>Diagnostic Advice:</strong> {testEmailResult.advice}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            <strong>Why do emails sometimes go only to the admin?</strong>
            <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
              <li><strong>Resend Sandbox Limitation:</strong> On Resend free accounts without a custom verified domain, Resend strictly allows sending <em>only</em> to your own account email. Any email to external users is blocked.</li>
              <li><strong>Solution:</strong> Use Google Apps Script Webhook (<code>EMAIL_WEBHOOK_URL</code>) or Brevo (<code>BREVO_API_KEY</code>) which delivers to any recipient worldwide.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ===================== FULL EDIT PRODUCT MODAL ===================== */}
      {editingProduct && (
        <div style={modalOverlayStyle} onClick={() => setEditingProduct(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Update Catalog Product</h3>
              <button
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProductFull}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Product Name *</label>
                  <input
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Category *</label>
                  <input
                    required
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Seller / Vendor</label>
                  <select
                    value={editingProduct.seller || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, seller: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">-- Direct Store Brand --</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.city || 'Vendor'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Price (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="1"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>MRP / Compare At Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.compare_at_price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, compare_at_price: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Stock *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Image URL</label>
                  <input
                    type="url"
                    value={editingProduct.image_url || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Description</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.is_featured)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                  />
                  Featured Product
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-main)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busyKey === `edit-prod-${editingProduct.id}`}
                    className="btn-gold"
                  >
                    {busyKey === `edit-prod-${editingProduct.id}` ? 'Saving...' : 'Save Product Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT SELLER MODAL ===================== */}
      {editingSeller && (
        <div style={modalOverlayStyle} onClick={() => setEditingSeller(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Update Seller / Vendor</h3>
              <button
                onClick={() => setEditingSeller(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSeller}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Store Name *</label>
                  <input
                    required
                    value={editingSeller.name}
                    onChange={(e) => setEditingSeller({ ...editingSeller, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Contact Person</label>
                  <input
                    value={editingSeller.contact_person || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, contact_person: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Phone</label>
                  <input
                    value={editingSeller.phone || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, phone: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    value={editingSeller.email || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>City</label>
                  <input
                    value={editingSeller.city || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, city: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>State</label>
                  <input
                    value={editingSeller.state || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, state: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>GSTIN / Tax ID</label>
                  <input
                    value={editingSeller.gst_number || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, gst_number: e.target.value.toUpperCase() })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingSeller.rating || '4.8'}
                    onChange={(e) => setEditingSeller({ ...editingSeller, rating: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Address</label>
                  <textarea
                    rows={2}
                    value={editingSeller.address || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, address: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(editingSeller.is_active)}
                    onChange={(e) => setEditingSeller({ ...editingSeller, is_active: e.target.checked })}
                  />
                  Active Seller
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setEditingSeller(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-main)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busyKey === `edit-seller-${editingSeller.id}`}
                    className="btn-gold"
                  >
                    {busyKey === `edit-seller-${editingSeller.id}` ? 'Saving...' : 'Save Seller Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT DELIVERY AGENT MODAL ===================== */}
      {editingAgent && (
        <div style={modalOverlayStyle} onClick={() => setEditingAgent(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Update Delivery Agent</h3>
              <button
                onClick={() => setEditingAgent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAgent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Agent Name *</label>
                  <input
                    required
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Phone *</label>
                  <input
                    required
                    value={editingAgent.phone}
                    onChange={(e) => setEditingAgent({ ...editingAgent, phone: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    value={editingAgent.email || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Vehicle Type *</label>
                  <select
                    value={editingAgent.vehicle_type}
                    onChange={(e) => setEditingAgent({ ...editingAgent, vehicle_type: e.target.value })}
                    style={inputStyle}
                  >
                    {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Vehicle Number</label>
                  <input
                    value={editingAgent.vehicle_number || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, vehicle_number: e.target.value.toUpperCase() })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>City</label>
                  <input
                    value={editingAgent.city || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, city: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Assigned Area</label>
                  <input
                    value={editingAgent.assigned_area || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, assigned_area: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: 4 }}>Status</label>
                  <select
                    value={editingAgent.status}
                    onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value })}
                    style={inputStyle}
                  >
                    {AGENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(editingAgent.is_active)}
                    onChange={(e) => setEditingAgent({ ...editingAgent, is_active: e.target.checked })}
                  />
                  Active Member
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setEditingAgent(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-main)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busyKey === `edit-agent-${editingAgent.id}`}
                    className="btn-gold"
                  >
                    {busyKey === `edit-agent-${editingAgent.id}` ? 'Saving...' : 'Save Agent Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
