'use client';
/**
 * HARA Checkout Page
 *
 * Payload matches CheckoutSerializer exactly:
 *  - billing_ prefixed address fields (flat, not nested)
 *  - shipping_rate_id (not shipping_method_id)
 *  - terms_accepted boolean (required by backend)
 *  - customer_note (not notes)
 *  - coupon_code field
 *  - currency from store
 *
 * Payment: COD is default. PayHere is available but requires merchant approval.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useCartStore, useCurrencyStore, useAuthStore } from '@/lib/store';
import { checkoutApi, accountApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShieldCheck, Truck, Lock, Tag, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import type { CartItem } from '@/lib/store';
import AddressFields from '@/components/checkout/AddressFields';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';


interface ShippingRate {
  id: number;
  name: string;
  price: string;
  delivery_estimate: string | null;
}

export default function CheckoutPage() {
  const { cart, setCart } = useCartStore();
  const { currency, rate, formatPrice } = useCurrencyStore();
  const router = useRouter();

  const [form, setForm] = useState({
    // Billing / Contact
    billing_full_name: '',
    billing_email: '',
    billing_phone: '',
    billing_address_line_1: '',
    billing_address_line_2: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    billing_country: 'GB',

    // Optional separate shipping address
    ship_to_different_address: false,
    shipping_full_name: '',
    shipping_address_line_1: '',
    shipping_address_line_2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_postal_code: '',
    shipping_country: 'GB',

    shipping_rate_id: '',
    payment_method: 'paypal',  // Default: PayPal
    customer_note: '',
    terms_accepted: false,
    save_address: false,
    
    // Account Creation
    create_account: false,
    password: '',
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Fetch saved addresses if logged in
  const paypalOptions = useMemo(() => ({
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: currency
  }), [currency]);

  useEffect(() => {
    if (isAuthenticated) {
      accountApi.getAddresses().then((res) => {
        const addrs = res.data.results || res.data || [];
        setSavedAddresses(addrs);
        // Auto-fill default address if available and form is empty
        const defaultAddr = addrs.find((a: any) => a.is_default);
        if (defaultAddr && !form.billing_full_name) {
          applySavedAddress(defaultAddr);
        }
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  const applySavedAddress = (addr: any) => {
    setForm(f => ({
      ...f,
      billing_full_name: addr.full_name,
      billing_email: user?.email || f.billing_email,
      billing_phone: addr.phone,
      billing_address_line_1: addr.address_line_1,
      billing_address_line_2: addr.address_line_2 || '',
      billing_city: addr.city,
      billing_state: addr.state || '',
      billing_postal_code: addr.postal_code,
      billing_country: addr.country,
    }));
    toast.success('Address applied');
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (cart && cart.items.length === 0 && !placingOrder) {
      router.push('/products');
    }
  }, [cart, router, placingOrder]);

  // Fetch shipping rates when billing country changes
  useEffect(() => {
    const country = form.ship_to_different_address
      ? form.shipping_country
      : form.billing_country;

    const fetchRates = async () => {
      setLoadingRates(true);
      setForm(f => ({ ...f, shipping_rate_id: '' }));
      try {
        const res = await checkoutApi.getShippingRates(country);
        const rates: ShippingRate[] = res.data;
        setShippingRates(rates);
        if (rates.length > 0) {
          setForm(f => ({ ...f, shipping_rate_id: rates[0].id.toString() }));
        }
      } catch {
        toast.error('Failed to load shipping rates for this country');
        setShippingRates([]);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, [form.billing_country, form.shipping_country, form.ship_to_different_address]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, paypalOrderId?: string) => {
    e.preventDefault();

    if (!form.terms_accepted) {
      toast.error('Please accept the terms and conditions to continue.');
      return;
    }

    if (!form.shipping_rate_id) {
      toast.error('Please select a shipping method.');
      return;
    }

    setPlacingOrder(true);

    try {
      // Build payload matching CheckoutSerializer exactly
      const payload: Record<string, unknown> = {
        billing_full_name: form.billing_full_name,
        billing_email: form.billing_email,
        billing_phone: form.billing_phone,
        billing_address_line_1: form.billing_address_line_1,
        billing_address_line_2: form.billing_address_line_2,
        billing_city: form.billing_city,
        billing_state: form.billing_state,
        billing_postal_code: form.billing_postal_code,
        billing_country: form.billing_country,

        ship_to_different_address: form.ship_to_different_address,
        shipping_rate_id: parseInt(form.shipping_rate_id, 10),
        payment_method: form.payment_method,
        paypal_order_id: paypalOrderId,
        coupon_code: form.coupon_code.trim().toUpperCase(),
        currency,
        customer_note: form.customer_note,
        terms_accepted: form.terms_accepted,
        create_account: form.create_account,
        password: form.password,
      };

      // Add separate shipping address if toggled
      if (form.ship_to_different_address) {
        payload.shipping_full_name = form.shipping_full_name;
        payload.shipping_address_line_1 = form.shipping_address_line_1;
        payload.shipping_address_line_2 = form.shipping_address_line_2;
        payload.shipping_city = form.shipping_city;
        payload.shipping_state = form.shipping_state;
        payload.shipping_postal_code = form.shipping_postal_code;
        payload.shipping_country = form.shipping_country;
      }

      const res = await checkoutApi.placeOrder(payload);

      // Clear cart in store, but preserve the selected currency
      setCart({ id: '', items: [], subtotal: 0, item_count: 0, currency });
      localStorage.removeItem('hara-cart-last-fetched');
      localStorage.removeItem('hara-cart-id');

      // Handle payment redirect (PayHere) or go to success page
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        router.push(`/checkout/success?order=${res.data.order_number}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } };
      const message =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Checkout failed. Please check your details and try again.';
      toast.error(message);
      setPlacingOrder(false);
    }
  };

  if (!cart || cart.items.length === 0) return null;

  const selectedRate = shippingRates.find(r => r.id.toString() === form.shipping_rate_id);
  const shippingCost = selectedRate ? Number(selectedRate.price) : 0;
  const grandTotal = Number(cart.subtotal) + shippingCost;

  return (
    <div className="pt-[80px] bg-gray-50 min-h-screen pb-24">
      <div className="container max-w-6xl mx-auto py-12 px-4">

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Secure Checkout</h1>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Lock size={14} /> <span>SSL Encrypted Connection</span>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* ── Left Column: Forms ─────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">

            {/* Contact Information */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold font-serif">Contact Information</h2>
                {isAuthenticated && savedAddresses.length > 0 && (
                  <div className="relative group">
                    <select
                      onChange={(e) => {
                        const addr = savedAddresses.find(a => a.id === Number(e.target.value));
                        if (addr) applySavedAddress(addr);
                      }}
                      className="text-xs font-bold text-brand-gold bg-brand-gold/5 px-3 py-1.5 rounded-lg outline-none cursor-pointer border border-brand-gold/20 hover:bg-brand-gold/10 transition-all"
                    >
                      <option value="">Use a saved address...</option>
                      {savedAddresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.full_name} - {addr.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group md:col-span-2">
                  <label className="form-label">Email Address *</label>
                  <input
                    required
                    type="email"
                    name="billing_email"
                    value={form.billing_email}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    required
                    type="text"
                    name="billing_full_name"
                    value={form.billing_full_name}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="John Smith"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    name="billing_phone"
                    value={form.billing_phone}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="+44 7911 123456"
                  />
                </div>
              </div>
              </div>

            {/* Billing / Shipping Address */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-6 font-serif">Billing Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group md:col-span-2">
                  <label className="form-label">Address Line 1 *</label>
                  <input
                    required
                    type="text"
                    name="billing_address_line_1"
                    value={form.billing_address_line_1}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="123 High Street"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="form-label">Address Line 2 <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                  <input
                    type="text"
                    name="billing_address_line_2"
                    value={form.billing_address_line_2}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <AddressFields 
                  prefix="billing" 
                  formData={form} 
                  onChange={handleSelectChange} 
                />

                <div className="form-group">
                  <label className="form-label">Postcode *</label>
                  <input
                    required
                    type="text"
                    name="billing_postal_code"
                    value={form.billing_postal_code}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="SW1A 1AA"
                  />
                </div>
              </div>

              {/* Save Address Toggle (only for logged in) */}
              {isAuthenticated && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="save_address"
                      checked={form.save_address}
                      onChange={handleChange}
                      className="w-4 h-4 accent-brand-gold rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-dark transition-colors">
                      Save this address to my profile for future orders
                    </span>
                  </label>
                </div>
              )}

              {/* Ship to Different Address Toggle */}
              <label className="flex items-center gap-3 mt-6 cursor-pointer group">
                <input
                  type="checkbox"
                  name="ship_to_different_address"
                  checked={form.ship_to_different_address}
                  onChange={handleChange}
                  className="w-4 h-4 accent-brand-gold rounded"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-brand-dark transition-colors">
                  Ship to a different address
                </span>
              </label>


              {/* Separate Shipping Address */}
              {form.ship_to_different_address && (
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="text-xs font-bold text-brand-gold uppercase tracking-widest md:col-span-2">Shipping Address</p>
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Full Name *</label>
                    <input required type="text" name="shipping_full_name" value={form.shipping_full_name} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Address Line 1 *</label>
                    <input required type="text" name="shipping_address_line_1" value={form.shipping_address_line_1} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Address Line 2</label>
                    <input type="text" name="shipping_address_line_2" value={form.shipping_address_line_2} onChange={handleChange} className="form-control" />
                  </div>
                  <AddressFields 
                    prefix="shipping" 
                    formData={form} 
                    onChange={handleSelectChange} 
                  />
                  <div className="form-group">
                    <label className="form-label">Postcode *</label>
                    <input required type="text" name="shipping_postal_code" value={form.shipping_postal_code} onChange={handleChange} className="form-control" />
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Method */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-6 font-serif flex items-center gap-2">
                <Truck size={18} className="text-brand-gold" /> Shipping Method
              </h2>
              {loadingRates ? (
                <div className="flex items-center gap-3 text-sm text-gray-500 py-4">
                  <div className="spinner w-5 h-5 border-2" /> Calculating shipping rates…
                </div>
              ) : shippingRates.length === 0 ? (
                <div className="text-sm text-red-500 bg-red-50 rounded-xl p-4">
                  No shipping methods available for this country. Please try a different address.
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingRates.map((rate) => (
                    <label
                      key={rate.id}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                        form.shipping_rate_id === rate.id.toString()
                          ? 'border-brand-gold bg-brand-gold/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_rate_id"
                          value={rate.id.toString()}
                          checked={form.shipping_rate_id === rate.id.toString()}
                          onChange={handleChange}
                          className="accent-brand-gold"
                        />
                        <div>
                          <p className="font-bold text-sm">{rate.name}</p>
                          {rate.delivery_estimate && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Est. {rate.delivery_estimate}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-sm">
                        {Number(rate.price) === 0 ? 'FREE' : formatPrice(Number(rate.price))}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-6 font-serif flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-gold" /> Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all border-brand-gold bg-brand-gold/5">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment_method" value="paypal" readOnly checked className="accent-brand-gold" />
                    <div>
                      <p className="font-bold text-sm">PayPal Checkout</p>
                      <p className="text-xs text-gray-500 mt-0.5">Pay securely via PayPal, Credit or Debit Card</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Secure</span>
                </label>
              </div>
            </div>



            {/* Order Notes (collapsible) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowNotes(v => !v)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-sm text-gray-700">Add order notes (optional)</span>
                {showNotes ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {showNotes && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <textarea
                    name="customer_note"
                    value={form.customer_note}
                    onChange={handleChange}
                    placeholder="Special instructions for your order, e.g. gift wrapping or specific delivery preferences…"
                    className="form-control mt-4"
                    rows={3}
                  />
                </div>
              )}
            </div>

          </div>

          {/* ── Right Column: Order Summary ─────────────────── */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
              <h2 className="text-xl font-serif font-bold mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-[280px] overflow-y-auto pr-1">
                {cart.items.map((item: CartItem) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center p-1 relative shrink-0">
                      {item.product?.main_image ? (
                        <img
                          src={item.product.main_image.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : null}
                      <span className="absolute top-1 right-1 bg-brand-dark text-white text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-md font-bold shadow-sm">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold line-clamp-2 leading-snug">{item.product?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.product?.sku}</p>
                    </div>
                    <div className="font-bold text-sm shrink-0">
                      {formatPrice(item.unit_price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(Number(cart.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {loadingRates
                      ? 'Calculating…'
                      : shippingCost === 0 && selectedRate
                      ? 'FREE'
                      : shippingCost > 0
                      ? formatPrice(shippingCost)
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-4">
                  <span>Total</span>
                  <span className="text-brand-dark">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Terms & Conditions */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  checked={form.terms_accepted}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 accent-brand-gold shrink-0"
                />
                <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                  I agree to the{' '}
                  <a href="/pages/terms" target="_blank" className="text-brand-gold underline hover:text-brand-dark">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/pages/privacy" target="_blank" className="text-brand-gold underline hover:text-brand-dark">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              {/* Place Order Button or PayPal */}
              {placingOrder ? (
                <button disabled className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl opacity-50 flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 border-2 border-white/20 border-t-white" /> Processing…
                </button>
              ) : (
                <PayPalScriptProvider key={`${currency}-${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}`} options={paypalOptions}>
                  <PayPalButtons
                    style={{ layout: "vertical", shape: 'pill', color: 'black' }}
                    createOrder={(data, actions) => {
                      if (!formRef.current?.checkValidity()) {
                        formRef.current?.reportValidity();
                        toast.error("Please fill in all required fields first.");
                        return Promise.reject(new Error("Form validation failed"));
                      }
                      if (!form.terms_accepted) {
                        toast.error("Please accept the terms and conditions to continue.");
                        return Promise.reject(new Error("Terms not accepted"));
                      }
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                          {
                            amount: {
                              currency_code: currency,
                              value: (grandTotal * rate).toFixed(2),
                            },
                          },
                        ],
                      }).catch((err) => {
                        toast.error("PayPal Error: Your PayPal account may be restricted or not fully set up.");
                        console.error("Create Order Error:", err);
                        throw err;
                      });
                    }}
                    onApprove={async (data, actions) => {
                      if (!actions.order) return;
                      try {
                        const details = await actions.order.capture();
                        if (details.status === 'COMPLETED') {
                           await handleSubmit(new Event('submit') as unknown as React.FormEvent, details.id);
                        }
                      } catch (err) {
                        toast.error("Payment failed to capture. Please try again.");
                        console.error("Capture Error:", err);
                      }
                    }}
                    onError={(err: any) => {
                      console.error("PayPal Checkout Error:", err);
                    }}
                  />
                </PayPalScriptProvider>
              )}

              {/* Trust Badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-gray-400">
                <div className="flex items-center gap-1.5 text-xs">
                  <Lock size={12} /> <span>SSL Secure</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <ShieldCheck size={12} /> <span>Safe Checkout</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Truck size={12} /> <span>Global Delivery</span>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
