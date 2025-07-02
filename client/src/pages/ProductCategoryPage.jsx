import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Breadcrumbs,
  Link,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Slider,
  Checkbox,
  FormControlLabel,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../services/api';
import ProductCardNew from '../components/product/ProductCardNew';
import { logUserBehavior } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value * 1000000);
};

// Component để theo dõi hành vi người dùng
const ProductTracker = ({ product, children }) => {
  const { user } = useAuth();
  
  useEffect(() => {
    // Ghi lại hành vi xem sản phẩm khi component render
    if (user) {
      logUserBehavior('view', product._id);
    }
  }, [product._id, user]);
  
  return children;
};

const ProductCategoryPage = () => {
  const { categorySlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // State
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20, // Increase limit for 5-column layout
    total: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    category: categorySlug || '',
    price: [0, 100], // triệu đồng
    brands: [],
    ram: [],
    storage: [],
    processor: [],
    gpu: []
  });

  // Sort options
  const [sort, setSort] = useState('newest');
  
  // Lấy query params từ URL
  const getFiltersFromUrl = useCallback(() => {
    const params = new URLSearchParams(location.search);
    
    const urlFilters = {};
    if (params.has('page')) {
      setPagination(prev => ({ ...prev, page: parseInt(params.get('page')) || 1 }));
    }
    
    if (params.has('sort')) {
      setSort(params.get('sort'));
    }
    
    if (params.has('price_min') && params.has('price_max')) {
      urlFilters.price = [
        parseFloat(params.get('price_min')) || 0,
        parseFloat(params.get('price_max')) || 100
      ];
    }
    
    if (params.has('brands')) {
      urlFilters.brands = params.getAll('brands');
    }
    
    if (params.has('ram')) {
      urlFilters.ram = params.getAll('ram');
    }
    
    if (params.has('storage')) {
      urlFilters.storage = params.getAll('storage');
    }
    
    if (params.has('processor')) {
      urlFilters.processor = params.getAll('processor');
    }
    
    if (params.has('gpu')) {
      urlFilters.gpu = params.getAll('gpu');
    }
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, [location.search]);

  // Cập nhật URL với filters hiện tại
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    // Thêm sort
    if (sort) {
      params.set('sort', sort);
    }
    
    // Thêm page
    if (pagination.page > 1) {
      params.set('page', pagination.page);
    }
    
    // Thêm price range
    if (filters.price[0] > 0) {
      params.set('price_min', filters.price[0]);
    }
    if (filters.price[1] < 100) {
      params.set('price_max', filters.price[1]);
    }
    
    // Thêm brands
    if (filters.brands && filters.brands.length > 0) {
      filters.brands.forEach(brand => params.append('brands', brand));
    }
    
    // Thêm ram
    if (filters.ram && filters.ram.length > 0) {
      filters.ram.forEach(ram => params.append('ram', ram));
    }
    
    // Thêm storage
    if (filters.storage && filters.storage.length > 0) {
      filters.storage.forEach(storage => params.append('storage', storage));
    }
    
    // Thêm processor
    if (filters.processor && filters.processor.length > 0) {
      filters.processor.forEach(processor => params.append('processor', processor));
    }
    
    // Thêm gpu
    if (filters.gpu && filters.gpu.length > 0) {
      filters.gpu.forEach(gpu => params.append('gpu', gpu));
    }
    
    // Cập nhật URL không reload page
    navigate({
      pathname: categorySlug ? `/categories/${categorySlug}` : '/products',
      search: params.toString() ? `?${params.toString()}` : ''
    }, { replace: true });
  }, [filters, pagination.page, sort, navigate, categorySlug]);

  // Load filter options khi component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Load categories from localStorage first (same as homepage)
        const savedCategories = localStorage.getItem('admin_categories');
        if (savedCategories) {
          const parsedCategories = JSON.parse(savedCategories);
          const transformedCategories = parsedCategories
            .filter(cat => cat.status === 'active')
            .map(cat => ({
              _id: cat.id,
              name: cat.name,
              slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
              icon: cat.icon,
              color: cat.color,
              productCount: cat.productCount
            }));
          setCategories(transformedCategories);
          
          // Find current category if categorySlug exists
          if (categorySlug) {
            const currentCategory = transformedCategories.find(cat => cat.slug === categorySlug);
            if (currentCategory) {
              setCategory(currentCategory);
            }
          }
        }
        
        // Also try to fetch from API as fallback
        try {
          const categoriesRes = await api.get('/categories');
          if (categoriesRes.data.success) {
            const apiCategories = categoriesRes.data.data;
            // If we don't have localStorage categories, use API categories
            if (!savedCategories) {
              setCategories(apiCategories);
              if (categorySlug) {
                const categoryRes = await api.get(`/categories/slug/${categorySlug}`);
                if (categoryRes.data.success) {
                  setCategory(categoryRes.data.data);
                }
              }
            }
          }
        } catch (apiError) {
          console.log('API categories not available, using localStorage only');
        }
        
        // Fetch brands
        try {
          const brandsRes = await api.get('/brands');
          if (brandsRes.data.success) {
            setBrands(brandsRes.data.data);
          }
        } catch (brandError) {
          console.log('Brands API not available');
          // Set some default brands for demo
          setBrands([
            { _id: 'msi', name: 'MSI' },
            { _id: 'asus', name: 'ASUS' },
            { _id: 'hp', name: 'HP' },
            { _id: 'dell', name: 'Dell' },
            { _id: 'acer', name: 'Acer' },
            { _id: 'logitech', name: 'Logitech' },
            { _id: 'corsair', name: 'Corsair' },
            { _id: 'custom', name: 'Custom Build' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    
    fetchFilterOptions();
    getFiltersFromUrl();
  }, [categorySlug, getFiltersFromUrl]);

  // Fetch products khi filters, sort hoặc pagination thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch products from API for all categories including gaming
        const params = new URLSearchParams();
        
        // Add pagination
        params.append('page', pagination.page);
        params.append('limit', pagination.limit);
        
        // Add category filter using categoryName for better matching
        if (categorySlug) {
          if (categorySlug === 'gaming') {
            params.append('categoryName', 'Gaming');
          } else {
            params.append('categoryName', categorySlug);
          }
        }
        
        // Add sort
        switch (sort) {
          case 'price_asc':
            params.append('sort', 'price');
            break;
          case 'price_desc':
            params.append('sort', '-price');
            break;
          case 'popular':
            params.append('sort', '-reviewCount');
            break;
          case 'rating':
            params.append('sort', '-rating');
            break;
          default: // newest
            params.append('sort', '-createdAt');
            break;
        }
        
        // Add price range filter (convert millions to actual price)
        if (filters.price[0] > 0 || filters.price[1] < 100) {
          const priceMin = filters.price[0] * 1000000;
          const priceMax = filters.price[1] * 1000000;
          params.append('price[gte]', priceMin);
          params.append('price[lte]', priceMax);
        }
        
        // Add brand filters
        if (filters.brands && filters.brands.length > 0) {
          filters.brands.forEach(brand => {
            params.append('brand', brand);
          });
        }
        
        console.log(`Fetching products for category: ${categorySlug} with params:`, params.toString());
        
        // Fetch products
        try {
          const response = await api.get(`/products?${params}`);
          console.log('Products API response:', response.data);
          
          if (response.data.success) {
            const fetchedProducts = response.data.data || [];
            console.log(`Found ${fetchedProducts.length} products for category: ${categorySlug}`);
            
            setProducts(fetchedProducts);
            setPagination({
              ...pagination,
              total: response.data.total || fetchedProducts.length,
              totalPages: response.data.totalPages || Math.ceil(fetchedProducts.length / pagination.limit)
            });
          } else {
            console.log('API response not successful:', response.data);
            setProducts([]);
            setPagination({
              ...pagination,
              total: 0,
              totalPages: 0
            });
          }
        } catch (apiError) {
          console.error('Error fetching products from API:', apiError);
          setProducts([]);
          setPagination({
            ...pagination,
            total: 0,
            totalPages: 0
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
    // Update URL with current filters
    updateUrl();
  }, [filters, sort, pagination.page, pagination.limit, categorySlug, updateUrl]);

  // Xử lý thay đổi filter
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Xử lý thay đổi sort
  const handleSortChange = (event) => {
    setSort(event.target.value);
  };

  // Xử lý thay đổi page
  const handlePageChange = (event, value) => {
    setPagination({ ...pagination, page: value });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Xử lý khi nhấn vào sản phẩm - log hành vi người dùng
  const handleProductClick = (productId) => {
    if (user) {
      logUserBehavior('click', productId);
    }
  };

  // Render filter drawer/sidebar
  const renderFilters = () => (
    <Box sx={{ width: isMobile ? 280 : '100%', p: isMobile ? 2 : 0 }}>
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Bộ lọc</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      
      {/* Price Range Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Khoảng giá</Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={filters.price}
            onChange={(e, newValue) => handleFilterChange('price', newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={100}
            step={1}
            valueLabelFormat={(value) => `${value} triệu`}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2">{formatCurrency(filters.price[0])}</Typography>
            <Typography variant="body2">{formatCurrency(filters.price[1])}</Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Brand Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Thương hiệu</Typography>
        <List disablePadding>
          {brands.slice(0, 6).map((brand) => (
            <ListItem 
              key={brand._id} 
              dense 
              disablePadding
              sx={{ py: 0.5 }}
            >
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={filters.brands.includes(brand._id)} 
                    onChange={() => {
                      if (filters.brands.includes(brand._id)) {
                        handleFilterChange('brands', filters.brands.filter(id => id !== brand._id));
                      } else {
                        handleFilterChange('brands', [...filters.brands, brand._id]);
                      }
                    }} 
                  />
                }
                label={brand.name}
                sx={{ fontSize: '0.875rem' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* RAM Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>RAM</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'].map((ram) => (
            <Chip
              key={ram}
              label={ram}
              clickable
              size="small"
              color={filters.ram.includes(ram) ? 'primary' : 'default'}
              variant={filters.ram.includes(ram) ? 'filled' : 'outlined'}
              onClick={() => {
                if (filters.ram.includes(ram)) {
                  handleFilterChange('ram', filters.ram.filter(r => r !== ram));
                } else {
                  handleFilterChange('ram', [...filters.ram, ram]);
                }
              }}
            />
          ))}
        </Box>
      </Box>
      
      {/* Storage Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Ổ cứng</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['256 GB', '512 GB', '1 TB', '2 TB', '4 TB'].map((storage) => (
            <Chip
              key={storage}
              label={storage}
              clickable
              size="small"
              color={filters.storage.includes(storage) ? 'primary' : 'default'}
              variant={filters.storage.includes(storage) ? 'filled' : 'outlined'}
              onClick={() => {
                if (filters.storage.includes(storage)) {
                  handleFilterChange('storage', filters.storage.filter(s => s !== storage));
                } else {
                  handleFilterChange('storage', [...filters.storage, storage]);
                }
              }}
            />
          ))}
        </Box>
      </Box>
      
      {/* Reset Filters Button */}
      <Button 
        variant="outlined" 
        color="error"
        fullWidth
        onClick={() => {
          setFilters({
            category: categorySlug || '',
            price: [0, 100],
            brands: [],
            ram: [],
            storage: [],
            processor: [],
            gpu: []
          });
          setPagination({ ...pagination, page: 1 });
        }}
      >
        Xóa bộ lọc
      </Button>
    </Box>
  );

  // Render active filters
  const renderActiveFilters = () => {
    const activeFilters = [];
    
    // Price filter
    if (filters.price[0] > 0 || filters.price[1] < 100) {
      activeFilters.push({
        label: `Giá: ${formatCurrency(filters.price[0])} - ${formatCurrency(filters.price[1])}`,
        onDelete: () => handleFilterChange('price', [0, 100])
      });
    }
    
    // Brand filters
    filters.brands.forEach(brandId => {
      const brand = brands.find(b => b._id === brandId);
      if (brand) {
        activeFilters.push({
          label: `${brand.name}`,
          onDelete: () => handleFilterChange('brands', filters.brands.filter(id => id !== brandId))
        });
      }
    });
    
    // RAM filters
    filters.ram.forEach(ram => {
      activeFilters.push({
        label: `RAM: ${ram}`,
        onDelete: () => handleFilterChange('ram', filters.ram.filter(r => r !== ram))
      });
    });
    
    // Storage filters
    filters.storage.forEach(storage => {
      activeFilters.push({
        label: `Ổ cứng: ${storage}`,
        onDelete: () => handleFilterChange('storage', filters.storage.filter(s => s !== storage))
      });
    });
    
    if (activeFilters.length === 0) return null;
    
    return (
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {activeFilters.map((filter, index) => (
          <Chip
            key={index}
            label={filter.label}
            onDelete={filter.onDelete}
            size="small"
            color="primary"
            variant="outlined"
          />
        ))}
        
        <Chip
          label="Xóa tất cả"
          color="error"
          size="small"
          variant="outlined"
          onClick={() => {
            setFilters({
              category: categorySlug || '',
              price: [0, 100],
              brands: [],
              ram: [],
              storage: [],
              processor: [],
              gpu: []
            });
          }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header Section */}
      <Box sx={{ backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/" sx={{ textDecoration: 'none' }}>
              Trang chủ
            </Link>
            <Link color="inherit" href="/products" sx={{ textDecoration: 'none' }}>
              Sản phẩm
            </Link>
            {category && (
              <Typography color="text.primary">{category.name}</Typography>
            )}
          </Breadcrumbs>
          
          {/* Page Title */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
              {category ? category.name : 'Tất cả sản phẩm'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hiển thị {products.length} / {pagination.total} sản phẩm
            </Typography>
          </Box>
          
          {/* Control Bar */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <Button 
                  variant="outlined" 
                  startIcon={<FilterIcon />}
                  onClick={() => setDrawerOpen(true)}
                  size="small"
                >
                  Bộ lọc
                </Button>
              )}
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="sort-label">Sắp xếp theo</InputLabel>
                <Select
                  labelId="sort-label"
                  value={sort}
                  label="Sắp xếp theo"
                  onChange={handleSortChange}
                >
                  <MenuItem value="newest">Mới nhất</MenuItem>
                  <MenuItem value="price_asc">Giá tăng dần</MenuItem>
                  <MenuItem value="price_desc">Giá giảm dần</MenuItem>
                  <MenuItem value="popular">Phổ biến nhất</MenuItem>
                  <MenuItem value="rating">Đánh giá cao nhất</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Container>
      </Box>
      
      {/* Main Content */}
      <Box sx={{ display: 'flex', width: '100%', position: 'relative' }}>
        {/* Left sidebar - Filters (Desktop) */}
        {!isMobile && (
          <Box
            sx={{
              width: { xs: 0, md: '240px' }, 
              flexShrink: 0,
              display: { xs: 'none', md: 'block' },
              position: 'relative',
              backgroundColor: '#f8f9fa',
              borderRight: '1px solid #e0e0e0'
            }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                height: 'calc(100vh - 200px)',
                overflowY: 'auto',
                borderRadius: 0,
                backgroundColor: 'transparent',
                border: 'none',
                m: 0,
                position: 'sticky',
                top: 0
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                Bộ lọc tìm kiếm
              </Typography>
              {renderFilters()}
            </Paper>
          </Box>
        )}
        
        {/* Right - Products */}
        <Box sx={{ 
          flex: 1, 
          minWidth: 0,
          backgroundColor: '#fff'
        }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={{ py: 3 }}>
              {/* Active Filters */}
              {renderActiveFilters()}
              
              {/* Products Grid */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                  <CircularProgress />
                </Box>
              ) : products.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', backgroundColor: 'white' }}>
                  <Typography variant="h6" gutterBottom>Không tìm thấy sản phẩm nào</Typography>
                  <Typography variant="body1" color="text.secondary">
                    Vui lòng thử lại với bộ lọc khác
                  </Typography>
                </Paper>
              ) : (
                <Grid 
                  container 
                  spacing={1.5}
                  className="product-grid-container"
                  sx={{
                    width: '100%',
                    margin: 0,
                    '& .MuiGrid-item': {
                      display: 'flex',
                      width: '100%'
                    }
                  }}
                >
                  {products.map((product) => (
                    <Grid 
                      item 
                      xs={6}
                      sm={4} 
                      md={2.4}
                      key={product._id}
                      className="product-grid-item"
                      sx={{
                        display: 'flex',
                        width: '100%',
                        minHeight: '380px'
                      }}
                    >
                      <ProductTracker product={product}>
                        <ProductCardNew 
                          product={product} 
                          onClick={() => handleProductClick(product._id)}
                        />
                      </ProductTracker>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white' }}>
                    <Pagination 
                      count={pagination.totalPages} 
                      page={pagination.page}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton 
                      showLastButton
                      size={isMobile ? 'small' : 'medium'}
                    />
                  </Paper>
                </Box>
              )}
            </Box>
          </Container>
        </Box>
      </Box>
      
      {/* Filters Drawer - Mobile */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {renderFilters()}
      </Drawer>
    </Box>
  );
};

export default ProductCategoryPage;
