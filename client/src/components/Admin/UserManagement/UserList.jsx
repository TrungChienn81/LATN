import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../../services/api'; // API service
import ConfirmationDialog from './ConfirmationDialog'; // Import ConfirmationDialog
// import { useAuth } from '../../../contexts/AuthContext'; // Không cần trực tiếp ở đây vì api service đã có token

const UserList = ({ onEditUser, onUsersFetched, refreshCounter }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        // API service (axios instance) đã được cấu hình với interceptor để gửi token
        const response = await api.get('/users'); 
        if (response.data && response.data.success) {
          const fetchedUsers = response.data.data || [];
          setUsers(fetchedUsers);
          if (onUsersFetched) {
            onUsersFetched(fetchedUsers); // Notify parent about fetched users
          }
        } else {
          setError(response.data.message || 'Failed to fetch users.');
          setUsers([]); // Đặt lại users nếu có lỗi
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.response?.data?.message || 'An error occurred while fetching users.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshCounter, onUsersFetched]); // Re-fetch when refreshCounter changes

  const handleOpenConfirmDialog = (userId) => {
    setUserToDelete(userId);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      // Consider a more specific loading state for delete action if needed
      // setLoading(true); 
      await api.delete(`/users/${userToDelete}`);
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userToDelete));
      setSnackbar({ open: true, message: 'Người dùng đã được xóa thành công!', severity: 'success' });
    } catch (err) {
      console.error("Error deleting user:", err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi khi xóa người dùng.', severity: 'error' });
    } finally {
      handleCloseConfirmDialog();
      // setLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Edit handler now calls prop from parent
  const handleEdit = (user) => {
    if (onEditUser) {
      onEditUser(user);
    }
  };

  if (loading && users.length === 0) { // Show loading only on initial load or if users array is empty
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải danh sách người dùng...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (users.length === 0 && !loading) {
    return <Typography sx={{ mt: 2 }}>Không tìm thấy người dùng nào.</Typography>;
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table of users">
          <TableHead sx={{ backgroundColor: 'grey.100'}}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Họ Tên</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Vai trò</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover'} }}
              >
                <TableCell component="th" scope="row">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.status || 'N/A'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Sửa">
                    <IconButton size="small" onClick={() => handleEdit(user)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" onClick={() => handleOpenConfirmDialog(user._id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa User"
        message="Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác."
      />
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
    </>
  );
};

export default UserList; 