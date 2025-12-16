import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const IPWhitelistManager = ({ userId, isAdmin }) => {
  const [ips, setIps] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin && userId) fetchIps();
  }, [userId, isAdmin]);

  const fetchIps = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.getUserIPs(userId);
      setIps(res);
    } catch (err) {
      setError('Failed to fetch IPs');
    }
    setLoading(false);
  };

  const addIp = async () => {
    if (!newIp) return;
    setLoading(true);
    setError('');
    try {
      await authAPI.addUserIP(userId, newIp);
      setNewIp('');
      fetchIps();
    } catch (err) {
      setError('Failed to add IP');
    }
    setLoading(false);
  };

  const removeIp = async (ip) => {
    setLoading(true);
    setError('');
    try {
      await authAPI.removeUserIP(userId, ip);
      fetchIps();
    } catch (err) {
      setError('Failed to remove IP');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-blue-500 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">IP Whitelist Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4">
        <input
          type="text"
          value={newIp}
          onChange={e => setNewIp(e.target.value)}
          placeholder="Add new IP (e.g. 1.2.3.4)"
          className="px-3 py-2 rounded border border-blue-400 mr-2"
        />
        <button onClick={addIp} className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </div>
      <ul className="space-y-2">
        {ips.map(ip => (
          <li key={ip.id} className="flex justify-between items-center bg-gray-800 px-3 py-2 rounded">
            <span className="text-white">{ip.ip_address}</span>
            <button onClick={() => removeIp(ip.ip_address)} className="text-red-400 hover:text-red-600">Remove</button>
          </li>
        ))}
      </ul>
      {loading && <div className="text-blue-400 mt-2">Loading...</div>}
    </div>
  );
};

export default IPWhitelistManager;
