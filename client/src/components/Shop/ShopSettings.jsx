import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ShopSettings = () => {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState({
    shopName: false,
    description: false,
    contactInfo: false,
    address: false
  });
  
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    address: {
      street: '',
      city: '',
      district: '',
      ward: ''
    }
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    field: '',
    newValue: ''
  });

  // Load shop data
  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shops/my-shop');
      if (response.data.success) {
        const shopData = response.data.data;
        setShop(shopData);
        setFormData({
          shopName: shopData.shopName || '',
          description: shopData.description || '',
          contactPhone: shopData.contactPhone || '',
          contactEmail: shopData.contactEmail || '',
          address: {
            street: shopData.address?.street || '',
            city: shopData.address?.city || '',
            district: shopData.address?.district || '',
            ward: shopData.address?.ward || ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      toast.error('Không thể tải thông tin shop');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEditToggle = (field) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async (field) => {
    if (field === 'shopName' && formData.shopName !== shop.shopName) {
      // Confirm dialog for shop name change
      setConfirmDialog({
        open: true,
        field: 'shopName',
        newValue: formData.shopName
      });
      return;
    }
    
    await saveField(field);
  };

  const saveField = async (field) => {
    try {
      setSaving(true);
      
      let updateData = {};
      
      if (field === 'shopName') {
        updateData.shopName = formData.shopName;
      } else if (field === 'description') {
        updateData.description = formData.description;
      } else if (field === 'contactInfo') {
        updateData.contactPhone = formData.contactPhone;
        updateData.contactEmail = formData.contactEmail;
      } else if (field === 'address') {
        updateData.address = formData.address;
      }

      const response = await api.put(`/shops/${shop._id}`, updateData);
      
      if (response.data.success) {
        setShop(response.data.data);
        toast.success('Cập nhật thành công!');
        handleEditToggle(field);
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    setConfirmDialog({ open: false, field: '', newValue: '' });
    await saveField('shopName');
  };

  const handleCancel = (field) => {
    // Reset form data to original values
    setFormData({
      shopName: shop.shopName || '',
      description: shop.description || '',
      contactPhone: shop.contactPhone || '',
      contactEmail: shop.contactEmail || '',
      address: {
        street: shop.address?.street || '',
        city: shop.address?.city || '',
        district: shop.address?.district || '',
        ward: shop.address?.ward || ''
      }
    });
    handleEditToggle(field);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shop) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Không thể tải thông tin shop
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Cài đặt Shop
      </Typography>

      <Grid container spacing={3}>
        {/* Shop Name Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Tên Shop</Typography>
              </Box>
              
              {editMode.shopName ? (
                <TextField
                  fullWidth
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="Nhập tên shop mới"
                  disabled={saving}
                />
              ) : (
                <Typography variant="body1" sx={{ py: 1, minHeight: '24px' }}>
                  {shop.shopName}
                </Typography>
              )}
            </CardContent>
            
            <CardActions>
              {editMode.shopName ? (
                <>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('shopName')}
                    disabled={saving || !formData.shopName.trim()}
                    color="primary"
                    size="small"
                  >
                    {saving ? <CircularProgress size={16} /> : 'Lưu'}
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancel('shopName')}
                    disabled={saving}
                    size="small"
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => handleEditToggle('shopName')}
                  size="small"
                >
                  Chỉnh sửa
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Description Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Mô tả Shop</Typography>
              </Box>
              
              {editMode.description ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="Nhập mô tả shop"
                  disabled={saving}
                />
              ) : (
                <Typography variant="body1" sx={{ py: 1, minHeight: '60px' }}>
                  {shop.description || 'Chưa có mô tả'}
                </Typography>
              )}
            </CardContent>
            
            <CardActions>
              {editMode.description ? (
                <>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('description')}
                    disabled={saving}
                    color="primary"
                    size="small"
                  >
                    {saving ? <CircularProgress size={16} /> : 'Lưu'}
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancel('description')}
                    disabled={saving}
                    size="small"
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => handleEditToggle('description')}
                  size="small"
                >
                  Chỉnh sửa
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Contact Information Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Thông tin liên hệ
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle2">Số điện thoại</Typography>
                  </Box>
                  
                  {editMode.contactInfo ? (
                    <TextField
                      fullWidth
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Nhập số điện thoại"
                      disabled={saving}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {shop.contactPhone || 'Chưa cập nhật'}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle2">Email liên hệ</Typography>
                  </Box>
                  
                  {editMode.contactInfo ? (
                    <TextField
                      fullWidth
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Nhập email liên hệ"
                      disabled={saving}
                      type="email"
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {shop.contactEmail || 'Chưa cập nhật'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
            
            <CardActions>
              {editMode.contactInfo ? (
                <>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('contactInfo')}
                    disabled={saving}
                    color="primary"
                    size="small"
                  >
                    {saving ? <CircularProgress size={16} /> : 'Lưu'}
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancel('contactInfo')}
                    disabled={saving}
                    size="small"
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => handleEditToggle('contactInfo')}
                  size="small"
                >
                  Chỉnh sửa
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Address Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Địa chỉ</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Đường/Số nhà</Typography>
                  {editMode.address ? (
                    <TextField
                      fullWidth
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Số nhà, tên đường"
                      disabled={saving}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {shop.address?.street || 'Chưa cập nhật'}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Thành phố</Typography>
                  {editMode.address ? (
                    <TextField
                      fullWidth
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Thành phố"
                      disabled={saving}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {shop.address?.city || 'Chưa cập nhật'}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Quận/Huyện</Typography>
                  {editMode.address ? (
                    <TextField
                      fullWidth
                      value={formData.address.district}
                      onChange={(e) => handleInputChange('address.district', e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Quận/Huyện"
                      disabled={saving}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {shop.address?.district || 'Chưa cập nhật'}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Phường/Xã</Typography>
                  {editMode.address ? (
                    <TextField
                      fullWidth
                      value={formData.address.ward}
                      onChange={(e) => handleInputChange('address.ward', e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Phường/Xã"
                      disabled={saving}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {shop.address?.ward || 'Chưa cập nhật'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
            
            <CardActions>
              {editMode.address ? (
                <>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('address')}
                    disabled={saving}
                    color="primary"
                    size="small"
                  >
                    {saving ? <CircularProgress size={16} /> : 'Lưu'}
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancel('address')}
                    disabled={saving}
                    size="small"
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => handleEditToggle('address')}
                  size="small"
                >
                  Chỉnh sửa
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, field: '', newValue: '' })}>
        <DialogTitle>Xác nhận thay đổi tên shop</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn đổi tên shop từ "<strong>{shop.shopName}</strong>" thành "<strong>{confirmDialog.newValue}</strong>"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Thay đổi tên shop có thể ảnh hưởng đến việc tìm kiếm và nhận diện thương hiệu của bạn.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, field: '', newValue: '' })}>
            Hủy
          </Button>
          <Button onClick={handleConfirmSave} variant="contained" color="primary">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopSettings; 