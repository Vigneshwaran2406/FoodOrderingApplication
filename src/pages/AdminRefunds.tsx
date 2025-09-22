import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AdminRefunds: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const res = await axios.get(`${API_URL}/payments/my/payments`, {
        withCredentials: true,
      });
      // 🔎 filter only requested refunds
      setRefunds(res.data.payments.filter((p: any) => p.refundStatus === "requested"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (txn: string) => {
    try {
      await axios.put(`${API_URL}/payments/${txn}/refund/approve`, {}, { withCredentials: true });
      toast.success("Refund approved!");
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (txn: string) => {
    try {
      await axios.put(`${API_URL}/payments/${txn}/refund/reject`, {}, { withCredentials: true });
      toast.success("Refund rejected!");
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Rejection failed");
    }
  };

  if (loading) return <p className="p-6">Loading refund requests...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Refund Requests</h1>

      {refunds.length === 0 ? (
        <p>No refund requests pending</p>
      ) : (
        <div className="space-y-4">
          {refunds.map((r) => (
            <div key={r._id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <p><strong>Transaction:</strong> {r.gatewayTransactionId}</p>
                <p><strong>Amount:</strong> ${r.amount}</p>
                <p><strong>User:</strong> {r.user?.fullName || "N/A"}</p>
              </div>
              <div className="space-x-2">
                <button onClick={() => handleApprove(r.gatewayTransactionId)} className="px-4 py-2 bg-green-600 text-white rounded">
                  Approve
                </button>
                <button onClick={() => handleReject(r.gatewayTransactionId)} className="px-4 py-2 bg-red-600 text-white rounded">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRefunds;
