import React, { useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UserList from './UserList';
import UserFormDialog from './UserFormDialog';
import api from '../../../services/api';

const AdminUserManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for add, user object for edit
  // eslint-disable-next-line no-unused-vars
  const [allUsers, setAllUsers] = useState([]); // Potentially store all users here if needed for other features
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger UserList refresh
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenFormDialog = (user = null) => {
    setEditingUser(user); // If user is null, it's for adding a new user
    setIsFormOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormOpen(false);
    setEditingUser(null); // Clear editing user on close
  };

  const handleUsersFetched = useCallback((fetchedUsers) => {
    setAllUsers(fetchedUsers);
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      let response;
      if (editingUser && editingUser._id) {
        // Edit mode: password should only be sent if changed
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password; // Don't send empty password field
        }
        response = await api.put(`/users/${editingUser._id}`, payload);
      } else {
        // Add mode
        response = await api.post('/users', formData);
      }

      if (response.data && response.data.success) {
        setSnackbar({ 
          open: true, 
          message: editingUser ? 'Cập nhật user thành công!' : 'Thêm user mới thành công!', 
          severity: 'success' 
        });
        setRefreshKey(prevKey => prevKey + 1); // Trigger list refresh
        handleCloseFormDialog();
      } else {
        throw new Error(response.data.message || 'Thao tác thất bại');
      }
    } catch (err) {
      console.error("Error submitting user form:", err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.', 
        severity: 'error' 
      });
      // Keep dialog open if error for user to correct
    }
  };
  
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom component="div" sx={{ mb: 0 }}>
          Quản lý Người dùng
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenFormDialog()} // Open dialog for new user
        >
          Thêm User mới
        </Button>
      </Box>
      
      <UserList 
        onEditUser={handleOpenFormDialog} 
        onUsersFetched={handleUsersFetched} 
        refreshCounter={refreshKey} 
      />

      {isFormOpen && (
        <UserFormDialog
          open={isFormOpen}
          onClose={handleCloseFormDialog}
          onSubmit={handleFormSubmit}
          initialData={editingUser}
        />
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminUserManagement; 