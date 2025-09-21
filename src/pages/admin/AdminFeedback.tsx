import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Star, Clock, CheckCircle, AlertCircle, 
  Send, AlertTriangle, Edit2 
} from 'lucide-react';
import axios from 'axios';

const AdminFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: ''
  });
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [responseData, setResponseData] = useState({
    message: '',
    status: 'in-progress'
  });
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;
  const { id } = useParams();      
  const navigate = useNavigate();

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'delivery', label: 'Delivery Issues' },
    { value: 'food-quality', label: 'Food Quality' },
    { value: 'app-bug', label: 'App Bug' },
    { value: 'general', label: 'General Feedback' },
    { value: 'complaint', label: 'Complaint' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, [filters]);

  useEffect(() => {
    if (id) {
      fetchFeedbackDetails(id);
    } else {
      setSelectedFeedback(null);
      setIsEditingResponse(false);
    }
  }, [id]);

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params.append(key, value);
      });

      const response = await axios.get(
        `${API_URL}/feedback/admin?${params}`, // ✅ fixed
        { withCredentials: true }
      );
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      showMessage('Failed to fetch feedbacks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackDetails = async (feedbackId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/feedback/${feedbackId}`, // ✅ fixed
        { withCredentials: true }
      );
      setSelectedFeedback(response.data);

      if (response.data?.adminResponse) {
        setResponseData({
          message: response.data.adminResponse.message || '',
          status: response.data.status || 'in-progress'
        });
        setIsEditingResponse(false);
      } else {
        setResponseData({ message: '', status: 'in-progress' });
      }
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      showMessage('Failed to fetch feedback details', 'error');
      navigate('${API_URL}/admin/feedback');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;

    try {
      await axios.put(
        `${API_URL}/feedback/${selectedFeedback._id}/respond`, // ✅ fixed
        responseData,
        { withCredentials: true }
      );

      await fetchFeedbackDetails(selectedFeedback._id);
      await fetchFeedbacks();

      showMessage('Response saved successfully!', 'success');
      setIsEditingResponse(false);
    } catch (error) {
      console.error('Error responding to feedback:', error);
      showMessage('Failed to send response', 'error');
    }
  };

  const updateStatus = async (feedbackId: string, status: string, priority?: string) => {
    try {
      await axios.put(
        `${API_URL}/feedback/${feedbackId}/status`, // ✅ fixed
        { status, priority },
        { withCredentials: true }
      );

      await fetchFeedbacks();
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        await fetchFeedbackDetails(feedbackId);
      }

      showMessage('Feedback status updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showMessage('Failed to update feedback status', 'error');
    }
  };

  const closeModal = () => {
    setSelectedFeedback(null);
    setIsEditingResponse(false);
    setResponseData({ message: '', status: 'in-progress' });
    navigate('${API_URL}/admin/feedback');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-500" size={16} />;
      case 'in-progress': return <AlertCircle className="text-blue-500" size={16} />;
      case 'resolved': return <CheckCircle className="text-green-500" size={16} />;
      case 'closed': return <CheckCircle className="text-gray-500" size={16} />;
      default: return <Clock className="text-yellow-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle size={16} className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MessageSquare size={20} />
          <span>{feedbacks.length} total feedbacks</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', type: '', priority: '' })}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-16 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-500">No feedback matches your current filters.</p>
          </div>
        ) : (
          feedbacks.map((feedback: any) => (
            <div key={feedback._id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{feedback.subject}</h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feedback.status)}`}>
                      {getStatusIcon(feedback.status)}
                      <span className="ml-1 capitalize">{feedback.status.replace('-', ' ')}</span>
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(feedback.priority)}`}>
                      {feedback.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>By: {feedback.user?.name} ({feedback.user?.email})</span>
                    <span className="capitalize">{feedback.type.replace('-', ' ')}</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-gray-700 mb-4">{feedback.message}</p>

                  {feedback.restaurant && (
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Restaurant:</span> {feedback.restaurant.name}
                    </div>
                  )}

                  {feedback.adminResponse && (
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-blue-800">Admin Response</span>
                        <span className="text-xs text-blue-600">
                          {new Date(feedback.adminResponse.respondedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-blue-700">{feedback.adminResponse.message}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <select
                    value={feedback.status}
                    onChange={(e) => updateStatus(feedback._id, e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <select
                    value={feedback.priority}
                    onChange={(e) => updateStatus(feedback._id, feedback.status, e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>

                  <button
                    onClick={() => navigate(`${API_URL}/admin/feedback/${feedback._id}`)}
                    className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-md hover:bg-slate-200 transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Response / Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Feedback - {selectedFeedback.subject}
              </h3>
           
          {/* ✅ Status badge */}
          <span
            className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              selectedFeedback.status
            )}`}
          >
            {getStatusIcon(selectedFeedback.status)}
            <span className="ml-1 capitalize">
              {selectedFeedback.status.replace("-", " ")}
            </span>
          </span>

          {/* ✅ Priority badge */}
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
              selectedFeedback.priority
            )}`}
          >
            {selectedFeedback.priority.toUpperCase()}
          </span>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>From:</strong> {selectedFeedback.user?.name} ({selectedFeedback.user?.email})
              </p>
              <p className="text-sm text-gray-700">{selectedFeedback.message}</p>
            </div>

            {selectedFeedback.adminResponse && !isEditingResponse ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Admin Response</span>
                    <span className="text-xs text-blue-600">
                      {new Date(selectedFeedback.adminResponse.respondedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-blue-700">{selectedFeedback.adminResponse.message}</p>
                </div>

                <button
                  onClick={() => setIsEditingResponse(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 flex items-center space-x-2"
                >
                  <Edit2 size={16} />
                  <span>Edit Response</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleRespond} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response Message
                  </label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                    required
                    rows={4}
                    placeholder="Type your response here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Status
                  </label>
                  <select
                    value={responseData.status}
                    onChange={(e) => setResponseData({ ...responseData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-600 flex items-center space-x-2"
                  >
                    <Send size={16} />
                    <span>Save Response</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
