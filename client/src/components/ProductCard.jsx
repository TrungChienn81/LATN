// src/components/ProductCard.jsx
import React from 'react';
import {
  Card, CardMedia, CardContent, CardActions,
  Typography, Button, Rating, Box // Thêm Rating
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Component này nhận một prop là 'product' object
function ProductCard({ product }) {
  // Xử lý trường hợp product không có dữ liệu (phòng lỗi)
  if (!product) {
    return null; // Hoặc hiển thị một card placeholder
  }

  // Lấy ảnh đầu tiên hoặc ảnh mặc định
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : '/placeholder.png'; // Cần có ảnh này trong public/

  return (
    <Card sx={{
      height: '100%', // Chiếm hết chiều cao của Grid item cha
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.3s',
      '&:hover': { boxShadow: 6 } // Hiệu ứng đổ bóng khi hover
    }}
    >
      <CardMedia
        component="img"
        sx={{ height: 180, objectFit: 'contain', p: 1 }}
        // Đảm bảo product.images[0] là URL đúng từ backend HOẶC dùng placeholder
        image={product.images?.[0] || '/placeholder.png'}
        alt={product.name}
      />
      <CardContent sx={{ flexGrow: 1, p: 2 }}> {/* flexGrow để đẩy CardActions xuống dưới */}
        <Typography
          title={product.name} // Hiển thị tên đầy đủ khi hover
          gutterBottom
          variant="body1" // Có thể dùng h6 nếu muốn to hơn
          fontWeight="medium"
          component={RouterLink} // Click vào tên để đi đến chi tiết
          to={`/product/${product._id}`} // Link tới trang chi tiết (cần tạo route sau)
          sx={{
            height: '2.8em', lineHeight: '1.4em',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', // Giới hạn 2 dòng
            textDecoration: 'none', color: 'text.primary',
            '&:hover': { color: 'primary.main' } // Đổi màu khi hover
          }}
        >
          {product.name || "Không có tên"}
        </Typography>

        {/* Hiển thị Rating - Cần có trường averageRating trong data product */}
        <Rating
          name={`rating-${product._id}`}
          value={product.averageRating || 0} // Lấy từ DB hoặc mặc định là 0
          precision={0.5} // Độ chính xác 0.5 sao
          readOnly // Chỉ hiển thị, không cho sửa
          size="small"
          sx={{ my: 1 }} // margin top/bottom
        />

        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
          {/* Format giá tiền */}
          {product.price != null ? product.price.toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ'}
        </Typography>

      </CardContent>
      <CardActions sx={{ justifyContent: 'center', p: 2, pt: 0 }}> {/* Căn giữa nút, giảm padding top */}
        {/* TODO: Implement onClick handlers */}
        <Button variant="outlined" size="small" component={RouterLink} to={`/product/${product._id}`}>
          Chi tiết
        </Button>
        <Button variant="contained" size="small" color="primary">
          Thêm vào giỏ
        </Button>
      </CardActions>
    </Card>
  );
}

export default ProductCard;