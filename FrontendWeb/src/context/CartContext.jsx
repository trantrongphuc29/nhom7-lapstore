import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { isStaffRole, normalizeRole } from "../features/admin/utils/rbac";
import { useAuth } from "./AuthContext";
import { buildVariantSummary } from "../utils/productSpec";

const CartContext = createContext(null);
const STORAGE_KEY = "lapstore_cart_v1";

export const FREE_SHIPPING_THRESHOLD = 10_000_000;
export const DEFAULT_SHIPPING_FEE = 50_000;

/** @typedef {{ lineId: string, productId: number, variantId: number, name: string, image: string|null, specSummary: string, price: number, stock: number, quantity: number, color?: string, productSlug?: string }} CartLine */

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function getLineId(productId, variantId) {
  return `${productId}-${variantId}`;
}

export function stockStatus(stock, qty) {
  const s = Number(stock) || 0;
  const q = Number(qty) || 0;
  if (s <= 0) return "out";
  if (s <= 3) return "low";
  if (q > s) return "out";
  return "in";
}

export function computeCartTotals(items, discount = 0) {
  const subtotal = items.reduce((sum, li) => sum + Number(li.price) * Number(li.quantity), 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount + shippingFee);
  return { subtotal, discount, shippingFee, total };
}

export function cartAllInStock(items) {
  return items.every((li) => li.quantity <= (Number(li.stock) || 0) && (Number(li.stock) || 0) > 0);
}

function resolveCartImage(product, variant, explicitImage) {
  if (explicitImage) return explicitImage;
  if (variant?.image) return variant.image;
  if (product?.image) return product.image;
  const firstImage = product?.images?.[0];
  return firstImage?.image_url || firstImage?.imageUrl || null;
}

export function CartProvider({ children }) {
  const { token, isAuthenticated, user } = useAuth();
  const isCustomerAccount = Boolean(
    isAuthenticated && token && !isStaffRole(normalizeRole(user?.role))
  );
  const [items, setItems] = useState(loadCart);
  const [discount, setDiscount] = useState(0);
  /** Mã đã áp dụng (để redeem khi đặt hàng); xóa khi đổi giỏ */
  const [appliedVoucherCode, setAppliedVoucherCode] = useState(null);
  const [cartRemoteReady, setCartRemoteReady] = useState(() => !isCustomerAccount);

  const cartSignature = useMemo(
    () => JSON.stringify(items.map((i) => [i.lineId, i.quantity, Number(i.price)])),
    [items]
  );

  useEffect(() => {
    setDiscount(0);
    setAppliedVoucherCode(null);
  }, [cartSignature]);

  useEffect(() => {
    if (!isCustomerAccount || !token) {
      setCartRemoteReady(true);
      return undefined;
    }
    setCartRemoteReady(false);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ACCOUNT_CART, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setCartRemoteReady(true);
          return;
        }
        const data = await res.json();
        const serverItems = data?.data?.items ?? data?.items;
        if (cancelled) return;
        if (Array.isArray(serverItems) && serverItems.length > 0) {
          setItems(serverItems);
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          let local = [];
          try {
            const parsed = raw ? JSON.parse(raw) : [];
            local = Array.isArray(parsed) ? parsed : [];
          } catch {
            local = [];
          }
          if (local.length > 0) {
            await fetch(API_ENDPOINTS.ACCOUNT_CART, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ items: local }),
            });
          }
        }
      } finally {
        if (!cancelled) setCartRemoteReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCustomerAccount, token]);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  useEffect(() => {
    if (!isCustomerAccount || !token || !cartRemoteReady) return undefined;
    const t = setTimeout(() => {
      fetch(API_ENDPOINTS.ACCOUNT_CART, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => undefined);
    }, 650);
    return () => clearTimeout(t);
  }, [items, isCustomerAccount, token, cartRemoteReady]);

  const addFromProduct = useCallback((product, variant, specs, imageUrl) => {
    const pStatus = product?.status;
    if (pStatus && pStatus !== "active") {
      return { ok: false, reason: "unavailable" };
    }
    const stock = Number(variant.stock) || 0;
    if (stock <= 0) {
      return { ok: false, reason: "out" };
    }
    const lineId = getLineId(product.id, variant.id);
    const specSummary = buildVariantSummary(variant, specs);
    const resolvedImage = resolveCartImage(product, variant, imageUrl);
    let ok = true;
    let nextItemsSnapshot = null;
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.lineId === lineId);
      if (idx >= 0) {
        const next = [...prev];
        const q = next[idx].quantity + 1;
        if (q > stock) {
          ok = false;
          nextItemsSnapshot = prev;
          return prev;
        }
        next[idx] = { ...next[idx], quantity: q };
        nextItemsSnapshot = next;
        return next;
      }
      const merged = [
        ...prev,
        {
          lineId,
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          image: resolvedImage,
          specSummary,
          price: Number(variant.price),
          stock,
          quantity: 1,
          color: variant.color || undefined,
          productSlug: product.slug ? String(product.slug).trim() || undefined : undefined,
        },
      ];
      nextItemsSnapshot = merged;
      return merged;
    });
    return { ok, nextItems: nextItemsSnapshot };
  }, []);

  const addLine = useCallback((line) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.lineId === line.lineId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...line, quantity: next[idx].quantity + (line.quantity || 1) };
        return next;
      }
      return [...prev, { ...line, quantity: line.quantity || 1 }];
    });
  }, []);

  const removeLine = useCallback((lineId) => {
    setItems((prev) => prev.filter((x) => x.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId, quantity) => {
    const q = Math.max(1, Math.floor(Number(quantity) || 1));
    setItems((prev) =>
      prev.map((li) => {
        if (li.lineId !== lineId) return li;
        const max = Math.max(1, Number(li.stock) || 1);
        return { ...li, quantity: Math.min(q, max) };
      })
    );
  }, []);

  const applyVoucherDiscount = useCallback((amount, code) => {
    setDiscount(Math.max(0, Number(amount) || 0));
    const c = String(code || "").trim().toUpperCase();
    setAppliedVoucherCode(c || null);
  }, []);

  const clearVoucherDiscount = useCallback(() => {
    setDiscount(0);
    setAppliedVoucherCode(null);
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setAppliedVoucherCode(null);
  }, []);

  const restoreLine = useCallback((line) => {
    setItems((prev) => {
      if (prev.some((x) => x.lineId === line.lineId)) return prev;
      return [...prev, line];
    });
  }, []);

  const itemCount = useMemo(() => items.reduce((s, li) => s + li.quantity, 0), [items]);

  const totals = useMemo(() => computeCartTotals(items, discount), [items, discount]);

  const allInStock = useMemo(() => cartAllInStock(items), [items]);

  const value = useMemo(
    () => ({
      items,
      discount,
      setDiscount,
      appliedVoucherCode,
      applyVoucherDiscount,
      clearVoucherDiscount,
      addFromProduct,
      addLine,
      removeLine,
      restoreLine,
      updateQuantity,
      clear,
      itemCount,
      totals,
      allInStock,
    }),
    [
      items,
      discount,
      appliedVoucherCode,
      applyVoucherDiscount,
      clearVoucherDiscount,
      addFromProduct,
      addLine,
      removeLine,
      restoreLine,
      updateQuantity,
      clear,
      itemCount,
      totals,
      allInStock,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
