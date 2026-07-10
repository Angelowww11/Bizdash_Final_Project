const { useEffect, useMemo, useRef, useState } = React;

const GREEN = '#006B3F';
const DARK_GREEN = '#014421';
const GOLD = '#F4C430';
const MUTED = '#6B7280';

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({
    ok: false,
    message: 'The server returned an invalid response.',
  }));

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

function money(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortDate(value) {
  if (!value) return 'No date';
  return new Date(value.replace(' ', 'T')).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function todayISO() {
  return localISO(new Date());
}

function monthStartISO() {
  const now = new Date();
  return localISO(new Date(now.getFullYear(), now.getMonth(), 1));
}

function daysAgoISO(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localISO(date);
}

function localISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function stockBadge(product) {
  const quantity = Number(product.stock_quantity || 0);
  const low = Number(product.low_stock_level || 0);

  if (quantity <= 0) return <span className="badge danger">Out of stock</span>;
  if (quantity <= low) return <span className="badge warn">Low stock</span>;
  return <span className="badge good">In stock</span>;
}

function Notice({ notice }) {
  if (!notice) return null;
  return <div className={`notice ${notice.type === 'error' ? 'error' : ''}`}>{notice.message}</div>;
}

function PlotCard({ title, subtitle, data, layout }) {
  const ref = useRef(null);

  useEffect(() => {
    const plotNode = ref.current;
    const plotly = window.Plotly;

    if (!plotly || !plotNode) return undefined;

    const finalLayout = {
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Inter, Arial, sans-serif', color: '#1F2937' },
      margin: { t: 24, r: 18, b: 42, l: 48 },
      colorway: [GREEN, GOLD, DARK_GREEN, '#3B82F6', '#F97316'],
      ...layout,
    };

    plotly.newPlot(plotNode, data, finalLayout, {
      responsive: true,
      displaylogo: false,
    });

    return () => {
      try {
        plotly.purge(plotNode);
      } catch (error) {
        console.warn('Plot cleanup skipped.', error);
      }
    };
  }, [data, layout]);

  return (
    <section className="chart-panel">
      <div className="panel-title">
        <div>
          <h3>{title}</h3>
          {subtitle ? <small>{subtitle}</small> : null}
        </div>
      </div>
      <div ref={ref} className="plot" />
    </section>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [notice, setNotice] = useState(null);

  function notify(message, type = 'success') {
    setNotice({ message, type });
    window.clearTimeout(window.bizdashNoticeTimer);
    window.bizdashNoticeTimer = window.setTimeout(() => setNotice(null), 3200);
  }

  useEffect(() => {
    apiFetch('api/auth.php')
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="spinner" aria-label="Loading" />
      </main>
    );
  }

  if (!user) {
    return (
      <>
        <PublicSite onLoggedIn={setUser} notify={notify} />
        <Notice notice={notice} />
      </>
    );
  }

  return (
    <>
      <Shell
        user={user}
        view={view}
        setView={setView}
        setUser={setUser}
        notify={notify}
      />
      <Notice notice={notice} />
    </>
  );
}

function PublicSite({ onLoggedIn, notify }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);

  function fillDemo(username, password) {
    setForm({ username, password });
  }

  async function login(event) {
    event.preventDefault();
    setBusy(true);

    try {
      const data = await apiFetch('api/auth.php', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      notify(data.message);
      onLoggedIn(data.user);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="public-shell">
      <nav className="public-nav">
        <div className="brand-lockup">
          <img className="brand-logo" src="assets/img/logo.png" alt="BizDash logo" />
          <span>BizDash</span>
        </div>
        <div className="public-actions">
          <button className="btn btn-gold" onClick={() => fillDemo('admin', 'admin123')}>Use admin demo</button>
          <button className="btn btn-soft" onClick={() => fillDemo('staff', 'staff123')}>Use staff demo</button>
        </div>
      </nav>

      <section className="public-main">
        <div className="hero-copy">
          <h1>Business Dashboard, Inventory, and Sales Management System</h1>
          <p>
            A React and native PHP system for micro and small businesses. Record products,
            stock-in purchases, sales transactions, profit, low-stock alerts, and reports
            in one FEU-inspired dashboard.
          </p>
          <div className="hero-grid">
            <div className="hero-stat">
              <strong>CRUD</strong>
              <span>Products, categories, inventory, sales, and users.</span>
            </div>
            <div className="hero-stat">
              <strong>Roles</strong>
              <span>Admin tools and staff cashier workflow.</span>
            </div>
            <div className="hero-stat">
              <strong>Charts</strong>
              <span>Interactive Plotly analysis for sales and stock.</span>
            </div>
          </div>
        </div>

        <div className="login-stack">
          <img className="login-mascot" src="assets/img/mascot.png" alt="BizDash mascot" />
          <form className="login-panel" onSubmit={login}>
            <h2>Login</h2>
            <p>Choose the account type for the workflow you want to test.</p>
            <div className="demo-grid">
              <button type="button" className="demo-card" onClick={() => fillDemo('admin', 'admin123')}>
                <strong>Admin</strong>
                <span>Products, reports, users</span>
              </button>
              <button type="button" className="demo-card" onClick={() => fillDemo('staff', 'staff123')}>
                <strong>Staff</strong>
                <span>Sales and stock updates</span>
              </button>
            </div>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="admin123"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign in to BizDash'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Shell({ user, view, setView, setUser, notify }) {
  const navItems = user.role === 'admin'
    ? [
        ['dashboard', 'Dashboard'],
        ['products', 'Products'],
        ['inventory', 'Inventory'],
        ['sales', 'Sales'],
        ['reports', 'Reports'],
        ['users', 'Users'],
      ]
    : [
        ['dashboard', 'Dashboard'],
        ['inventory', 'Inventory'],
        ['sales', 'Sales'],
        ['reports', 'Reports'],
      ];

  async function logout() {
    try {
      await apiFetch('api/auth.php', { method: 'DELETE' });
      setUser(null);
      setView('dashboard');
      notify('Logged out.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  const titles = {
    dashboard: ['Dashboard', 'Daily overview of sales, profit, inventory, and low-stock alerts.'],
    products: ['Product Management', 'Add, edit, search, and deactivate products. Admin only.'],
    inventory: ['Inventory and Stock-In', 'Record purchased products and track all stock movements.'],
    sales: ['Sales Transaction', 'Point-of-sale style cart with automatic stock deduction.'],
    reports: ['Reports and Analysis', 'Filter sales, profit, payments, and inventory reports by date.'],
    users: ['User Management', 'Create admin and staff accounts. Admin only.'],
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <img className="brand-logo" src="assets/img/logo.png" alt="BizDash logo" />
          <div>
            <strong>BizDash</strong>
            <br />
            <span className="role-pill">{user.role}</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(([key, label]) => (
            <button
              key={key}
              className={`btn nav-item ${view === key ? 'active' : ''}`}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note mascot-note">
          <img src="assets/img/mascot.png" alt="BizDash mascot" />
          <span>Track stock, sales, profit, and reports in one workspace.</span>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <h1>{titles[view][0]}</h1>
            <p>{titles[view][1]}</p>
          </div>
          <div className="inline-actions">
            <span className="badge good">{user.full_name}</span>
            <button className="btn btn-muted" onClick={logout}>Logout</button>
          </div>
        </header>
        <div className="content">
          {view === 'dashboard' && <Dashboard user={user} setView={setView} notify={notify} />}
          {view === 'products' && <Products user={user} notify={notify} />}
          {view === 'inventory' && <Inventory notify={notify} />}
          {view === 'sales' && <Sales notify={notify} />}
          {view === 'reports' && <Reports notify={notify} />}
          {view === 'users' && <Users user={user} notify={notify} />}
        </div>
      </section>
    </main>
  );
}

function AccessPanel() {
  return (
    <section className="access-panel">
      <h2>Admin access required</h2>
      <p>This section changes records that should be controlled by the business owner or admin.</p>
    </section>
  );
}

function Dashboard({ user, setView, notify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await apiFetch('api/dashboard.php'));
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !data) return <div className="loading-screen"><div className="spinner" /></div>;

  const summary = data.summary;
  const salesDays = data.sales_by_day || [];
  const categoryStock = data.category_stock || [];
  const topProducts = data.top_products || [];
  const totalSales = Number(summary.total_sales || 0);
  const totalProfit = Number(summary.total_profit || 0);
  const profitMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;
  const quickActions = [
    { label: 'Record a sale', detail: 'Open POS cart', view: 'sales' },
    { label: 'Add stock', detail: 'Update inventory', view: 'inventory' },
    { label: 'View reports', detail: 'Print summaries', view: 'reports' },
  ];

  if (user.role === 'admin') {
    quickActions.splice(2, 0, { label: 'Manage products', detail: 'Prices and stock rules', view: 'products' });
  }

  return (
    <>
      <section className="section-head">
        <div>
          <h2>Business overview</h2>
          <p>These cards and charts update after every product, stock-in, and sales transaction.</p>
        </div>
        <button className="btn btn-soft" onClick={load}>Refresh data</button>
      </section>

      <section className="stats-grid">
        <StatCard label="Total Sales" value={money(summary.total_sales)} />
        <StatCard label="Total Profit" value={money(summary.total_profit)} />
        <StatCard label="Products" value={summary.product_count} />
        <StatCard label="Transactions" value={summary.transaction_count} />
        <StatCard label="Low Stock" value={summary.low_stock_count} />
        <StatCard label="Inventory Value" value={money(summary.inventory_value)} />
      </section>

      <section className="dashboard-actions mt">
        {quickActions.map((action) => (
          <button className="action-card" key={action.view} onClick={() => setView(action.view)}>
            <strong>{action.label}</strong>
            <span>{action.detail}</span>
          </button>
        ))}
      </section>

      <section className="insight-strip mt">
        <article>
          <span>Profit margin</span>
          <strong>{profitMargin}%</strong>
        </article>
        <article>
          <span>Inventory health</span>
          <strong>{summary.low_stock_count > 0 ? `${summary.low_stock_count} needs attention` : 'Stock looks good'}</strong>
        </article>
        <article>
          <span>Today workflow</span>
          <strong>Sell, stock-in, review reports</strong>
        </article>
      </section>

      <section className="grid-2 mt">
        <PlotCard
          title="Sales and profit trend"
          subtitle="Last 14 days"
          data={[
            {
              x: salesDays.map((row) => row.label),
              y: salesDays.map((row) => Number(row.sales)),
              name: 'Sales',
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: GREEN, width: 3 },
            },
            {
              x: salesDays.map((row) => row.label),
              y: salesDays.map((row) => Number(row.profit)),
              name: 'Profit',
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: GOLD, width: 3 },
            },
          ]}
        />
        <PlotCard
          title="Stock by category"
          data={[
            {
              labels: categoryStock.map((row) => row.label),
              values: categoryStock.map((row) => Number(row.stock)),
              type: 'pie',
              hole: 0.45,
            },
          ]}
          layout={{ showlegend: true }}
        />
      </section>

      <section className="grid-3 mt">
        <PlotCard
          title="Best-selling items"
          data={[
            {
              x: topProducts.map((row) => row.label),
              y: topProducts.map((row) => Number(row.quantity)),
              type: 'bar',
              marker: { color: GREEN },
            },
          ]}
          layout={{ margin: { t: 24, r: 16, b: 78, l: 45 } }}
        />
        <LowStockPanel rows={data.low_stock} />
        <RecentActivity sales={data.recent_sales} stock={data.recent_stock} />
      </section>
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function LowStockPanel({ rows }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h3>Low-stock alerts</h3>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state">No low-stock products.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.product_id}>
                  <td>
                    <strong>{row.product_name}</strong>
                    <br />
                    <small>{row.category_name || 'Uncategorized'}</small>
                  </td>
                  <td>
                    <span className="badge warn">{row.stock_quantity} left</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecentActivity({ sales, stock }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h3>Recent activity</h3>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 4).map((row) => (
              <tr key={row.invoice_number}>
                <td><span className="badge good">Sale</span></td>
                <td>{row.invoice_number}<br /><small>{money(row.total_amount)} by {row.cashier_name || 'User'}</small></td>
              </tr>
            ))}
            {stock.slice(0, 4).map((row) => (
              <tr key={`stock-${row.log_id}`}>
                <td><span className="badge">Stock</span></td>
                <td>{row.product_name}<br /><small>{row.quantity_changed} units, {shortDate(row.date_updated)}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Products({ user, notify }) {
  if (user.role !== 'admin') return <AccessPanel />;

  const emptyProduct = {
    product_id: '',
    product_name: '',
    category_id: '',
    description: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: 0,
    low_stock_level: 10,
    product_image: '',
    status: 'active',
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState({ category_name: '', description: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ search, status: 'all' }).toString();
      const data = await apiFetch(`api/products.php?${query}`);
      setProducts(data.products);
      setCategories(data.categories);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveProduct(event) {
    event.preventDefault();
    const isEdit = Boolean(form.product_id);

    try {
      const data = await apiFetch('api/products.php', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      notify(data.message);
      setForm(emptyProduct);
      load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function saveCategory(event) {
    event.preventDefault();

    try {
      const data = await apiFetch('api/categories.php', {
        method: 'POST',
        body: JSON.stringify(categoryForm),
      });
      notify(data.message);
      setCategoryForm({ category_name: '', description: '' });
      load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function deactivateProduct(product) {
    if (!window.confirm(`Deactivate ${product.product_name}?`)) return;

    try {
      const data = await apiFetch('api/products.php', {
        method: 'DELETE',
        body: JSON.stringify({ product_id: product.product_id }),
      });
      notify(data.message);
      load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  function editProduct(product) {
    setForm({
      product_id: product.product_id,
      product_name: product.product_name || '',
      category_id: product.category_id || '',
      description: product.description || '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      low_stock_level: product.low_stock_level,
      product_image: product.product_image || '',
      status: product.status || 'active',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const formCost = Number(form.cost_price || 0);
  const formPrice = Number(form.selling_price || 0);
  const formProfit = formPrice - formCost;
  const formMargin = formPrice > 0 ? Math.round((formProfit / formPrice) * 100) : 0;

  return (
    <>
      <section className="screen-grid">
        <div className="form-panel">
          <div className="panel-title">
            <h3>{form.product_id ? 'Edit product' : 'Add product'}</h3>
          </div>
          <form onSubmit={saveProduct}>
            <div className="field">
              <label>Product name</label>
              <input value={form.product_name} onChange={(event) => setForm({ ...form, product_name: event.target.value })} required />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Cost price</label>
                <input type="number" min="0" step="0.01" value={form.cost_price} onChange={(event) => setForm({ ...form, cost_price: event.target.value })} required />
              </div>
              <div className="field">
                <label>Selling price</label>
                <input type="number" min="0" step="0.01" value={form.selling_price} onChange={(event) => setForm({ ...form, selling_price: event.target.value })} required />
              </div>
            </div>
            <div className={`form-insight ${formProfit < 0 ? 'danger' : ''}`}>
              <span>Price check</span>
              <strong>{money(formProfit)} profit per item</strong>
              <small>{formMargin}% margin based on the selling price</small>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Initial stock</label>
                <input type="number" min="0" value={form.stock_quantity} disabled={Boolean(form.product_id)} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} />
              </div>
              <div className="field">
                <label>Low-stock level</label>
                <input type="number" min="0" value={form.low_stock_level} onChange={(event) => setForm({ ...form, low_stock_level: event.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Product image path or URL</label>
              <input value={form.product_image} onChange={(event) => setForm({ ...form, product_image: event.target.value })} placeholder="assets/img/product.png" />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            {form.product_id ? (
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            ) : null}
            <div className="inline-actions">
              <button className="btn btn-primary" type="submit">{form.product_id ? 'Update product' : 'Add product'}</button>
              {form.product_id ? <button className="btn btn-muted" type="button" onClick={() => setForm(emptyProduct)}>Cancel</button> : null}
            </div>
          </form>

          <form className="mt" onSubmit={saveCategory}>
            <div className="panel-title">
              <h3>Add category</h3>
            </div>
            <div className="field">
              <label>Category name</label>
              <input value={categoryForm.category_name} onChange={(event) => setCategoryForm({ ...categoryForm, category_name: event.target.value })} required />
            </div>
            <div className="field">
              <label>Description</label>
              <input value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
            </div>
            <button className="btn btn-soft" type="submit">Add category</button>
          </form>
        </div>

        <div className="table-panel">
          <div className="panel-title">
            <h3>Product records</h3>
            <div className="inline-actions">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
              <button className="btn btn-soft" onClick={load}>Search</button>
            </div>
          </div>
          {loading ? <div className="empty-state">Loading products...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Cost</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.product_id}>
                      <td>
                        <strong>{product.product_name}</strong>
                        <br />
                        <small>{product.description || 'No description'}</small>
                      </td>
                      <td>{product.category_name || 'Uncategorized'}</td>
                      <td>{money(product.cost_price)}</td>
                      <td>{money(product.selling_price)}</td>
                      <td>{product.stock_quantity} {stockBadge(product)}</td>
                      <td><span className={`badge ${product.status === 'active' ? 'good' : 'danger'}`}>{product.status}</span></td>
                      <td>
                        <div className="inline-actions">
                          <button className="btn btn-soft" onClick={() => editProduct(product)}>Edit</button>
                          <button className="btn btn-danger" onClick={() => deactivateProduct(product)}>Deactivate</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Inventory({ notify }) {
  const [data, setData] = useState({ products: [], logs: [], stock_in: [] });
  const [form, setForm] = useState({ product_id: '', quantity_added: 1, cost_price: '', supplier_name: '' });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await apiFetch('api/inventory.php'));
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function selectProduct(productId) {
    const product = data.products.find((row) => String(row.product_id) === String(productId));
    setForm({
      ...form,
      product_id: productId,
      cost_price: product ? product.cost_price : form.cost_price,
    });
  }

  async function saveStock(event) {
    event.preventDefault();

    try {
      const response = await apiFetch('api/inventory.php', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      notify(response.message);
      setForm({ product_id: '', quantity_added: 1, cost_price: '', supplier_name: '' });
      load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  const activeProducts = data.products.filter((product) => product.status === 'active');
  const selectedStockProduct = data.products.find((row) => String(row.product_id) === String(form.product_id));
  const addedQuantity = Math.max(0, Number(form.quantity_added) || 0);
  const projectedStock = selectedStockProduct ? Number(selectedStockProduct.stock_quantity) + addedQuantity : addedQuantity;
  const inventoryValue = data.products.reduce((sum, product) => (
    sum + Number(product.stock_quantity || 0) * Number(product.cost_price || 0)
  ), 0);
  const lowStockCount = activeProducts.filter((product) => Number(product.stock_quantity || 0) <= Number(product.low_stock_level || 0)).length;

  return (
    <section className="screen-grid">
      <div className="form-panel">
        <div className="panel-title">
          <h3>Add stock / stock-in</h3>
        </div>
        <form onSubmit={saveStock}>
          <div className="field">
            <label>Product</label>
            <select value={form.product_id} onChange={(event) => selectProduct(event.target.value)} required>
              <option value="">Select product</option>
              {activeProducts.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.product_name} ({product.stock_quantity} left)
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Quantity purchased</label>
            <input type="number" min="1" value={form.quantity_added} onChange={(event) => setForm({ ...form, quantity_added: event.target.value })} required />
          </div>
          <div className="field">
            <label>Cost price per item</label>
            <input type="number" min="0" step="0.01" value={form.cost_price} onChange={(event) => setForm({ ...form, cost_price: event.target.value })} required />
          </div>
          <div className="field">
            <label>Supplier name</label>
            <input value={form.supplier_name} onChange={(event) => setForm({ ...form, supplier_name: event.target.value })} placeholder="Optional" />
          </div>
          {selectedStockProduct ? (
            <div className="form-insight">
              <span>Stock preview</span>
              <strong>{selectedStockProduct.stock_quantity} to {projectedStock} units</strong>
              <small>Total purchase cost: {money(addedQuantity * Number(form.cost_price || 0))}</small>
            </div>
          ) : null}
          <button className="btn btn-primary" type="submit">Save stock-in</button>
        </form>
      </div>

      <div>
        <section className="mini-stats">
          <article>
            <span>Active products</span>
            <strong>{activeProducts.length}</strong>
          </article>
          <article>
            <span>Low stock</span>
            <strong>{lowStockCount}</strong>
          </article>
          <article>
            <span>Inventory value</span>
            <strong>{money(inventoryValue)}</strong>
          </article>
        </section>

        <section className="table-panel mt">
          <div className="panel-title">
            <h3>Current stock levels</h3>
            <button className="btn btn-soft" onClick={load}>Refresh</button>
          </div>
          {loading ? <div className="empty-state">Loading inventory...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Cost</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product) => (
                    <tr key={product.product_id}>
                      <td><strong>{product.product_name}</strong></td>
                      <td>{product.category_name || 'Uncategorized'}</td>
                      <td>{product.stock_quantity} {stockBadge(product)}</td>
                      <td>{money(product.cost_price)}</td>
                      <td>{money(Number(product.stock_quantity) * Number(product.cost_price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="table-panel mt">
          <div className="panel-title">
            <h3>Inventory logs</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Action</th>
                  <th>Change</th>
                  <th>Stock</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.log_id}>
                    <td>{shortDate(log.date_updated)}</td>
                    <td>{log.product_name || 'Deleted product'}</td>
                    <td><span className="badge">{log.action_type}</span></td>
                    <td>{log.quantity_changed}</td>
                    <td>{log.previous_stock} to {log.new_stock}</td>
                    <td>{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="table-panel mt">
          <div className="panel-title">
            <h3>Stock-in purchase records</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Cost</th>
                  <th>Total</th>
                  <th>Supplier</th>
                  <th>Added by</th>
                </tr>
              </thead>
              <tbody>
                {data.stock_in.map((row) => (
                  <tr key={row.stock_in_id}>
                    <td>{shortDate(row.date_added)}</td>
                    <td>{row.product_name || 'Deleted product'}</td>
                    <td>{row.quantity_added}</td>
                    <td>{money(row.cost_price)}</td>
                    <td>{money(row.total_cost)}</td>
                    <td>{row.supplier_name || 'Not specified'}</td>
                    <td>{row.added_by_name || 'User'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

function Sales({ notify }) {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState({ sales: [], items: [] });
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saleSearch, setSaleSearch] = useState('');
  const [salePaymentFilter, setSalePaymentFilter] = useState('all');
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSale, setSavingSale] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [productData, salesData] = await Promise.all([
        apiFetch('api/products.php?status=active'),
        apiFetch('api/sales.php'),
      ]);
      setProducts(productData.products);
      setHistory(salesData);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function addToCart(event) {
    event.preventDefault();
    const product = products.find((row) => String(row.product_id) === String(selectedProduct));
    const qty = Number(quantity);

    if (!product || qty <= 0) {
      notify('Select a product and valid quantity.', 'error');
      return;
    }

    const existing = cart.find((row) => row.product_id === product.product_id);
    const requested = qty + (existing ? existing.quantity : 0);

    if (requested > Number(product.stock_quantity)) {
      notify(`${product.product_name} has only ${product.stock_quantity} stock available.`, 'error');
      return;
    }

    if (existing) {
      setCart(cart.map((row) => (
        row.product_id === product.product_id ? { ...row, quantity: requested } : row
      )));
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          selling_price: Number(product.selling_price),
          cost_price: Number(product.cost_price),
          stock_quantity: Number(product.stock_quantity),
          quantity: qty,
        },
      ]);
    }

    setSelectedProduct('');
    setQuantity(1);
  }

  function normalizeQuantity(value, maxStock) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 1) return 1;
    return Math.min(Math.floor(numeric), Number(maxStock || 1));
  }

  function updateCartQuantity(productId, qty) {
    setCart(cart.map((row) => {
      if (row.product_id !== productId) return row;
      return { ...row, quantity: normalizeQuantity(qty, row.stock_quantity) };
    }));
  }

  function adjustCartQuantity(productId, change) {
    const row = cart.find((item) => item.product_id === productId);
    if (!row) return;
    updateCartQuantity(productId, row.quantity + change);
  }

  function removeFromCart(productId) {
    setCart(cart.filter((item) => item.product_id !== productId));
  }

  async function submitSale() {
    if (cart.length === 0) {
      notify('Add items before saving the sale.', 'error');
      return;
    }

    setSavingSale(true);

    try {
      const data = await apiFetch('api/sales.php', {
        method: 'POST',
        body: JSON.stringify({
          payment_method: paymentMethod,
          items: cart.map((row) => ({ product_id: row.product_id, quantity: row.quantity })),
        }),
      });
      notify(`${data.message} Invoice ${data.invoice_number}`);
      setLastSale(data);
      setCart([]);
      load();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSavingSale(false);
    }
  }

  const selectedSaleProduct = products.find((row) => String(row.product_id) === String(selectedProduct));
  const cartTotal = cart.reduce((sum, row) => sum + row.quantity * row.selling_price, 0);
  const cartProfit = cart.reduce((sum, row) => sum + row.quantity * (row.selling_price - row.cost_price), 0);
  const cartQuantity = cart.reduce((sum, row) => sum + row.quantity, 0);

  const itemsBySale = useMemo(() => {
    return history.items.reduce((grouped, item) => {
      grouped[item.sales_id] = grouped[item.sales_id] || [];
      grouped[item.sales_id].push(item);
      return grouped;
    }, {});
  }, [history.items]);

  const filteredSales = useMemo(() => {
    const term = saleSearch.trim().toLowerCase();

    return history.sales.filter((sale) => {
      const saleItems = itemsBySale[sale.sales_id] || [];
      const matchesPayment = salePaymentFilter === 'all' || sale.payment_method === salePaymentFilter;
      const searchable = [
        sale.invoice_number,
        sale.cashier_name,
        sale.payment_method,
        ...saleItems.map((item) => item.product_name),
      ].join(' ').toLowerCase();

      return matchesPayment && (!term || searchable.includes(term));
    });
  }, [history.sales, itemsBySale, saleSearch, salePaymentFilter]);

  return (
    <section className="screen-grid">
      <div className="form-panel">
        <div className="panel-title">
          <h3>New sale</h3>
        </div>
        <form onSubmit={addToCart}>
          <div className="field">
            <label>Product</label>
            <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)} required>
              <option value="">Choose product</option>
              {products.filter((product) => Number(product.stock_quantity) > 0).map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.product_name} - {money(product.selling_price)} ({product.stock_quantity} left)
                </option>
              ))}
            </select>
          </div>
          {selectedSaleProduct ? (
            <div className="product-preview">
              <span>{selectedSaleProduct.product_name}</span>
              <strong>{money(selectedSaleProduct.selling_price)}</strong>
              <small>{selectedSaleProduct.stock_quantity} in stock, estimated profit {money(Number(selectedSaleProduct.selling_price) - Number(selectedSaleProduct.cost_price))} each</small>
            </div>
          ) : null}
          <div className="field">
            <label>Quantity sold</label>
            <div className="quantity-entry">
              <button className="qty-btn" type="button" onClick={() => setQuantity(Math.max(1, Number(quantity || 1) - 1))}>-</button>
              <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
              <button className="qty-btn" type="button" onClick={() => setQuantity(Number(quantity || 0) + 1)}>+</button>
            </div>
          </div>
          <button className="btn btn-soft" type="submit">Add to cart</button>
        </form>

        <div className="mt">
          <div className="panel-title">
            <h3>Cart</h3>
          </div>
          {cart.length === 0 ? <div className="empty-state">No items added yet. Choose a product above to build the sale.</div> : (
            <>
              <div className="cart-list">
                {cart.map((row) => (
                  <div className="cart-row" key={row.product_id}>
                    <div className="cart-item-main">
                      <strong>{row.product_name}</strong>
                      <small>{money(row.selling_price)} each, {row.stock_quantity} available</small>
                    </div>
                    <div className="qty-control">
                      <button type="button" onClick={() => adjustCartQuantity(row.product_id, -1)}>-</button>
                      <input type="number" min="1" max={row.stock_quantity} value={row.quantity} onChange={(event) => updateCartQuantity(row.product_id, event.target.value)} />
                      <button type="button" onClick={() => adjustCartQuantity(row.product_id, 1)}>+</button>
                    </div>
                    <div className="cart-line-total">
                      <span>Subtotal</span>
                      <strong>{money(row.quantity * row.selling_price)}</strong>
                    </div>
                    <button className="btn btn-danger btn-compact" type="button" onClick={() => removeFromCart(row.product_id)}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="field mt">
                <label>Payment method</label>
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="cart-total">
                <span>Total amount</span>
                <strong>{money(cartTotal)}</strong>
                <small>{cartQuantity} item(s), estimated profit: {money(cartProfit)}</small>
              </div>
              <div className="inline-actions cart-actions">
                <button className="btn btn-muted" type="button" onClick={() => setCart([])}>Clear cart</button>
                <button className="btn btn-primary" type="button" onClick={submitSale} disabled={savingSale}>{savingSale ? 'Saving sale...' : 'Confirm transaction'}</button>
              </div>
            </>
          )}
          {lastSale ? (
            <div className="receipt-card mt">
              <span>Last saved invoice</span>
              <strong>{lastSale.invoice_number}</strong>
              <small>Total {money(lastSale.total_amount)} with profit {money(lastSale.total_profit)}</small>
            </div>
          ) : null}
        </div>
      </div>

      <div className="table-panel">
        <div className="panel-title">
          <h3>Sales history</h3>
          <button className="btn btn-soft" onClick={load}>Refresh</button>
        </div>
        <div className="inline-actions filter-row">
          <div className="field">
            <label>Search sales</label>
            <input value={saleSearch} onChange={(event) => setSaleSearch(event.target.value)} placeholder="Invoice, cashier, or product" />
          </div>
          <div className="field">
            <label>Payment</label>
            <select value={salePaymentFilter} onChange={(event) => setSalePaymentFilter(event.target.value)}>
              <option value="all">All payments</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        {loading ? <div className="empty-state">Loading sales...</div> : filteredSales.length === 0 ? (
          <div className="empty-state">No sales match the current filter.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Profit</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.sales_id}>
                    <td>
                      <strong>{sale.invoice_number}</strong>
                      <br />
                      <small>{sale.cashier_name || 'User'}</small>
                    </td>
                    <td>
                      {(itemsBySale[sale.sales_id] || []).map((item) => (
                        <div key={item.sales_item_id}>
                          {item.product_name || 'Product'} x {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td><span className="badge">{sale.payment_method}</span></td>
                    <td>{money(sale.total_amount)}</td>
                    <td>{money(sale.total_profit)}</td>
                    <td>{shortDate(sale.sales_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Reports({ notify }) {
  const [start, setStart] = useState(monthStartISO());
  const [end, setEnd] = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchReport(rangeStart = start, rangeEnd = end) {
    setLoading(true);

    try {
      const query = new URLSearchParams({ start: rangeStart, end: rangeEnd }).toString();
      setData(await apiFetch(`api/reports.php?${query}`));
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function load(event) {
    if (event) event.preventDefault();
    fetchReport();
  }

  function applyQuickRange(range) {
    const nextEnd = todayISO();
    const nextStart = range === 'today'
      ? nextEnd
      : range === 'week'
        ? daysAgoISO(6)
        : monthStartISO();

    setStart(nextStart);
    setEnd(nextEnd);
    fetchReport(nextStart, nextEnd);
  }

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading || !data) return <div className="loading-screen"><div className="spinner" /></div>;

  const daily = data.daily || [];
  const topProducts = data.top_products || [];
  const paymentMethods = data.payment_methods || [];

  return (
    <>
      <section className="section-head">
        <div>
          <h2>Analyze performance</h2>
          <p>Filter a date range, compare sales and profit, review top products, and print reports for documentation.</p>
        </div>
        <form className="inline-actions report-controls" onSubmit={load}>
          <div className="date-shortcuts">
            <button className="btn btn-soft" type="button" onClick={() => applyQuickRange('today')}>Today</button>
            <button className="btn btn-soft" type="button" onClick={() => applyQuickRange('week')}>Last 7 days</button>
            <button className="btn btn-soft" type="button" onClick={() => applyQuickRange('month')}>This month</button>
          </div>
          <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
          <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
          <button className="btn btn-primary" type="submit">Apply filter</button>
          <button className="btn btn-muted" type="button" onClick={() => window.print()}>Print</button>
        </form>
      </section>

      <section className="stats-grid">
        <StatCard label="Filtered Sales" value={money(data.summary.total_sales)} />
        <StatCard label="Filtered Profit" value={money(data.summary.total_profit)} />
        <StatCard label="Transactions" value={data.summary.transaction_count} />
        <StatCard label="Inventory Value" value={money(data.summary.inventory_value)} />
        <StatCard label="Low Stock Items" value={data.low_stock.length} />
        <StatCard label="Date Range" value={`${data.start} to ${data.end}`} />
      </section>

      <section className="grid-2 mt">
        <PlotCard
          title="Sales vs profit"
          data={[
            {
              x: daily.map((row) => row.label),
              y: daily.map((row) => Number(row.sales)),
              type: 'bar',
              name: 'Sales',
              marker: { color: GREEN },
            },
            {
              x: daily.map((row) => row.label),
              y: daily.map((row) => Number(row.profit)),
              type: 'bar',
              name: 'Profit',
              marker: { color: GOLD },
            },
          ]}
          layout={{ barmode: 'group' }}
        />
        <PlotCard
          title="Payment methods"
          data={[
            {
              labels: paymentMethods.map((row) => row.label),
              values: paymentMethods.map((row) => Number(row.sales)),
              type: 'pie',
              hole: 0.45,
            },
          ]}
        />
      </section>

      <section className="grid-2 mt">
        <PlotCard
          title="Top products by quantity"
          data={[
            {
              x: topProducts.map((row) => row.quantity),
              y: topProducts.map((row) => row.label),
              type: 'bar',
              orientation: 'h',
              marker: { color: GREEN },
            },
          ]}
          layout={{ margin: { t: 24, r: 18, b: 45, l: 130 } }}
        />
        <section className="table-panel">
          <div className="panel-title">
            <h3>Filtered sales table</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Cashier</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Profit</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_sales.map((sale) => (
                  <tr key={sale.sales_id}>
                    <td>{sale.invoice_number}</td>
                    <td>{sale.cashier_name || 'User'}</td>
                    <td>{sale.payment_method}</td>
                    <td>{money(sale.total_amount)}</td>
                    <td>{money(sale.total_profit)}</td>
                    <td>{shortDate(sale.sales_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="table-panel mt">
        <div className="panel-title">
          <h3>Low-stock product report</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Low-stock level</th>
              </tr>
            </thead>
            <tbody>
              {data.low_stock.map((product) => (
                <tr key={product.product_name}>
                  <td>{product.product_name}</td>
                  <td>{product.category_name || 'Uncategorized'}</td>
                  <td><span className="badge warn">{product.stock_quantity}</span></td>
                  <td>{product.low_stock_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Users({ user, notify }) {
  if (user.role !== 'admin') return <AccessPanel />;

  const emptyUser = {
    user_id: '',
    full_name: '',
    username: '',
    password: '',
    role: 'staff',
    status: 'active',
  };

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('api/users.php');
      setUsers(data.users);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveUser(event) {
    event.preventDefault();
    const isEdit = Boolean(form.user_id);

    try {
      const data = await apiFetch('api/users.php', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      notify(data.message);
      setForm(emptyUser);
      load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function deactivateUser(row) {
    if (!window.confirm(`Deactivate ${row.full_name}?`)) return;

    try {
      const data = await apiFetch('api/users.php', {
        method: 'DELETE',
        body: JSON.stringify({ user_id: row.user_id }),
      });
      notify(data.message);
      load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  return (
    <section className="screen-grid">
      <form className="form-panel" onSubmit={saveUser}>
        <div className="panel-title">
          <h3>{form.user_id ? 'Edit account' : 'Add account'}</h3>
        </div>
        <div className="field">
          <label>Full name</label>
          <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
        </div>
        <div className="field">
          <label>Username</label>
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
        </div>
        <div className="field">
          <label>{form.user_id ? 'New password (optional)' : 'Password'}</label>
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!form.user_id} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="inline-actions">
          <button className="btn btn-primary" type="submit">{form.user_id ? 'Update account' : 'Add account'}</button>
          {form.user_id ? <button className="btn btn-muted" type="button" onClick={() => setForm(emptyUser)}>Cancel</button> : null}
        </div>
      </form>

      <section className="table-panel">
        <div className="panel-title">
          <h3>User records</h3>
          <button className="btn btn-soft" onClick={load}>Refresh</button>
        </div>
        {loading ? <div className="empty-state">Loading users...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.user_id}>
                    <td><strong>{row.full_name}</strong></td>
                    <td>{row.username}</td>
                    <td><span className="badge">{row.role}</span></td>
                    <td><span className={`badge ${row.status === 'active' ? 'good' : 'danger'}`}>{row.status}</span></td>
                    <td>{shortDate(row.created_at)}</td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-soft" onClick={() => setForm({ ...row, password: '' })}>Edit</button>
                        <button className="btn btn-danger" onClick={() => deactivateUser(row)}>Deactivate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
