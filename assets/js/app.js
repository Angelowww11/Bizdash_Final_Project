
;(function(){
	'use strict';

	const stage = window.BD_STAGE || 1;
	const root = document.getElementById('app');
	let user = null;

	// --- Utilities ---
	const money = (n) => 'PHP ' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const esc = (v) => String(v == null ? '' : v).replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

	const set = (html) => { root.innerHTML = html; };

	const msg = (t, kind) => t ? '<div class="' + (kind || 'note') + '">' + esc(t) + '</div>' : '';

	async function api(url, opt) {
		opt = opt || {};
		opt.credentials = 'same-origin';
		opt.headers = Object.assign({ 'Content-Type': 'application/json' }, opt.headers || {});
		if (opt.body && typeof opt.body !== 'string') opt.body = JSON.stringify(opt.body);
		const r = await fetch(url, opt);
		const d = await r.json().catch(() => ({}));
		if (!r.ok || d.ok === false) throw new Error(d.message || 'Request failed');
		return d;
	}

	const rows = (list, cols) =>
		'<div class="table"><table><thead><tr>' + cols.map((c) => '<th>' + esc(c[0]) + '</th>').join('') + '</tr></thead><tbody>' +
		list.map((row) => '<tr>' + cols.map((c) => '<td>' + esc(c[1](row)) + '</td>').join('') + '</tr>').join('') +
		'</tbody></table></div>';

	// --- Views / UI ---
	function rough() {
		set(
			'<main class="center"><section class="card rough">' +
			'<p class="note">Progress ' + stage + '</p>' +
			'<h1>BizDash rough draft</h1>' +
			'<p class="muted">This early snapshot is intentionally unfinished so the project growth is easier to study.</p>' +
			'<div class="grid three">' +
				'<div class="card kpi"><span>Sales today</span><strong>PHP 0.00</strong></div>' +
				'<div class="card kpi"><span>Products</span><strong>' + (stage > 1 ? 'planned' : '0') + '</strong></div>' +
				'<div class="card kpi"><span>Next task</span><strong>' + (stage > 1 ? 'PHP login' : 'database') + '</strong></div>' +
			'</div>' +
			'<h3>Study focus</h3><ul>' +
				'<li>index.php serves the page.</li>' +
				'<li>assets/js/app.js controls the rough interface.</li>' +
				'<li>' + (stage > 1 ? 'database/bizdash.sql introduces the first tables.' : 'There is no database yet.') + '</li>' +
			'</ul></section></main>'
		);
	}

	function login() {
		set(
			'<main class="center"><form id="login" class="card rough">' +
			'<p class="note">Progress ' + stage + '</p>' +
			'<h1>BizDash login</h1>' +
			'<p class="muted">Use admin/admin123 or staff/staff123 after importing this stage database.</p>' +
			'<div id="m"></div>' +
			'<label>Username<input name="username" value="admin"></label>' +
			'<label>Password<input name="password" type="password" value="admin123"></label>' +
			'<button class="btn">Log in</button>' +
			'</form></main>'
		);

		document.getElementById('login').onsubmit = async function (e) {
			e.preventDefault();
			try {
				const data = await api('api/auth.php', { method: 'POST', body: { username: e.target.username.value, password: e.target.password.value } });
				user = data.user;
				shell();
			} catch (err) {
				document.getElementById('m').innerHTML = msg(err.message, 'err');
			}
		};
	}

	function shell(view) {
		const items = [];
		if (stage < 4) items.push(['home', 'Home']);
		if (stage >= 4) items.push(['dashboard', 'Dashboard']);
		if (stage >= 5) items.push(['products', 'Products']);
		if (stage >= 6) items.push(['inventory', 'Inventory']);
		if (stage >= 7) items.push(['sales', 'Sales']);
		if (stage >= 8) items.push(['reports', 'Reports']);
		if (stage >= 9 && user && user.role === 'admin') items.push(['users', 'Users']);

		view = view || (items[0] && items[0][0]);

		set(
			'<div class="shell"><aside class="side"><h1>BizDash</h1><p>Progress ' + stage + '</p><nav class="nav">' +
			items.map((i) => '<button data-view="' + i[0] + '">' + i[1] + '</button>').join('') +
			'</nav><div class="user"><strong>' + esc(user && user.full_name) + '</strong><br>' + esc(user && user.role) + '<br><br><button id="logout" class="btn light">Log out</button></div></aside><main id="main" class="main"></main></div>'
		);

		document.querySelectorAll('[data-view]').forEach((b) => { b.onclick = function () { render(b.dataset.view); }; });

		document.getElementById('logout').onclick = async function () {
			await api('api/auth.php', { method: 'DELETE' });
			user = null;
			login();
		};

		render(view);
	}

	function active(view) {
		document.querySelectorAll('[data-view]').forEach((b) => { b.classList.toggle('active', b.dataset.view === view); });
	}

	// --- Render dispatcher ---
	async function render(view) {
		active(view);
		const main = document.getElementById('main');
		main.innerHTML = '<div class="note">Loading...</div>';
		try {
			if (view === 'home') return main.innerHTML = '<section class="card"><h2>Login works</h2><p class="muted">The next progress adds the dashboard API.</p></section>';
			if (view === 'dashboard') return dashboard(main);
			if (view === 'products') return products(main);
			if (view === 'inventory') return inventory(main);
			if (view === 'sales') return sales(main);
			if (view === 'reports') return reports(main);
			if (view === 'users') return users(main);
		} catch (err) {
			main.innerHTML = msg(err.message, 'err');
		}
	}

	// --- Pages ---
	async function dashboard(main) {
		const d = await api('api/dashboard.php');
		main.innerHTML =
			'<h2>Dashboard</h2>' +
			'<div class="grid three">' +
				'<div class="card kpi"><span>Total sales</span><strong>' + money(d.summary.total_sales) + '</strong></div>' +
				'<div class="card kpi"><span>Profit</span><strong>' + money(d.summary.total_profit) + '</strong></div>' +
				'<div class="card kpi"><span>Low stock</span><strong>' + d.summary.low_stock_count + '</strong></div>' +
			'</div>' +
			'<section class="card"><h3>Recent sales</h3>' + rows(d.recent_sales || [], [['Invoice', (x) => x.invoice_number], ['Cashier', (x) => x.cashier_name], ['Total', (x) => money(x.total_amount)]]) + '</section>';
	}

	async function products(main) {
		const d = await api('api/products.php?status=all');
		main.innerHTML =
			'<section class="grid two"><form id="productForm" class="card"><h2>Products</h2><div id="m"></div>' +
			'<label>Name<input name="product_name"></label>' +
			'<label>Category<select name="category_id"><option value="">None</option>' + d.categories.map((c) => '<option value="' + c.category_id + '">' + esc(c.category_name) + '</option>').join('') + '</select></label>' +
			'<label>Cost<input name="cost_price" type="number" step=".01"></label>' +
			'<label>Price<input name="selling_price" type="number" step=".01"></label>' +
			'<label>Stock<input name="stock_quantity" type="number"></label>' +
			'<label>Low stock<input name="low_stock_level" type="number" value="10"></label>' +
			'<button class="btn">Add product</button></form>' +
			'<section class="card"><h3>Product list</h3>' + rows(d.products, [['Name', (x) => x.product_name], ['Category', (x) => x.category_name || 'None'], ['Price', (x) => money(x.selling_price)], ['Stock', (x) => x.stock_quantity], ['Status', (x) => x.status]]) + '</section></section>';

		document.getElementById('productForm').onsubmit = async function (e) {
			e.preventDefault();
			const f = e.target;
			try {
				await api('api/products.php', { method: 'POST', body: { product_name: f.product_name.value, category_id: f.category_id.value, cost_price: f.cost_price.value, selling_price: f.selling_price.value, stock_quantity: f.stock_quantity.value, low_stock_level: f.low_stock_level.value } });
				render('products');
			} catch (err) {
				document.getElementById('m').innerHTML = msg(err.message, 'err');
			}
		};
	}

	async function inventory(main) {
		const d = await api('api/inventory.php');
		main.innerHTML =
			'<section class="grid two"><form id="stockForm" class="card"><h2>Stock in</h2><div id="m"></div>' +
			'<label>Product<select name="product_id">' + d.products.map((p) => '<option value="' + p.product_id + '">' + esc(p.product_name) + ' (' + p.stock_quantity + ')</option>').join('') + '</select></label>' +
			'<label>Qty<input name="quantity_added" type="number" value="1"></label>' +
			'<label>Cost<input name="cost_price" type="number" step=".01" value="0"></label>' +
			'<label>Supplier<input name="supplier_name"></label>' +
			'<button class="btn">Add stock</button></form>' +
			'<section class="card"><h3>Inventory logs</h3>' + rows(d.logs || [], [['Date', (x) => x.date_updated], ['Product', (x) => x.product_name], ['Action', (x) => x.action_type], ['Change', (x) => x.quantity_changed]]) + '</section></section>';

		document.getElementById('stockForm').onsubmit = async function (e) {
			e.preventDefault();
			const f = e.target;
			try {
				await api('api/inventory.php', { method: 'POST', body: { product_id: f.product_id.value, quantity_added: f.quantity_added.value, cost_price: f.cost_price.value, supplier_name: f.supplier_name.value } });
				render('inventory');
			} catch (err) {
				document.getElementById('m').innerHTML = msg(err.message, 'err');
			}
		};
	}

	async function sales(main) {
		const p = await api('api/products.php');
		const s = await api('api/sales.php');
		main.innerHTML =
			'<section class="grid two"><form id="saleForm" class="card"><h2>New sale</h2><p class="muted">This progress uses a simple one-item checkout before the final cart is polished.</p><div id="m"></div>' +
			'<label>Product<select name="product_id">' + p.products.map((x) => '<option value="' + x.product_id + '">' + esc(x.product_name) + ' - ' + money(x.selling_price) + ' (' + x.stock_quantity + ')</option>').join('') + '</select></label>' +
			'<label>Quantity<input name="quantity" type="number" value="1"></label>' +
			'<label>Payment<select name="payment_method"><option value="cash">Cash</option><option value="gcash">GCash</option><option value="card">Card</option><option value="other">Other</option></select></label>' +
			'<button class="btn">Save sale</button></form>' +
			'<section class="card"><h3>Sales history</h3>' + rows(s.sales || [], [['Invoice', (x) => x.invoice_number], ['Cashier', (x) => x.cashier_name], ['Total', (x) => money(x.total_amount)], ['Date', (x) => x.sales_date]]) + '</section></section>';

		document.getElementById('saleForm').onsubmit = async function (e) {
			e.preventDefault();
			const f = e.target;
			try {
				await api('api/sales.php', { method: 'POST', body: { payment_method: f.payment_method.value, items: [{ product_id: f.product_id.value, quantity: f.quantity.value }] } });
				render('sales');
			} catch (err) {
				document.getElementById('m').innerHTML = msg(err.message, 'err');
			}
		};
	}

	async function reports(main) {
		const start = new Date();
		start.setDate(1);
		const sDate = start.toISOString().slice(0, 10);
		const eDate = new Date().toISOString().slice(0, 10);

		main.innerHTML =
			'<section class="card"><h2>Reports</h2><div id="m"></div><form id="reportForm"><label>Start<input name="start" type="date" value="' + sDate + '"></label><label>End<input name="end" type="date" value="' + eDate + '"></label><button class="btn">Refresh</button></form></section><div id="reportOut"></div>';

		async function load() {
			const f = document.getElementById('reportForm');
			const d = await api('api/reports.php?start=' + encodeURIComponent(f.start.value) + '&end=' + encodeURIComponent(f.end.value));
			document.getElementById('reportOut').innerHTML =
				'<div class="grid three">' +
					'<div class="card kpi"><span>Sales</span><strong>' + money(d.summary.total_sales) + '</strong></div>' +
					'<div class="card kpi"><span>Profit</span><strong>' + money(d.summary.total_profit) + '</strong></div>' +
					'<div class="card kpi"><span>Transactions</span><strong>' + d.summary.transaction_count + '</strong></div>' +
				'</div>' +
				'<section class="card"><h3>Top products</h3>' + rows(d.top_products || [], [['Product', (x) => x.label], ['Qty', (x) => x.quantity], ['Sales', (x) => money(x.sales)]]) + '</section>';
		}

		document.getElementById('reportForm').onsubmit = function (e) { e.preventDefault(); load().catch((err) => { document.getElementById('m').innerHTML = msg(err.message, 'err'); }); };
		await load();
	}

	async function users(main) {
		const d = await api('api/users.php');
		main.innerHTML =
			'<section class="grid two"><form id="userForm" class="card"><h2>Users</h2><div id="m"></div>' +
			'<label>Name<input name="full_name"></label>' +
			'<label>Username<input name="username"></label>' +
			'<label>Password<input name="password" type="password"></label>' +
			'<label>Role<select name="role"><option value="staff">Staff</option><option value="admin">Admin</option></select></label>' +
			'<button class="btn">Add user</button></form>' +
			'<section class="card"><h3>Accounts</h3>' + rows(d.users || [], [['Name', (x) => x.full_name], ['Username', (x) => x.username], ['Role', (x) => x.role], ['Status', (x) => x.status]]) + '</section></section>';

		document.getElementById('userForm').onsubmit = async function (e) {
			e.preventDefault();
			const f = e.target;
			try {
				await api('api/users.php', { method: 'POST', body: { full_name: f.full_name.value, username: f.username.value, password: f.password.value, role: f.role.value, status: 'active' } });
				render('users');
			} catch (err) {
				document.getElementById('m').innerHTML = msg(err.message, 'err');
			}
		};
	}

	// --- Startup ---
	async function start() {
		if (stage < 3) return rough();
		try {
			const data = await api('api/auth.php');
			if (data.authenticated) { user = data.user; shell(); } else { login(); }
		} catch (err) {
			set('<main class="center"><section class="card rough">' + msg(err.message, 'err') + '<p class="muted">Import this progress database first, then refresh.</p></section></main>');
		}
	}

	// expose for debugging if needed
	window.BizDash = window.BizDash || {};
	window.BizDash.start = start;

	// auto-start
	start();

})();
