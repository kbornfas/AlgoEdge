import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-gray-900 rounded-xl p-6 border border-blue-500">
          <h2 className="text-xl font-semibold mb-4">Approve Transactions</h2>
          {/* TODO: List and approve/reject transactions */}
          <div className="text-gray-400">Transaction approval UI coming soon...</div>
        </section>
        <section className="bg-gray-900 rounded-xl p-6 border border-green-500">
          <h2 className="text-xl font-semibold mb-4">Supervise Users</h2>
          {/* TODO: List users, view details, block/unblock */}
          <div className="text-gray-400">User supervision UI coming soon...</div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
