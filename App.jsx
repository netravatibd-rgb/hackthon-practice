
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:3001/api";
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [nearbySellers, setNearbySellers] = useState([]);
  const [tab, setTab] = useState("Shop");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [customer, setCustomer] = useState("Local Customer");

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Home",
    price: "",
    stock: "",
    sellerId: "1",
    emoji: "🛍️",
  });

  async function request(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    return data;
  }

  async function refresh() {
    try {
      const [p, o, a, sellers] = await Promise.all([
        request("/products"),
        request("/orders"),
        request("/analytics"),
        request("/nearby-sellers"),
      ]);

      setProducts(p);
      setOrders(o);
      setAnalytics(a);
      setNearbySellers(sellers);
    } catch (error) {
      setNotice(
        "Can't load marketplace data. Check that your backend is running."
      );
      console.error("Refresh failed:", error);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const categories = ["All", "Gifts", "Fashion", "Home", "Beauty"];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        category === "All" || p.category === category;

      const q = search.toLowerCase();

      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        (p.sellerName || "").toLowerCase().includes(q) ||
        (p.area || "").toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function addToCart(product) {
    if (product.stock < 1) return;

    setCart((old) => {
      const existing = old.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) return old;

        return old.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...old, { ...product, quantity: 1 }];
    });

    setNotice(`${product.name} added to your cart`);
  }

  function changeQuantity(id, delta) {
    setCart((old) =>
      old
        .map((item) => {
          if (item.id !== id) return item;

          const product = products.find((p) => p.id === id);

          return {
            ...item,
            quantity: Math.min(
              product?.stock ?? 0,
              item.quantity + delta
            ),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  async function checkout() {
    if (!cart.length || busy) return;

    setBusy(true);

    try {
      const order = await request("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: customer,
          items: cart.map(({ id, quantity }) => ({
            id,
            quantity,
          })),
        }),
      });

      setCart([]);
      setNotice(`Order #${order.id} placed successfully!`);
      setTab("Orders");
      await refresh();
    } catch (error) {
      setNotice(error.message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addProduct(event) {
    event.preventDefault();

    try {
      await request("/products", {
        method: "POST",
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock),
          sellerId: Number(newProduct.sellerId),
        }),
      });

      setNewProduct({
        name: "",
        category: "Home",
        price: "",
        stock: "",
        sellerId: "1",
        emoji: "🛍️",
      });

      setNotice("Product listed successfully!");
      await refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateStock(product, value) {
    try {
      await request(`/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stock: Number(value) }),
      });

      setNotice("Inventory updated");
      await refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateOrder(order, status) {
    try {
      await request(`/orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setNotice(`Order #${order.id} updated`);
      await refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  function recommendations(product) {
    return products.filter(
      (p) =>
        p.id !== product.id &&
        p.stock > 0 &&
        p.category === product.category &&
        p.price <= product.price
    );
  }

  function exploreSeller(seller) {
    setSearch(seller.area);
    setCategory("All");
    setTab("Shop");

    setTimeout(() => {
      document.getElementById("market")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 0);
  }

  function NearbySellerCards() {
    if (nearbySellers.length === 0) {
      return (
        <div className="empty-state">
          <span>📍</span>
          <h3>Loading nearby sellers...</h3>
          <p>
            Seller information will appear when the backend responds.
          </p>
          <button className="text-button" onClick={refresh}>
            Try again ↻
          </button>
        </div>
      );
    }

    return (
      <div className="nearby-sellers-grid">
        {nearbySellers.map((seller) => (
          <article
            className="panel nearby-seller-card"
            key={seller.id}
          >
            <div className="panel-heading">
              <div>
                <div className="eyebrow">LOCAL SELLER</div>
                <h2>{seller.name}</h2>
              </div>
              <span className="panel-icon">📍</span>
            </div>

            <p className="nearby-area">📍 {seller.area}</p>

            <div className="nearby-stats">
              <div>
                <strong>{seller.availableProducts}</strong>
                <span>In-stock products</span>
              </div>
              <div>
                <strong>{seller.productCount}</strong>
                <span>Listed products</span>
              </div>
            </div>

            <div className="summary-line">
              <span>Estimated delivery</span>
              <strong>{seller.deliveryEstimate}</strong>
            </div>

            <small className="muted-text">
              {seller.deliveryType}
            </small>

            <button
              className="primary-button full-button"
              onClick={() => exploreSeller(seller)}
            >
              Explore this area ↗
            </button>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("Shop");
          }}
        >
          <span className="brand-icon">n</span>
          <span>
            near<span className="brand-accent">kart</span>
            <small>YOUR CITY. YOUR STORES.</small>
          </span>
        </a>

        <div className="top-actions">
          <span className="local-tag">● Supporting local</span>
          <button
            className="cart-button"
            onClick={() => setTab("Cart")}
          >
            ♧ Cart <b>{cartCount}</b>
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        {["Shop", "Cart", "Orders", "Seller"].map((item) => (
          <button
            key={item}
            className={
              tab === item ? "nav-tab active" : "nav-tab"
            }
            onClick={() => setTab(item)}
          >
            {item === "Shop"
              ? "⌕ "
              : item === "Cart"
                ? "♧ "
                : item === "Orders"
                  ? "▤ "
                  : "▦ "}
            {item}
            {item === "Cart" && cartCount > 0
              ? ` (${cartCount})`
              : ""}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {notice && (
          <div className="notice">
            <span>{notice}</span>
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {/* CUSTOMER SHOP */}
        {tab === "Shop" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <div className="eyebrow">
                  <span>✳</span> THE NEIGHBOURHOOD MARKETPLACE
                </div>

                <h1>
                  Good things are
                  <br />
                  closer than <em>you think.</em>
                </h1>

                <p>
                  Discover hidden gems from the independent shops
                  <br className="desktop-break" /> that make your
                  neighbourhood special.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    document
                      .getElementById("market")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore local finds <span>↗</span>
                </button>

                <div className="hero-proof">
                  <span>✳</span> Every purchase supports a local dream.
                </div>
              </div>

              <div className="hero-art">
                <div className="art-orbit orbit-one"></div>
                <div className="art-orbit orbit-two"></div>
                <div className="art-center">🛍️</div>
                <div className="art-float art-top">
                  🌿 <span>Thoughtfully made</span>
                </div>
                <div className="art-float art-bottom">
                  ♡ <span>Locally loved</span>
                </div>
                <span className="art-spark spark-one">✳</span>
                <span className="art-spark spark-two">✦</span>
              </div>
            </section>

            <section className="stats-strip">
              <div>
                <strong>
                  {products.length.toString().padStart(2, "0")}
                </strong>
                <span>Local finds</span>
              </div>
              <div>
                <strong>
                  {new Set(products.map((p) => p.sellerId))
                    .size.toString()
                    .padStart(2, "0")}
                </strong>
                <span>Independent sellers</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Neighbourhood spirit</span>
              </div>
              <div className="stats-message">
                Small shops.
                <br />
                <em>Big heart.</em>
              </div>
            </section>

            {/* NEW: NEARBY SELLER FINDER */}
            <section className="page-section nearby-section">
              <div className="eyebrow">DELIVERY, MADE LOCAL</div>
              <h1>
                Meet your <em>nearby sellers.</em>
              </h1>
              <p className="page-intro">
                Discover neighbourhood shops, check available stock,
                and view estimated delivery times.
              </p>

              <NearbySellerCards />

              <p className="muted-text nearby-disclaimer">
                Delivery times are demo estimates, not live courier
                tracking or exact distance calculations.
              </p>
            </section>

            <section className="market-section" id="market">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">CURATED AROUND YOU</div>
                  <h2>
                    Find your next <em>favourite.</em>
                  </h2>
                </div>
                <span className="result-count">
                  {filtered.length} FINDS
                </span>
              </div>

              <div className="search-row">
                <div className="search-box">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products, shops, neighbourhoods..."
                  />
                </div>

                <div className="category-list">
                  {categories.map((c) => (
                    <button
                      key={c}
                      className={
                        category === c
                          ? "category-chip selected"
                          : "category-chip"
                      }
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-grid">
                {filtered.map((p) => {
                  const matches = recommendations(p);

                  return (
                    <article className="product-card" key={p.id}>
                      <div
                        className={`product-visual visual-${p.category.toLowerCase()}`}
                      >
                        <span className="product-emoji">
                          {p.emoji}
                        </span>
                        <span className="product-category">
                          {p.category}
                        </span>

                        {p.stock === 0 && (
                          <span className="sold-out">Sold out</span>
                        )}

                        {p.stock > 0 && p.stock <= 4 && (
                          <span className="low-stock">
                            Only {p.stock} left
                          </span>
                        )}
                      </div>

                      <div className="product-info">
                        <div className="seller-line">
                          <span className="seller-dot">✳</span>
                          {p.sellerName}
                          <span className="seller-area">
                            · {p.area}
                          </span>
                        </div>

                        <h3>{p.name}</h3>

                        <div className="product-bottom">
                          <strong>{money(p.price)}</strong>
                          <button
                            disabled={p.stock === 0}
                            onClick={() => addToCart(p)}
                            aria-label={`Add ${p.name} to cart`}
                          >
                            {p.stock === 0 ? "Unavailable" : "+ Add"}
                          </button>
                        </div>

                        {matches.length > 0 && (
                          <div className="match-note">
                            ✦ Local Match: {matches[0].name} ·{" "}
                            {money(matches[0].price)}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="empty-state">
                  <span>⌕</span>
                  <h3>No finds just yet</h3>
                  <p>Try a different search or category.</p>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setSearch("");
                      setCategory("All");
                    }}
                  >
                    See everything
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {/* CART */}
        {tab === "Cart" && (
          <section className="page-section">
            <div className="eyebrow">YOUR LOCAL FINDS</div>
            <h1>
              Your <em>basket.</em>
            </h1>

            {cart.length === 0 ? (
              <div className="empty-state">
                <span>♧</span>
                <h3>Your basket is taking a little break.</h3>
                <p>Find something lovely from a local shop.</p>
                <button
                  className="primary-button"
                  onClick={() => setTab("Shop")}
                >
                  Explore the marketplace ↗
                </button>
              </div>
            ) : (
              <div className="cart-layout">
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div className="cart-emoji">{item.emoji}</div>

                      <div className="cart-description">
                        <h3>{item.name}</h3>
                        <p>
                          {item.sellerName} · {item.area}
                        </p>
                        <strong>{money(item.price)}</strong>
                      </div>

                      <div className="quantity-control">
                        <button
                          onClick={() =>
                            changeQuantity(item.id, -1)
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          disabled={item.quantity >= item.stock}
                          onClick={() =>
                            changeQuantity(item.id, 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <strong>
                        {money(item.price * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>

                <aside className="order-summary">
                  <h3>Order summary</h3>

                  <label>
                    Your name
                    <input
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                    />
                  </label>

                  <div className="summary-line">
                    <span>Subtotal</span>
                    <span>{money(total)}</span>
                  </div>

                  <div className="summary-line">
                    <span>Local delivery</span>
                    <span className="free-label">Demo</span>
                  </div>

                  <div className="summary-total">
                    <span>Total</span>
                    <strong>{money(total)}</strong>
                  </div>

                  <button
                    className="primary-button full-button"
                    disabled={busy}
                    onClick={checkout}
                  >
                    {busy ? "Placing order..." : "Place demo order ↗"}
                  </button>

                  <p className="demo-note">
                    Demo checkout only — no payment will be collected.
                  </p>
                </aside>
              </div>
            )}
          </section>
        )}

        {/* ORDERS */}
        {tab === "Orders" && (
          <section className="page-section">
            <div className="eyebrow">THE JOURNEY OF YOUR FINDS</div>
            <h1>
              Order <em>book.</em>
            </h1>

            {orders.length === 0 ? (
              <div className="empty-state">
                <span>▤</span>
                <h3>Your story starts with a local find.</h3>
                <p>Orders you place will appear here.</p>
                <button
                  className="primary-button"
                  onClick={() => setTab("Shop")}
                >
                  Discover products ↗
                </button>
              </div>
            ) : (
              <div className="order-list">
                {[...orders].reverse().map((o) => (
                  <article className="order-card" key={o.id}>
                    <div className="order-card-top">
                      <div>
                        <span className="order-number">
                          ORDER #{String(o.id).padStart(4, "0")}
                        </span>
                        <h3>{o.customerName}</h3>
                        <p>
                          {new Date(o.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <span
                        className={`status-pill status-${o.status.toLowerCase()}`}
                      >
                        {o.status}
                      </span>
                    </div>

                    <div className="order-products">
                      {(o.items || []).map((i) => (
                        <span key={i.id}>
                          {i.name} × {i.quantity}
                        </span>
                      ))}
                    </div>

                    <div className="order-card-bottom">
                      <strong>{money(o.total)}</strong>
                      <span>
                        {o.items?.length || 0} product types
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SELLER DASHBOARD */}
        {tab === "Seller" && (
          <section className="page-section">
            <div className="eyebrow">MADE FOR THE INDEPENDENT</div>
            <h1>
              Your shop, <em>your story.</em>
            </h1>
            <p className="page-intro">
              Manage your inventory, list new finds, and keep track
              of your sales.
            </p>

            <div className="analytics-grid">
              <div className="metric-card">
                <span>LISTED PRODUCTS</span>
                <strong>{analytics.totalProducts ?? 0}</strong>
                <small>Across the marketplace</small>
              </div>

              <div className="metric-card">
                <span>ORDERS PLACED</span>
                <strong>{analytics.totalOrders ?? 0}</strong>
                <small>Not including cancellations</small>
              </div>

              <div className="metric-card">
                <span>DEMO SALES</span>
                <strong>{money(analytics.revenue ?? 0)}</strong>
                <small>From placed demo orders</small>
              </div>

              <div className="metric-card">
                <span>UNITS SOLD</span>
                <strong>{analytics.unitsSold ?? 0}</strong>
                <small>Items in active orders</small>
              </div>
            </div>

            {/* NEW: SELLER DELIVERY OVERVIEW */}
            <section className="panel nearby-dashboard">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">
                    LOCAL DELIVERY NETWORK
                  </div>
                  <h2>Nearby seller overview</h2>
                </div>
                <span className="panel-icon">📍</span>
              </div>

              <p className="muted-text">
                Explore local seller coverage and demo delivery
                estimates.
              </p>

              {nearbySellers.map((seller) => (
                <div className="manage-order" key={seller.id}>
                  <div>
                    <strong>{seller.name}</strong>
                    <small>
                      {seller.area} · {seller.availableProducts}{" "}
                      products in stock
                    </small>
                  </div>
                  <strong>{seller.deliveryEstimate}</strong>
                </div>
              ))}

              {nearbySellers.length === 0 && (
                <p className="muted-text">
                  Seller information is loading.
                </p>
              )}

              <p className="muted-text nearby-disclaimer">
                Estimates are illustrative, not live courier tracking.
              </p>
            </section>

            <div className="seller-columns">
              <form className="panel" onSubmit={addProduct}>
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">GROW YOUR SHELF</div>
                    <h2>List a new find</h2>
                  </div>
                  <span className="panel-icon">＋</span>
                </div>

                <label>
                  Product name
                  <input
                    required
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Handwoven basket"
                  />
                </label>

                <div className="form-row">
                  <label>
                    Category
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                    >
                      <option>Home</option>
                      <option>Gifts</option>
                      <option>Fashion</option>
                      <option>Beauty</option>
                    </select>
                  </label>

                  <label>
                    Seller
                    <select
                      value={newProduct.sellerId}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          sellerId: e.target.value,
                        })
                      }
                    >
                      <option value="1">Maya Crafts</option>
                      <option value="2">Green Basket</option>
                      <option value="3">Clay Corner</option>
                    </select>
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Price (₹)
                    <input
                      required
                      type="number"
                      min="0"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          price: e.target.value,
                        })
                      }
                      placeholder="499"
                    />
                  </label>

                  <label>
                    Stock quantity
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={newProduct.stock}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          stock: e.target.value,
                        })
                      }
                      placeholder="10"
                    />
                  </label>
                </div>

                <button className="primary-button full-button">
                  Publish product ↗
                </button>
              </form>

              <div className="panel inventory-panel">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">LIVE STOCK CONTROL</div>
                    <h2>Your inventory</h2>
                  </div>
                  <span className="panel-icon">▤</span>
                </div>

                <p className="muted-text">
                  Change a quantity to update stock immediately.
                </p>

                <div className="inventory-list">
                  {products.map((p) => (
                    <div className="inventory-row" key={p.id}>
                      <span className="inventory-emoji">
                        {p.emoji}
                      </span>

                      <div className="inventory-name">
                        <strong>{p.name}</strong>
                        <small>{p.sellerName}</small>
                      </div>

                      <label className="stock-input">
                        <span>Stock</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={p.stock}
                          key={`${p.id}-${p.stock}`}
                          onBlur={(e) => {
                            if (
                              Number(e.target.value) !== p.stock
                            ) {
                              updateStock(p, e.target.value);
                            }
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="stock-footer">
                  ✦ {analytics.lowStock ?? 0} products have low stock
                </div>
              </div>
            </div>

            <div className="panel recent-orders">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">FULFILMENT</div>
                  <h2>Recent orders</h2>
                </div>

                <button
                  className="text-button"
                  onClick={() => setTab("Orders")}
                >
                  View all ↗
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="muted-text">
                  No orders yet. Your first sale is waiting!
                </p>
              ) : (
                [...orders].reverse().slice(0, 5).map((o) => (
                  <div className="manage-order" key={o.id}>
                    <div>
                      <strong>
                        Order #{o.id} · {o.customerName}
                      </strong>
                      <small>
                        {(o.items || [])
                          .map(
                            (i) => `${i.name} × ${i.quantity}`
                          )
                          .join(", ")}
                      </small>
                    </div>

                    <strong>{money(o.total)}</strong>

                    <select
                      value={o.status}
                      onChange={(e) =>
                        updateOrder(o, e.target.value)
                      }
                      disabled={["Completed", "Cancelled"].includes(
                        o.status
                      )}
                    >
                      <option>Placed</option>
                      <option>Processing</option>
                      <option>Ready</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <a
          className="brand footer-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("Shop");
          }}
        >
          <span className="brand-icon">n</span>
          <span>
            near<span className="brand-accent">kart</span>
          </span>
        </a>

        <p>
          Good things happen when we shop close to home.
        </p>

        <span>MADE FOR LOCAL DREAMS ✳</span>
      </footer>
    </div>
  );
}

export default App;
