/*import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    rating: 5,
    restaurant: '',
    order: ''
  });

  const feedbackTypes = [
    { value: 'delivery', label: 'Delivery Issues' },
    { value: 'food-quality', label: 'Food Quality' },
    { value: 'app-bug', label: 'App Bug' },
    { value: 'general', label: 'General Feedback' },
    { value: 'complaint', label: 'Complaint' }
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/feedback/my-feedback');
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/feedback', formData);
      setShowForm(false);
      setFormData({
        type: 'general',
        subject: '',
        message: '',
        rating: 5,
        restaurant: '',
        order: ''
      });
      fetchFeedbacks();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback & Support</h1>
          <p className="text-gray-600 mt-2">Share your experience or report issues</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
        >
          <MessageSquare size={20} />
          <span>New Feedback</span>
        </button>
      </div>

      {/* Feedback Form Modal * /}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Submit Feedback</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {feedbackTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of your feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Please provide detailed feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-600 flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Submit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback List * /}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback submitted yet</h3>
            <p className="text-gray-500 mb-6">Share your experience to help us improve our service</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Submit Your First Feedback
            </button>
          </div>
        ) : (
          feedbacks.map((feedback: any) => (
            <div key={feedback._id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{feedback.subject}</h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feedback.status)}`}>
                      {getStatusIcon(feedback.status)}
                      <span className="ml-1 capitalize">{feedback.status.replace('-', ' ')}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                </div>
              </div>

              <p className="text-gray-700 mb-4">{feedback.message}</p>

              {feedback.restaurant && (
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Restaurant:</span> {feedback.restaurant.name}
                </div>
              )}

              {feedback.adminResponse && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
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
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;

import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    rating: 5,
    restaurant: '',
    order: ''
  });

  const feedbackTypes = [
    { value: 'delivery', label: 'Delivery Issues' },
    { value: 'food-quality', label: 'Food Quality' },
    { value: 'app-bug', label: 'App Bug' },
    { value: 'general', label: 'General Feedback' },
    { value: 'complaint', label: 'Complaint' }
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/feedback/my-feedback');
      console.log('Feedbacks fetched:', response.data);
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      alert('Failed to fetch feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting feedback:', formData);
      const response = await axios.post('http://localhost:5000/api/feedback', formData);
      console.log('Feedback submitted:', response.data);
      setShowForm(false);
      setFormData({
        type: 'general',
        subject: '',
        message: '',
        rating: 5,
        restaurant: '',
        order: ''
      });
      fetchFeedbacks();
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback & Support</h1>
          <p className="text-gray-600 mt-2">Share your experience or report issues</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
        >
          <MessageSquare size={20} />
          <span>New Feedback</span>
        </button>
      </div>

      {/* Feedback Form Modal * /}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Submit Feedback</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {feedbackTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of your feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Please provide detailed feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-600 flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Submit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback List * /}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback submitted yet</h3>
            <p className="text-gray-500 mb-6">Share your experience to help us improve our service</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Submit Your First Feedback
            </button>
          </div>
        ) : (
          feedbacks.map((feedback: any) => (
            <div key={feedback._id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{feedback.subject}</h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feedback.status)}`}>
                      {getStatusIcon(feedback.status)}
                      <span className="ml-1 capitalize">{feedback.status.replace('-', ' ')}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                </div>
              </div>

              <p className="text-gray-700 mb-4">{feedback.message}</p>

              {feedback.restaurant && (
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Restaurant:</span> {feedback.restaurant.name}
                </div>
              )}

              {feedback.adminResponse && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
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
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;*/

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from 'react-toastify';

const FeedbackPage: React.FC = () => {
  const { token } = useAuth();

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: "general",
    subject: "",
    message: "",
    rating: 5,
    restaurant: "",
    order: "",
    priority: "medium",
  });
  const [submitting, setSubmitting] = useState(false);

  const feedbackTypes = [
    { value: "delivery", label: "Delivery Issues" },
    { value: "food-quality", label: "Food Quality" },
    { value: "app-bug", label: "App Bug" },
    { value: "general", label: "General Feedback" },
    { value: "complaint", label: "Complaint" },
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/feedback/my-feedback",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFeedbacks(response.data);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Error fetching feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/feedback", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShowForm(false);
      setFormData({
        type: "general",
        subject: "",
        message: "",
        rating: 5,
        restaurant: "",
        order: "",
        priority: "medium",
      });
      fetchFeedbacks();
      toast.success("Feedback Submitted Successfully!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit Feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="text-yellow-500" size={16} />;
      case "in-progress":
        return <AlertCircle className="text-blue-500" size={16} />;
      case "resolved":
        return <CheckCircle className="text-green-500" size={16} />;
      case "closed":
        return <CheckCircle className="text-gray-500" size={16} />;
      default:
        return <Clock className="text-yellow-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Feedback & Support
          </h1>
          <p className="text-gray-600 mt-2">
            Share your experience or report issues
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
        >
          <MessageSquare size={20} />
          <span>New Feedback</span>
        </button>
      </div>

      {/* Feedback Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Submit Feedback
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {feedbackTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating !== 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of your feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Please provide detailed feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-orange-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-600 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send size={16} />
                  <span>{submitting ? "Submitting..." : "Submit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"
              >
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-16 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <MessageSquare
              size={64}
              className="mx-auto text-gray-400 mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No feedback submitted yet
            </h3>
            <p className="text-gray-500 mb-6">
              Share your experience to help us improve our service
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Submit Your First Feedback
            </button>
          </div>
        ) : (
          feedbacks.map((feedback: any) => (
            <div
              key={feedback._id}
              className="bg-white p-6 rounded-lg shadow-sm border"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {feedback.subject}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        feedback.status
                      )}`}
                    >
                      {getStatusIcon(feedback.status)}
                      <span className="ml-1 capitalize">
                        {feedback.status.replace("-", " ")}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="capitalize">
                      {feedback.type.replace("-", " ")}
                    </span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < feedback.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                    <span>
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{feedback.message}</p>

              {feedback.restaurant && (
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Restaurant:</span>{" "}
                  {feedback.restaurant.name}
                </div>
              )}

              {feedback.adminResponse && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-blue-800">
                      Admin Response
                    </span>
                    <span className="text-xs text-blue-600">
                      {new Date(
                        feedback.adminResponse.respondedAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-blue-700">
                    {feedback.adminResponse.message}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;


