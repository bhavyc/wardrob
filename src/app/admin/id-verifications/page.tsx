'use client';
import { useState, useEffect } from 'react';

export default function AdminIDVerificationsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchVerifications = async () => {
    try {
      const res = await fetch('/api/admin/id-verifications?status=PENDING');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectReason.trim()) return;

    setProcessing(userId);
    try {
      const res = await fetch('/api/admin/id-verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, reason: rejectReason })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
        setRejectingId(null);
        setRejectReason('');
      } else {
        alert(data.error || 'Failed to process request');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Pending Renter ID Verifications</h1>
      {loading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg border border-gray-100">No pending verifications.</p>
      ) : (
        <div className="grid gap-6">
          {users.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-2">ID Photo</p>
                <img src={u.idPhotoUrl} alt="ID Document" className="w-full h-auto rounded-lg border border-gray-200" />
              </div>
              <div className="md:w-2/3 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{u.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{u.email}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">ID Type</p>
                      <p className="font-medium text-gray-900">{u.idType}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">ID Number</p>
                      <p className="font-medium text-gray-900 font-mono tracking-wider">{u.idNumber}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {rejectingId === u.id ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..." 
                        className="flex-1 border p-2 rounded-lg"
                      />
                      <button 
                        onClick={() => handleAction(u.id, 'REJECT')}
                        disabled={processing === u.id || !rejectReason.trim()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                      <button 
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleAction(u.id, 'APPROVE')}
                        disabled={processing === u.id}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                      >
                        {processing === u.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button 
                        onClick={() => setRejectingId(u.id)}
                        disabled={processing === u.id}
                        className="bg-red-50 text-red-600 px-6 py-2 rounded-lg hover:bg-red-100 disabled:opacity-50 font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
