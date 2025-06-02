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
import ProductCard from '../components/product/ProductCard';
import ProductListItem from '../components/product/ProductListItem';
import { logUserBehavior } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value * 1000000);
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
  const [view, setView] = useState('grid');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
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
        // Fetch categories
        const categoriesRes = await api.get('/categories');
        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data);
        }
        
        // Fetch brands
        const brandsRes = await api.get('/brands');
        if (brandsRes.data.success) {
          setBrands(brandsRes.data.data);
        }
        
        // Fetch current category if categorySlug exists
        if (categorySlug) {
          const categoryRes = await api.get(`/categories/slug/${categorySlug}`);
          if (categoryRes.data.success) {
            setCategory(categoryRes.data.data);
          }
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
        // Tạo query params
        const params = new URLSearchParams();
        
        // Add pagination
        params.append('page', pagination.page);
        params.append('limit', pagination.limit);
        
        // Add sort
        params.append('sort', sort);
        
        // Add category filter
        if (categorySlug) {
          params.append('category', categorySlug);
        }
        
        // Add price range filter
        if (filters.price[0] > 0 || filters.price[1] < 100) {
          params.append('price_min', filters.price[0]);
          params.append('price_max', filters.price[1]);
        }
        
        // Add brand filters
        if (filters.brands && filters.brands.length > 0) {
          params.append('brands', JSON.stringify(filters.brands));
        }
        
        // Add technical specs filters
        if (filters.ram && filters.ram.length > 0) {
          params.append('ram', JSON.stringify(filters.ram));
        }
        
        if (filters.storage && filters.storage.length > 0) {
          params.append('storage', JSON.stringify(filters.storage));
        }
        
        if (filters.processor && filters.processor.length > 0) {
          params.append('processor', JSON.stringify(filters.processor));
        }
        
        if (filters.gpu && filters.gpu.length > 0) {
          params.append('gpu', JSON.stringify(filters.gpu));
        }
        
        // Fetch products
        const response = await api.get(`/products?${params}`);
        if (response.data.success) {
          setProducts(response.data.data);
          setPagination({
            ...pagination,
            total: response.data.total,
            totalPages: response.data.totalPages
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
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
      
      {/* Category Filter (when on /products page) */}
      {!categorySlug && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Danh mục</Typography>
          <List disablePadding>
            {categories.map((cat) => (
              <ListItem 
                key={cat._id} 
                dense 
                disablePadding
                sx={{ py: 0.5 }}
              >
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={filters.category === cat.slug} 
                      onChange={() => {
                        if (filters.category === cat.slug) {
                          handleFilterChange('category', '');
                        } else {
                          navigate(`/categories/${cat.slug}`);
                        }
                      }} 
                    />
                  }
                  label={cat.name}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      {/* Price Range Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Khoảng giá</Typography>
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
      
      {/* Brand Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Thương hiệu</Typography>
        <List disablePadding>
          {brands.map((brand) => (
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
              />
            </ListItem>
          ))}
        </List>
      </Box>
      
      {/* RAM Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>RAM</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'].map((ram) => (
            <Chip
              key={ram}
              label={ram}
              clickable
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
        <Typography variant="subtitle1" gutterBottom>Ổ cứng</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['256 GB', '512 GB', '1 TB', '2 TB', '4 TB'].map((storage) => (
            <Chip
              key={storage}
              label={storage}
              clickable
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
      
      {/* Processor Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>CPU</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9'].map((cpu) => (
            <Chip
              key={cpu}
              label={cpu}
              clickable
              color={filters.processor.includes(cpu) ? 'primary' : 'default'}
              variant={filters.processor.includes(cpu) ? 'filled' : 'outlined'}
              onClick={() => {
                if (filters.processor.includes(cpu)) {
                  handleFilterChange('processor', filters.processor.filter(p => p !== cpu));
                } else {
                  handleFilterChange('processor', [...filters.processor, cpu]);
                }
              }}
            />
          ))}
        </Box>
      </Box>
      
      {/* GPU Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Card đồ họa</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['NVIDIA GTX 1650', 'NVIDIA RTX 3050', 'NVIDIA RTX 3060', 'NVIDIA RTX 3070', 'NVIDIA RTX 4050', 'NVIDIA RTX 4060', 'NVIDIA RTX 4070', 'AMD Radeon RX 6600', 'AMD Radeon RX 6700', 'Intel Iris Xe'].map((gpu) => (
            <Chip
              key={gpu}
              label={gpu}
              clickable
              color={filters.gpu.includes(gpu) ? 'primary' : 'default'}
              variant={filters.gpu.includes(gpu) ? 'filled' : 'outlined'}
              onClick={() => {
                if (filters.gpu.includes(gpu)) {
                  handleFilterChange('gpu', filters.gpu.filter(g => g !== gpu));
                } else {
                  handleFilterChange('gpu', [...filters.gpu, gpu]);
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
          label: `Thương hiệu: ${brand.name}`,
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
    
    // Processor filters
    filters.processor.forEach(cpu => {
      activeFilters.push({
        label: `CPU: ${cpu}`,
        onDelete: () => handleFilterChange('processor', filters.processor.filter(p => p !== cpu))
      });
    });
    
    // GPU filters
    filters.gpu.forEach(gpu => {
      activeFilters.push({
        label: `GPU: ${gpu}`,
        onDelete: () => handleFilterChange('gpu', filters.gpu.filter(g => g !== gpu))
      });
    });
    
    if (activeFilters.length === 0) return null;
    
    return (
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {activeFilters.map((filter, index) => (
          <Chip
            key={index}
            label={filter.label}
            onDelete={filter.onDelete}
            size="small"
          />
        ))}
        
        <Chip
          label="Xóa tất cả"
          color="error"
          size="small"
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
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/">
          Trang chủ
        </Link>
        <Link color="inherit" href="/products">
          Sản phẩm
        </Link>
        {category && (
          <Typography color="text.primary">{category.name}</Typography>
        )}
      </Breadcrumbs>
      
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {category ? category.name : 'Tất cả sản phẩm'}
        </Typography>
        {category && category.description && (
          <Typography variant="body1" color="text.secondary">
            {category.description}
          </Typography>
        )}
      </Box>
      
      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Filters - Desktop */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <Paper 
              elevation={0} 
              variant="outlined" 
              sx={{ p: 2, position: 'sticky', top: 20 }}
            >
              {renderFilters()}
            </Paper>
          </Grid>
        )}
        
        {/* Products */}
        <Grid item xs={12} md={!isMobile ? 9 : 12}>
          {/* Control Bar */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
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
              
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <IconButton 
                  color={view === 'grid' ? 'primary' : 'default'} 
                  onClick={() => setView('grid')}
                >
                  <GridViewIcon />
                </IconButton>
                <IconButton 
                  color={view === 'list' ? 'primary' : 'default'} 
                  onClick={() => setView('list')}
                >
                  <ListViewIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Hiển thị {products.length} / {pagination.total} sản phẩm
            </Typography>
          </Box>
          
          {/* Active Filters */}
          {renderActiveFilters()}
          
          {/* Products Grid/List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography variant="h6" gutterBottom>Không tìm thấy sản phẩm nào</Typography>
              <Typography variant="body1" color="text.secondary">
                Vui lòng thử lại với bộ lọc khác
              </Typography>
            </Box>
          ) : (
            <>
              {view === 'grid' ? (
                <Grid container spacing={2}>
                  {products.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product._id}>
                      <ProductCard 
                        product={product} 
                        onClick={() => handleProductClick(product._id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box>
                  {products.map((product) => (
                    <ProductListItem 
                      key={product._id} 
                      product={product} 
                      onClick={() => handleProductClick(product._id)}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={pagination.totalPages} 
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton 
                showLastButton
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
          )}
        </Grid>
      </Grid>
      
      {/* Filters Drawer - Mobile */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {renderFilters()}
      </Drawer>
    </Container>
  );
};

export default ProductCategoryPage;
