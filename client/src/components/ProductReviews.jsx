import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  RateReview,
  FilterList
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ReviewSummary from './ReviewSummary';
import ReviewCard from './ReviewCard';
import WriteReviewDialog from './WriteReviewDialog';

const ProductReviews = ({ product }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  
  // Dialog states
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  
  // Check if user can write review
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [userReview, setUserReview] = useState(null);

  // Fetch reviews
  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/reviews/product/${product._id}`, {
        params: {
          page,
          limit: 10,
          sort: sortBy,
          rating: filterRating
        }
      });

      setReviews(response.data.data);
      setRatingStats(response.data.ratingStats);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      
      // Check if current user has reviewed this product
      if (user) {
        const existingReview = response.data.data.find(
          review => review.userId._id === user.id
        );
        setUserReview(existingReview);
        setCanWriteReview(!existingReview);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product?._id) {
      fetchReviews(1);
    }
  }, [product?._id, sortBy, filterRating]);

  // Handle write review
  const handleWriteReview = async (reviewData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/reviews', reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add new review to list
      setReviews(prev => [response.data.data, ...prev]);
      setCanWriteReview(false);
      setUserReview(response.data.data);
      
      // Refresh to get updated stats
      fetchReviews(currentPage);
    } catch (err) {
      throw err;
    }
  };

  // Handle edit review
  const handleEditReview = async (reviewData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/reviews/${editingReview._id}`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update review in list
      setReviews(prev => prev.map(review => 
        review._id === editingReview._id ? response.data.data : review
      ));
      setUserReview(response.data.data);
      setEditingReview(null);
      
      // Refresh to get updated stats
      fetchReviews(currentPage);
    } catch (err) {
      throw err;
    }
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove review from list
      setReviews(prev => prev.filter(review => review._id !== reviewId));
      setCanWriteReview(true);
      setUserReview(null);
      
      // Refresh to get updated stats
      fetchReviews(currentPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa đánh giá');
    }
  };

  // Handle vote review
  const handleVoteReview = async (reviewId, isHelpful) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/reviews/${reviewId}/vote`, 
        { isHelpful }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update review vote counts
      setReviews(prev => prev.map(review => 
        review._id === reviewId 
          ? { 
              ...review, 
              helpfulCount: response.data.helpfulCount,
              unhelpfulCount: response.data.unhelpfulCount,
              userVote: isHelpful
            }
          : review
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể vote đánh giá');
    }
  };

  // Handle shop reply
  const handleShopReply = async (reviewId, content) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/reviews/${reviewId}/reply`, 
        { content }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update review with reply
      setReviews(prev => prev.map(review => 
        review._id === reviewId 
          ? { ...review, shopReply: response.data.data }
          : review
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi phản hồi');
    }
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    fetchReviews(page);
  };

  const handleOpenEditDialog = (review) => {
    setEditingReview(review);
    setWriteReviewOpen(true);
  };

  return (
    <Box>
      {/* Review Summary */}
      <ReviewSummary 
        averageRating={ratingStats.averageRating || 0}
        totalReviews={ratingStats.totalReviews || 0}
        ratingDistribution={ratingStats.ratingDistribution || {}}
      />

      <Divider sx={{ my: 3 }} />

      {/* Reviews Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Đánh giá từ khách hàng ({ratingStats.totalReviews || 0})
        </Typography>

        {/* Write Review Button */}
        {user && canWriteReview && (
          <Button
            variant="contained"
            startIcon={<RateReview />}
            onClick={() => setWriteReviewOpen(true)}
          >
            Viết đánh giá
          </Button>
        )}
      </Box>

      {/* User's existing review */}
      {userReview && (
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" mb={1}>
            Đánh giá của bạn:
          </Typography>
          <ReviewCard
            review={userReview}
            currentUser={user}
            onEdit={handleOpenEditDialog}
            onDelete={handleDeleteReview}
            showShopReply={true}
          />
        </Box>
      )}

      {/* Filters & Sort */}
      <Stack direction="row" spacing={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sắp xếp</InputLabel>
          <Select
            value={sortBy}
            label="Sắp xếp"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="newest">Mới nhất</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="rating-high">Đánh giá cao</MenuItem>
            <MenuItem value="rating-low">Đánh giá thấp</MenuItem>
            <MenuItem value="helpful">Hữu ích nhất</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Lọc sao</InputLabel>
          <Select
            value={filterRating}
            label="Lọc sao"
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="5">5 sao</MenuItem>
            <MenuItem value="4">4 sao</MenuItem>
            <MenuItem value="3">3 sao</MenuItem>
            <MenuItem value="2">2 sao</MenuItem>
            <MenuItem value="1">1 sao</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Reviews List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Chưa có đánh giá nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hãy là người đầu tiên đánh giá sản phẩm này!
          </Typography>
        </Box>
      ) : (
        <>
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              currentUser={user}
              onVote={handleVoteReview}
              onReply={handleShopReply}
              onEdit={handleOpenEditDialog}
              onDelete={handleDeleteReview}
              showShopReply={true}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Write/Edit Review Dialog */}
      <WriteReviewDialog
        open={writeReviewOpen}
        onClose={() => {
          setWriteReviewOpen(false);
          setEditingReview(null);
        }}
        onSubmit={editingReview ? handleEditReview : handleWriteReview}
        product={product}
        existingReview={editingReview}
      />
    </Box>
  );
};

export default ProductReviews; 