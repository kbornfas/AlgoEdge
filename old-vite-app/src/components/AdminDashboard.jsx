
import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
};

const AdminDashboard = () => {
  const [trades, setTrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Fetch all pending trades (status = 'pending')
  const fetchTrades = async () => {
    setLoadingTrades(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_URL}/api/trades/admin/all?status=pending`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch trades');
      setTrades(data.trades || []);
    } catch (e) {
      setError(e.message);
    }
    setLoadingTrades(false);
  };

  // Fetch all users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_URL}/api/users/admin/all`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchTrades();
    fetchUsers();
  }, []);

  // Approve or reject a transaction
  const handleApprove = async (tradeId, approve) => {
    setActionMsg('');
    try {
      const res = await fetchWithAuth(`${API_URL}/api/trades/admin/${tradeId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ approve }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update transaction');
      setActionMsg(`Transaction ${approve ? 'approved' : 'rejected'}!`);
      fetchTrades();
    } catch (e) {
      setActionMsg(e.message);
    }
  };

  // Block or unblock a user
  const handleBlock = async (userId, block) => {
    setActionMsg('');
    try {
      const res = await fetchWithAuth(`${API_URL}/api/users/admin/${userId}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ block }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      setActionMsg(`User ${block ? 'blocked' : 'unblocked'}!`);
      fetchUsers();
    } catch (e) {
      setActionMsg(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {actionMsg && <div className="text-green-400 mb-4">{actionMsg}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-gray-900 rounded-xl p-6 border border-blue-500">
          <h2 className="text-xl font-semibold mb-4">Approve Transactions</h2>
          {loadingTrades ? (
            <div>Loading transactions...</div>
          ) : trades.length === 0 ? (
            <div className="text-gray-400">No pending transactions.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-blue-300">
                  <th className="p-2">ID</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Pair</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Volume</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-b border-blue-800">
                    <td className="p-2">{t.id}</td>
                    <td className="p-2">{t.username}</td>
                    <td className="p-2">{t.pair}</td>
                    <td className="p-2">{t.type}</td>
                    <td className="p-2">{t.volume}</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => handleApprove(t.id, true)} className="bg-green-600 px-2 py-1 rounded hover:bg-green-700">Approve</button>
                      <button onClick={() => handleApprove(t.id, false)} className="bg-red-600 px-2 py-1 rounded hover:bg-red-700">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="bg-gray-900 rounded-xl p-6 border border-green-500">
          <h2 className="text-xl font-semibold mb-4">Supervise Users</h2>
          {loadingUsers ? (
            <div>Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-400">No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-green-300">
                  <th className="p-2">ID</th>
                  <th className="p-2">Username</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Blocked</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-green-800">
                    <td className="p-2">{u.id}</td>
                    <td className="p-2">{u.username}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.is_blocked ? 'Yes' : 'No'}</td>
                    <td className="p-2 flex gap-2">
                      {u.is_blocked ? (
                        <button onClick={() => handleBlock(u.id, false)} className="bg-yellow-600 px-2 py-1 rounded hover:bg-yellow-700">Unblock</button>
                      ) : (
                        <button onClick={() => handleBlock(u.id, true)} className="bg-red-600 px-2 py-1 rounded hover:bg-red-700">Block</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
