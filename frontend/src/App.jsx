import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );
  const [view, setView] = useState('login'); // 'login' | 'signup' | dashboards
  const [loginRole, setLoginRole] = useState('normal'); // 'normal' | 'admin' | 'owner'
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') setView('admin-dashboard');
    else if (user?.role === 'owner') setView('owner-dashboard');
    else if (user?.role === 'normal') setView('user-dashboard');
  }, []);

  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.user.role === 'admin') setView('admin-dashboard');
    else if (data.user.role === 'owner') setView('owner-dashboard');
    else setView('user-dashboard');
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Store Rating Platform</h1>
        {user && (
          <div className="header-right">
            <span>
              {user.name} ({user.role})
            </span>
            <button onClick={() => setShowChangePassword(true)} className="btn-secondary">
              Change Password
            </button>
            <button onClick={logout}>Logout</button>
          </div>
        )}
      </header>

      {showChangePassword && (
        <ChangePasswordModal
          token={token}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {!user && (
        <div className="auth-toggle">
          <button
            className={view === 'login' ? 'active' : ''}
            onClick={() => setView('login')}
          >
            Login
          </button>
          <button
            className={view === 'signup' ? 'active' : ''}
            onClick={() => setView('signup')}
          >
            Sign Up
          </button>
        </div>
      )}

      <main>
        {!user && view === 'login' && (
          <LoginForm onSuccess={handleAuthSuccess} role={loginRole} onChangeRole={setLoginRole} />
        )}
        {!user && view === 'signup' && (
          <SignupForm onSuccess={handleAuthSuccess} />
        )}
        {user && view === 'admin-dashboard' && (
          <AdminDashboard token={token} />
        )}
        {user && view === 'user-dashboard' && (
          <UserDashboard token={token} />
        )}
        {user && view === 'owner-dashboard' && (
          <OwnerDashboard token={token} />
        )}
      </main>
    </div>
  );
}

function LoginForm({ onSuccess, role = 'normal', onChangeRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="role-toggle">
        <button
          type="button"
          className={role === 'normal' ? 'active' : ''}
          onClick={() => onChangeRole && onChangeRole('normal')}
        >
          User Login
        </button>
        <button
          type="button"
          className={role === 'admin' ? 'active' : ''}
          onClick={() => onChangeRole && onChangeRole('admin')}
        >
          Admin Login
        </button>
        <button
          type="button"
          className={role === 'owner' ? 'active' : ''}
          onClick={() => onChangeRole && onChangeRole('owner')}
        >
          Store Owner Login
        </button>
      </div>
      <h2>
        Login{' '}
        {role === 'admin'
          ? '(Admin)'
          : role === 'owner'
          ? '(Store Owner)'
          : '(User)'}
      </h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

function SignupForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (name.length < 20 || name.length > 60) {
      return 'Name must be between 20 and 60 characters.';
    }
    if (address.length > 400) {
      return 'Address must be at most 400 characters.';
    }
    if (!passwordRegex.test(password)) {
      return 'Password must be 8-16 chars, include an uppercase and a special character.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, address, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      // Auto-login after signup
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message || 'Auto login failed');
      onSuccess(loginData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Sign Up (Normal User)</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Address
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={400}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({ token }) {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [userFilters, setUserFilters] = useState({
    name: '',
    email: '',
    address: '',
    role: '',
  });
  const [storeFilters, setStoreFilters] = useState({
    name: '',
    email: '',
    address: '',
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    role: 'normal',
  });
  const [newStore, setNewStore] = useState({
    name: '',
    email: '',
    address: '',
    owner_id: '',
  });
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [error, setError] = useState('');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const loadSummary = async () => {
    const res = await fetch(`${API_BASE}/admin/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setSummary(data);
  };

  const loadUsers = async () => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(userFilters).filter(([_, v]) => v !== '')
      )
    );
    const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setUsers(data);
  };

  const loadStores = async () => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(storeFilters).filter(([_, v]) => v !== '')
      )
    );
    const res = await fetch(`${API_BASE}/admin/stores?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setStores(data);
  };

  const loadOwnerRequests = async () => {
    const res = await fetch(`${API_BASE}/admin/owner-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setOwnerRequests(data);
  };

  useEffect(() => {
    loadSummary();
    loadUsers();
    loadStores();
    loadOwnerRequests();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [userFilters]);

  useEffect(() => {
    loadStores();
  }, [storeFilters]);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    if (newUser.name.length < 20 || newUser.name.length > 60) {
      setError('User name must be between 20 and 60 characters.');
      return;
    }
    if (newUser.address.length > 400) {
      setError('User address max 400 characters.');
      return;
    }
    if (!passwordRegex.test(newUser.password)) {
      setError(
        'Password must be 8-16 chars, include an uppercase and a special character.'
      );
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');
      setNewUser({
        name: '',
        email: '',
        address: '',
        password: '',
        role: 'normal',
      });
      loadUsers();
      loadSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const createStore = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...newStore,
        owner_id: newStore.owner_id ? Number(newStore.owner_id) : null,
      };
      const res = await fetch(`${API_BASE}/admin/stores`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create store');
      setNewStore({
        name: '',
        email: '',
        address: '',
        owner_id: '',
      });
      loadStores();
      loadSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const approveOwnerRequest = async (requestId) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/owner-requests/${requestId}/approve`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve request');
      loadOwnerRequests();
      loadUsers();
      loadSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const rejectOwnerRequest = async (requestId, reason = '') => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/owner-requests/${requestId}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject request');
      loadOwnerRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      {summary && (
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Total Users</h3>
            <span>{summary.user_count}</span>
          </div>
          <div className="summary-card">
            <h3>Total Stores</h3>
            <span>{summary.store_count}</span>
          </div>
          <div className="summary-card">
            <h3>Total Ratings</h3>
            <span>{summary.rating_count}</span>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <section className="section">
        <h3>Create User</h3>
        <form className="form-inline" onSubmit={createUser}>
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) =>
              setNewUser((u) => ({ ...u, name: e.target.value }))
            }
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={newUser.email}
            onChange={(e) =>
              setNewUser((u) => ({ ...u, email: e.target.value }))
            }
            required
          />
          <input
            placeholder="Address"
            value={newUser.address}
            onChange={(e) =>
              setNewUser((u) => ({ ...u, address: e.target.value }))
            }
          />
          <input
            placeholder="Password"
            type="password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser((u) => ({ ...u, password: e.target.value }))
            }
            required
          />
          <select
            value={newUser.role}
            onChange={(e) =>
              setNewUser((u) => ({ ...u, role: e.target.value }))
            }
          >
            <option value="normal">Normal</option>
            <option value="owner">Store Owner</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Add User</button>
        </form>
      </section>

      <section className="section">
        <h3>Create Store</h3>
        <form className="form-inline" onSubmit={createStore}>
          <input
            placeholder="Name"
            value={newStore.name}
            onChange={(e) =>
              setNewStore((s) => ({ ...s, name: e.target.value }))
            }
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={newStore.email}
            onChange={(e) =>
              setNewStore((s) => ({ ...s, email: e.target.value }))
            }
          />
          <input
            placeholder="Address"
            value={newStore.address}
            onChange={(e) =>
              setNewStore((s) => ({ ...s, address: e.target.value }))
            }
          />
          <input
            placeholder="Owner User ID (optional)"
            value={newStore.owner_id}
            onChange={(e) =>
              setNewStore((s) => ({ ...s, owner_id: e.target.value }))
            }
          />
          <button type="submit">Add Store</button>
        </form>
      </section>

      <section className="section">
        <h3>Users</h3>
        <div className="filters">
          <input
            placeholder="Filter name"
            value={userFilters.name}
            onChange={(e) =>
              setUserFilters((f) => ({ ...f, name: e.target.value }))
            }
          />
          <input
            placeholder="Filter email"
            value={userFilters.email}
            onChange={(e) =>
              setUserFilters((f) => ({ ...f, email: e.target.value }))
            }
          />
          <input
            placeholder="Filter address"
            value={userFilters.address}
            onChange={(e) =>
              setUserFilters((f) => ({ ...f, address: e.target.value }))
            }
          />
          <select
            value={userFilters.role}
            onChange={(e) =>
              setUserFilters((f) => ({ ...f, role: e.target.value }))
            }
          >
            <option value="">All roles</option>
            <option value="normal">Normal</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Role</th>
              <th>Owner Rating</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.address}</td>
                <td>{u.role}</td>
                <td>{u.owner_rating ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h3>Stores</h3>
        <div className="filters">
          <input
            placeholder="Filter name"
            value={storeFilters.name}
            onChange={(e) =>
              setStoreFilters((f) => ({ ...f, name: e.target.value }))
            }
          />
          <input
            placeholder="Filter email"
            value={storeFilters.email}
            onChange={(e) =>
              setStoreFilters((f) => ({ ...f, email: e.target.value }))
            }
          />
          <input
            placeholder="Filter address"
            value={storeFilters.address}
            onChange={(e) =>
              setStoreFilters((f) => ({ ...f, address: e.target.value }))
            }
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Average Rating</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.address}</td>
                <td>{s.avg_rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h3>Owner Requests ({ownerRequests.length} Pending)</h3>
        {ownerRequests.length === 0 ? (
          <p className="no-data">No pending owner requests</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ownerRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.address}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => approveOwnerRequest(r.id)}
                      className="btn-approve"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectOwnerRequest(r.id)}
                      className="btn-reject"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function UserDashboard({ token }) {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [error, setError] = useState('');
  const [ownerRequestStatus, setOwnerRequestStatus] = useState(null);
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  const loadStores = async () => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      )
    );
    const res = await fetch(`${API_BASE}/stores?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setStores(data);
    }
  };

  const loadOwnerRequestStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/owner-request-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.request) {
        setOwnerRequestStatus(data.request);
      }
    } catch (err) {
      // Silent fail
    }
  };

  useEffect(() => {
    loadStores();
    loadOwnerRequestStatus();
  }, []);

  useEffect(() => {
    loadStores();
  }, [filters]);

  const submitRating = async (storeId, rating) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/stores/${storeId}/rating`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit rating');
      loadStores();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard">
      <h2>Stores</h2>
      
      <section className="owner-request-section">
        {ownerRequestStatus?.status === 'pending' && (
          <div className="info-box">
            <p>⏳ Your owner request is pending review by an administrator.</p>
          </div>
        )}
        {ownerRequestStatus?.status === 'approved' && (
          <div className="success-box">
            <p>✅ Your owner request has been approved! Please refresh to see your owner dashboard.</p>
          </div>
        )}
        {ownerRequestStatus?.status === 'rejected' && (
          <div className="error-box">
            <p>❌ Your owner request was rejected. Reason: {ownerRequestStatus.reason}</p>
          </div>
        )}
        {!ownerRequestStatus && (
          <button onClick={() => setShowOwnerModal(true)} className="btn-owner-request">
            Upgrade to Store Owner
          </button>
        )}
      </section>

      {showOwnerModal && (
        <OwnerRequestModal
          token={token}
          onClose={() => setShowOwnerModal(false)}
          onSuccess={() => {
            setShowOwnerModal(false);
            loadOwnerRequestStatus();
          }}
        />
      )}

      <div className="filters">
        <input
          placeholder="Search name"
          value={filters.name}
          onChange={(e) =>
            setFilters((f) => ({ ...f, name: e.target.value }))
          }
        />
        <input
          placeholder="Search address"
          value={filters.address}
          onChange={(e) =>
            setFilters((f) => ({ ...f, address: e.target.value }))
          }
        />
      </div>
      {error && <div className="error">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>Store Name</th>
            <th>Address</th>
            <th>Overall Rating</th>
            <th>Your Rating</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.address}</td>
              <td>{s.avg_rating}</td>
              <td>{s.user_rating ?? '-'}</td>
              <td>
                <select
                  value={s.user_rating ?? ''}
                  onChange={(e) =>
                    submitRating(s.id, Number(e.target.value))
                  }
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OwnerDashboard({ token }) {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [raters, setRaters] = useState([]);

  const loadSummary = async () => {
    const res = await fetch(`${API_BASE}/owner/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setStores(data);
  };

  const loadRaters = async (storeId) => {
    const res = await fetch(`${API_BASE}/owner/store-raters/${storeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setRaters(data);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadRaters(selectedStoreId);
    } else {
      setRaters([]);
    }
  }, [selectedStoreId]);

  return (
    <div className="dashboard">
      <h2>Store Owner Dashboard</h2>
      <section className="section">
        <h3>Your Stores</h3>
        <table>
          <thead>
            <tr>
              <th>Store</th>
              <th>Average Rating</th>
              <th>Total Ratings</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr
                key={s.id}
                className={
                  String(s.id) === String(selectedStoreId) ? 'selected-row' : ''
                }
                onClick={() => setSelectedStoreId(s.id)}
              >
                <td>{s.name}</td>
                <td>{s.avg_rating}</td>
                <td>{s.rating_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedStoreId && (
        <section className="section">
          <h3>Ratings for Store ID {selectedStoreId}</h3>
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Rating</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {raters.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.address}</td>
                  <td>{r.rating}</td>
                  <td>{new Date(r.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function ChangePasswordModal({ token, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setError('Password must be 8-16 chars, include an uppercase and a special character.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      setSuccess('Password changed successfully!');
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Current Password
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <div className="form-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OwnerRequestModal({ token, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/request-owner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit request');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Become a Store Owner</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>Request to upgrade your account to a Store Owner?</p>
          <p>Your request will be reviewed by an administrator.</p>
          {error && <div className="error">{error}</div>}
          <div className="form-buttons">
            <button onClick={handleRequest} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
