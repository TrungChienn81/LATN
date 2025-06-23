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
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  PhotoCamera as PhotoCameraIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ShopSettings = () => {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Form states for different tabs
  const [basicInfo, setBasicInfo] = useState({
    shopName: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    logoUrl: '',
    bannerUrl: ''
  });

  const [addressInfo, setAddressInfo] = useState({
    street: '',
    city: '',
    district: '',
    ward: ''
  });

  const [businessSettings, setBusinessSettings] = useState({
    autoConfirmOrders: false,
    allowReturns: true,
    returnPeriod: 7,
    businessHours: {
      open: '08:00',
      close: '22:00',
      closedDays: []
    },
    shippingMethods: ['standard', 'express'],
    paymentMethods: ['cod', 'bank_transfer']
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewOrder: true,
    emailOnOrderStatusChange: true,
    smsOnNewOrder: false,
    smsOnOrderStatusChange: false
  });

  const dayOptions = [
    { value: 0, label: 'Chủ nhật' },
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' }
  ];

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
        
        // Populate form states
        setBasicInfo({
          shopName: shopData.shopName || '',
          description: shopData.description || '',
          contactPhone: shopData.contactPhone || '',
          contactEmail: shopData.contactEmail || '',
          logoUrl: shopData.logoUrl || '',
          bannerUrl: shopData.bannerUrl || ''
        });

        setAddressInfo({
          street: shopData.address?.street || '',
          city: shopData.address?.city || '',
          district: shopData.address?.district || '',
          ward: shopData.address?.ward || ''
        });

        // Load business settings from shop data or defaults
        setBusinessSettings({
          autoConfirmOrders: shopData.settings?.autoConfirmOrders || false,
          allowReturns: shopData.settings?.allowReturns || true,
          returnPeriod: shopData.settings?.returnPeriod || 7,
          businessHours: shopData.settings?.businessHours || {
            open: '08:00',
            close: '22:00',
            closedDays: []
          },
          shippingMethods: shopData.settings?.shippingMethods || ['standard', 'express'],
          paymentMethods: shopData.settings?.paymentMethods || ['cod', 'bank_transfer']
        });

        setNotificationSettings({
          emailOnNewOrder: shopData.settings?.emailOnNewOrder !== false,
          emailOnOrderStatusChange: shopData.settings?.emailOnOrderStatusChange !== false,
          smsOnNewOrder: shopData.settings?.smsOnNewOrder || false,
          smsOnOrderStatusChange: shopData.settings?.smsOnOrderStatusChange || false
        });
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
      toast.error('Không thể tải thông tin shop');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBasicInfoSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/shops/my-shop', basicInfo);
      if (response.data.success) {
        toast.success('Cập nhật thông tin cơ bản thành công');
        fetchShopData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating basic info:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/shops/my-shop', {
        address: addressInfo
      });
      if (response.data.success) {
        toast.success('Cập nhật địa chỉ thành công');
        fetchShopData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Có lỗi xảy ra khi cập nhật địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessSettingsSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/shops/my-shop', {
        settings: businessSettings
      });
      if (response.data.success) {
        toast.success('Cập nhật cài đặt kinh doanh thành công');
        fetchShopData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating business settings:', error);
      toast.error('Có lỗi xảy ra khi cập nhật cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSettingsSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/shops/my-shop', {
        settings: {
          ...businessSettings,
          ...notificationSettings
        }
      });
      if (response.data.success) {
        toast.success('Cập nhật cài đặt thông báo thành công');
        fetchShopData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Có lỗi xảy ra khi cập nhật cài đặt thông báo');
    } finally {
      setSaving(false);
    }
  };

  const handleClosedDaysChange = (day) => {
    setBusinessSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        closedDays: prev.businessHours.closedDays.includes(day)
          ? prev.businessHours.closedDays.filter(d => d !== day)
          : [...prev.businessHours.closedDays, day]
      }
    }));
  };

  const handleShippingMethodChange = (method) => {
    setBusinessSettings(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.includes(method)
        ? prev.shippingMethods.filter(m => m !== method)
        : [...prev.shippingMethods, method]
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setBusinessSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Cài đặt Shop
      </Typography>

      <Card>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<BusinessIcon />} label="Thông tin cơ bản" />
          <Tab icon={<SettingsIcon />} label="Cài đặt kinh doanh" />
          <Tab icon={<NotificationsIcon />} label="Thông báo" />
          <Tab icon={<SecurityIcon />} label="Bảo mật" />
        </Tabs>

        {/* Tab 1: Basic Information */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  src={basicInfo.logoUrl}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                >
                  {basicInfo.shopName.charAt(0)}
                </Avatar>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  size="small"
                >
                  Thay đổi logo
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tên shop"
                    value={basicInfo.shopName}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, shopName: e.target.value }))}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Mô tả shop"
                    value={basicInfo.description}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, description: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    value={basicInfo.contactPhone}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email liên hệ"
                    type="email"
                    value={basicInfo.contactEmail}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>Địa chỉ</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ cụ thể"
                value={addressInfo.street}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, street: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tỉnh/Thành phố"
                value={addressInfo.city}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quận/Huyện"
                value={addressInfo.district}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, district: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phường/Xã"
                value={addressInfo.ward}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, ward: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleBasicInfoSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Lưu thông tin cơ bản'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleAddressSave}
              disabled={saving}
            >
              Lưu địa chỉ
            </Button>
          </Box>
        </TabPanel>

        {/* Tab 2: Business Settings */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Order Settings */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Cài đặt đơn hàng</Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.autoConfirmOrders}
                      onChange={(e) => setBusinessSettings(prev => ({ 
                        ...prev, 
                        autoConfirmOrders: e.target.checked 
                      }))}
                    />
                  }
                  label="Tự động xác nhận đơn hàng"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.allowReturns}
                      onChange={(e) => setBusinessSettings(prev => ({ 
                        ...prev, 
                        allowReturns: e.target.checked 
                      }))}
                    />
                  }
                  label="Cho phép đổi trả"
                />
                
                {businessSettings.allowReturns && (
                  <TextField
                    fullWidth
                    type="number"
                    label="Thời gian đổi trả (ngày)"
                    value={businessSettings.returnPeriod}
                    onChange={(e) => setBusinessSettings(prev => ({ 
                      ...prev, 
                      returnPeriod: parseInt(e.target.value) || 7 
                    }))}
                    sx={{ mt: 2 }}
                  />
                )}
              </Paper>
            </Grid>

            {/* Business Hours */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Giờ làm việc</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Giờ mở cửa"
                      value={businessSettings.businessHours.open}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        businessHours: {
                          ...prev.businessHours,
                          open: e.target.value
                        }
                      }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Giờ đóng cửa"
                      value={businessSettings.businessHours.close}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        businessHours: {
                          ...prev.businessHours,
                          close: e.target.value
                        }
                      }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Ngày nghỉ:
                </Typography>
                {dayOptions.map(day => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Switch
                        checked={businessSettings.businessHours.closedDays.includes(day.value)}
                        onChange={() => handleClosedDaysChange(day.value)}
                        size="small"
                      />
                    }
                    label={day.label}
                    sx={{ display: 'block' }}
                  />
                ))}
              </Paper>
            </Grid>

            {/* Shipping Methods */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Phương thức giao hàng</Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.shippingMethods.includes('standard')}
                      onChange={() => handleShippingMethodChange('standard')}
                    />
                  }
                  label="Giao hàng tiêu chuẩn"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.shippingMethods.includes('express')}
                      onChange={() => handleShippingMethodChange('express')}
                    />
                  }
                  label="Giao hàng nhanh"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.shippingMethods.includes('pickup')}
                      onChange={() => handleShippingMethodChange('pickup')}
                    />
                  }
                  label="Khách tự đến lấy"
                />
              </Paper>
            </Grid>

            {/* Payment Methods */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Phương thức thanh toán</Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.paymentMethods.includes('cod')}
                      onChange={() => handlePaymentMethodChange('cod')}
                    />
                  }
                  label="Thanh toán khi nhận hàng"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.paymentMethods.includes('bank_transfer')}
                      onChange={() => handlePaymentMethodChange('bank_transfer')}
                    />
                  }
                  label="Chuyển khoản ngân hàng"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.paymentMethods.includes('momo')}
                      onChange={() => handlePaymentMethodChange('momo')}
                    />
                  }
                  label="Ví MoMo"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={businessSettings.paymentMethods.includes('vnpay')}
                      onChange={() => handlePaymentMethodChange('vnpay')}
                    />
                  }
                  label="VNPay"
                />
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleBusinessSettingsSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Lưu cài đặt kinh doanh'}
            </Button>
          </Box>
        </TabPanel>

        {/* Tab 3: Notification Settings */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Thông báo Email</Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailOnNewOrder}
                      onChange={(e) => setNotificationSettings(prev => ({ 
                        ...prev, 
                        emailOnNewOrder: e.target.checked 
                      }))}
                    />
                  }
                  label="Email khi có đơn hàng mới"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailOnOrderStatusChange}
                      onChange={(e) => setNotificationSettings(prev => ({ 
                        ...prev, 
                        emailOnOrderStatusChange: e.target.checked 
                      }))}
                    />
                  }
                  label="Email khi trạng thái đơn hàng thay đổi"
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Thông báo SMS</Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.smsOnNewOrder}
                      onChange={(e) => setNotificationSettings(prev => ({ 
                        ...prev, 
                        smsOnNewOrder: e.target.checked 
                      }))}
                    />
                  }
                  label="SMS khi có đơn hàng mới"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.smsOnOrderStatusChange}
                      onChange={(e) => setNotificationSettings(prev => ({ 
                        ...prev, 
                        smsOnOrderStatusChange: e.target.checked 
                      }))}
                    />
                  }
                  label="SMS khi trạng thái đơn hàng thay đổi"
                />
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleNotificationSettingsSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Lưu cài đặt thông báo'}
            </Button>
          </Box>
        </TabPanel>

        {/* Tab 4: Security Settings */}
        <TabPanel value={tabValue} index={3}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Các cài đặt bảo mật sẽ được phát triển trong phiên bản tiếp theo.
          </Alert>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Bảo mật tài khoản</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quản lý các cài đặt bảo mật cho shop của bạn
            </Typography>
            
            <Button variant="outlined" disabled sx={{ mt: 2 }}>
              Đổi mật khẩu
            </Button>
            
            <Button variant="outlined" disabled sx={{ mt: 2, ml: 2 }}>
              Thiết lập xác thực 2 lớp
            </Button>
          </Paper>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default ShopSettings; 