import React, { useState, useEffect, useCallback } from 'react';
import { X, Star, ShoppingBag, CheckCircle2, ShieldCheck, Trash2, AlertTriangle, Check, Truck, Package } from 'lucide-react';
import { api, optimizeImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose, onRequireAuth, onRatingUpdated }) {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const [reviewsData, setReviewsData] = useState({
    average_rating: product?.rating || '0.0',
    review_count: product?.review_count || 0,
    breakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    reviews: [],
  });
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [selectedStars, setSelectedStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');

  const loadReviews = useCallback(async () => {
    if (!product?.id) return;
    setLoadingReviews(true);
    try {
      const res = await api.getProductReviews(product.id);
      setReviewsData(res);
      if (res.user_review) {
        setSelectedStars(res.user_review.rating);
        setTitle(res.user_review.title || '');
        setComment(res.user_review.comment || '');
      }
    } catch (err) {
      console.error('Failed to load product reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [product?.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  if (!product) return null;

  const originalPrice = Number(product.original_price || product.compare_at_price || 0);
  const discount = Number(product.discount_percent || 0);
  const reviewCount = Number(reviewsData.review_count || 0);
  const averageRating = Number(reviewsData.average_rating || 0);

  const handleAddToBag = async () => {
    setAdding(true);
    try {
      const res = await addToCart(product.id, 1);
      if (res && res.authRequired) {
        onClose();
        onRequireAuth?.();
      } else {
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onClose();
      onRequireAuth?.();
      return;
    }
    setFormErr('');
    setFormMsg('');
    if (!comment.trim() || comment.trim().length < 3) {
      setFormErr('Please write a short review (at least 3 characters).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitProductReview(product.id, {
        rating: selectedStars,
        title: title.trim(),
        comment: comment.trim(),
      });
      setFormMsg(res.message || 'Thank you! Your review has been published.');
      await loadReviews();
      if (onRatingUpdated) {
        onRatingUpdated(product.id, res.average_rating, res.review_count);
      }
    } catch (err) {
      setFormErr(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setFormErr('');
    try {
      const res = await api.deleteProductReview(product.id, reviewId);
      setTitle('');
      setComment('');
      setSelectedStars(5);
      setFormMsg('Review deleted.');
      await loadReviews();
      if (onRatingUpdated) {
        onRatingUpdated(product.id, res.average_rating, res.review_count);
      }
    } catch (err) {
      setFormErr(err.message || 'Could not delete review.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-surface)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(7, 11, 19, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 880,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 22,
          padding: 'clamp(16px, 3vw, 28px)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close product details"
          style={{
            position: 'sticky',
            top: 0,
            float: 'right',
            zIndex: 5,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Top Product Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 22,
            marginBottom: 28,
          }}
        >
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--bg-surface)', aspectRatio: '1 / 1' }}>
            <img
              src={optimizeImageUrl(product.image_url, 640)}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = optimizeImageUrl('', 640);
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
            <div>
              <span className="badge-gold" style={{ marginBottom: 8 }}>
                {product.category}
              </span>
              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.7rem)', fontWeight: 800, marginBottom: 8 }}>
                {product.name}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--badge-bg)', border: '1px solid var(--badge-border)', padding: '4px 10px', borderRadius: 999 }}>
                  <Star size={14} fill={reviewCount > 0 ? '#d97706' : 'none'} color="#d97706" />
                  <span style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--badge-text)' }}>
                    {reviewCount > 0 ? `${averageRating.toFixed(1)} (${reviewCount} review${reviewCount === 1 ? '' : 's'})` : 'No reviews yet'}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: product.stock > 0 ? '#10b981' : '#ef4444' }}>
                  {product.stock > 5 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                </span>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 14 }}>
                {product.description || 'Authentic UrbanCart catalog item.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--price-color)' }}>
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
                {originalPrice > Number(product.price) && (
                  <>
                    <span style={{ fontSize: '0.98rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                      ₹{Number(originalPrice).toLocaleString('en-IN')}
                    </span>
                    {discount > 0 && (
                      <span style={{ background: '#d97706', color: '#fff', fontSize: '0.74rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                        {discount}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleAddToBag}
              disabled={adding || product.stock <= 0}
              className={added ? 'btn-dark' : 'btn-gold'}
              style={{ width: '100%', padding: '12px 18px', fontSize: '0.95rem' }}
            >
              {added ? (
                <>
                  <Check size={16} color="#10b981" /> Added to Bag
                </>
              ) : (
                <>
                  <ShoppingBag size={16} /> {adding ? 'Adding...' : 'Add to Bag'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real Ratings & Customer Reviews Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 22 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 14 }}>
            Verified Ratings & Customer Reviews
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 18,
              marginBottom: 22,
            }}
          >
            {/* Rating Breakdown Box */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 16, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                  {reviewCount > 0 ? averageRating.toFixed(1) : '0.0'}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        fill={s <= Math.round(averageRating) ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Based on {reviewCount} real review{reviewCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[5, 4, 3, 2, 1].map((starKey) => {
                  const countForStar = Number(reviewsData.breakdown?.[String(starKey)] || 0);
                  const pct = reviewCount > 0 ? Math.round((countForStar / reviewCount) * 100) : 0;
                  return (
                    <div key={starKey} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                      <span style={{ width: 24, fontWeight: 700 }}>{starKey}★</span>
                      <div style={{ flex: 1, height: 7, borderRadius: 999, background: 'var(--bg-card)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 999 }} />
                      </div>
                      <span style={{ width: 26, textAlign: 'right', color: 'var(--text-dim)' }}>{countForStar}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Write a Review Form */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 16, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.96rem', marginBottom: 10 }}>
                {reviewsData.user_review ? 'Update Your Review' : 'Write a Product Review'}
              </div>

              {!isAuthenticated ? (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 12 }}>
                    Sign in to rate this product and share your genuine feedback with other shoppers.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onRequireAuth?.();
                    }}
                    className="btn-gold"
                    style={{ fontSize: '0.86rem' }}
                  >
                    Sign In to Review
                  </button>
                </div>
              ) : reviewsData.user_review || reviewsData.can_review ? (
                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#10b981', fontWeight: 700, marginBottom: 2 }}>
                    <ShieldCheck size={14} /> Verified Buyer — Delivery Confirmed
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const active = starVal <= (hoverStars || selectedStars);
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverStars(starVal)}
                          onMouseLeave={() => setHoverStars(0)}
                          onClick={() => setSelectedStars(starVal)}
                          style={{ background: 'none', padding: 2, cursor: 'pointer' }}
                          aria-label={`Rate ${starVal} stars`}
                        >
                          <Star size={22} fill={active ? '#f59e0b' : 'none'} color="#f59e0b" />
                        </button>
                      );
                    })}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: 4 }}>
                      {selectedStars} / 5
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Review headline (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    style={inputStyle}
                  />

                  <textarea
                    rows={3}
                    required
                    placeholder="Share quality, fit, delivery or value experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={inputStyle}
                  />

                  {formErr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                      <AlertTriangle size={14} /> {formErr}
                    </div>
                  )}
                  {formMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> {formMsg}
                    </div>
                  )}

                  <button type="submit" disabled={submitting} className="btn-gold" style={{ fontSize: '0.86rem' }}>
                    {submitting
                      ? 'Submitting...'
                      : reviewsData.user_review
                        ? 'Update Review'
                        : 'Submit Review'}
                  </button>
                </form>
              ) : reviewsData.review_status_reason === 'delivery_pending' ? (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#3b82f6', marginBottom: 6 }}>
                    <Truck size={16} /> Order in Transit
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Aapka order process ho raha hai ya raste me hai. Package <strong>Delivered</strong> hone ke baad aap genuine rating &amp; review submit kar payenge!
                  </div>
                </div>
              ) : reviewsData.review_status_reason === 'not_purchased' ? (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--price-color)', marginBottom: 6 }}>
                    <Package size={16} /> Verified Buyers Only
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
                    Reviews sirf wahi customers de sakte hain jinhone ye product purchase kiya ho aur delivery receive ki ho.
                  </div>
                  <button
                    onClick={handleAddToBag}
                    disabled={adding || product.stock <= 0}
                    className="btn-gold"
                    style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                  >
                    <ShoppingBag size={14} /> Order to Review
                  </button>
                </div>
              ) : (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Reviews are only allowed after your order has been successfully delivered.
                </div>
              )}
            </div>
          </div>

          {/* Reviews List */}
          {loadingReviews ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
              Loading customer reviews...
            </div>
          ) : reviewsData.reviews?.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
              No reviews yet — be the first to rate and review this product!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviewsData.reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#f59e0b', color: '#0b0f19', fontWeight: 800, fontSize: '0.74rem', padding: '2px 7px', borderRadius: 6 }}>
                        {rev.rating} ★
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {rev.title || rev.reviewer_name}
                      </span>
                      {rev.is_verified_purchase && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
                          <ShieldCheck size={13} /> Verified Purchase
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                        {rev.reviewer_name} • {new Date(rev.created_at).toLocaleDateString('en-IN')}
                      </span>
                      {(rev.is_own_review || user?.is_staff) && (
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          title="Delete review"
                          style={{ background: 'none', color: '#ef4444', padding: 2, cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
