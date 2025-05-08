  // src/components/HeroSlider/HeroSlider.jsx
  import React from 'react';
  import Slider from 'react-slick';
  // Import thêm Grid
  import { Box, Button, Container, Typography, Grid } from '@mui/material';
  import { Link as RouterLink } from 'react-router-dom';
  import './HeroSlider.css'; // Đảm bảo bạn đã import file CSS này

  // CSS của react-slick (Đã import trong main.jsx)
  // import "slick-carousel/slick/slick.css";
  // import "slick-carousel/slick/slick-theme.css";

  function HeroSlider() {
    const settings = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 5000,
      pauseOnHover: true,
      arrows: true, // Bật lại mũi tên (có thể style trong HeroSlider.css)
      responsive: [
        {
          breakpoint: 768, // Trên màn hình nhỏ hơn 768px
          settings: {
            arrows: false, // Ẩn mũi tên
          }
        }
      ]
    };

    // --- CẬP NHẬT DỮ LIỆU SLIDES ĐẦY ĐỦ ---
    const slides = [
      {
        id: 1,
        backgroundImg: '/images/slider/slide-bg-1.jpg',    // Ảnh nền slide 1
        foregroundImage: '/images/slider/upgradepc.jpg',      // Ảnh PC cho slide 1
        title: 'THU CŨ - ĐỔI MỚI',
        subtitle: 'TẠI NHÀ',
        buttonText: 'Liên hệ ngay',
        link: '/contact',
        bgColorFallback: '#1A237E',  // Màu nền xanh đậm
        textColor: '#FFFFFF'        // Màu chữ trắng
      },
      {
        id: 2,
        backgroundImg: '/images/slider/slide-bg-1.jpg',     // Ảnh nền slide 2
        foregroundImage: '/images/slider/gaming.jpg', // Ảnh Laptop Gaming
        title: 'LAPTOP GAMING',
        subtitle: 'Hiệu năng đỉnh cao',
        buttonText: 'Xem Ngay',
        link: '/products?category=gaming',
        bgColorFallback: '#1A237E',  // Màu nền xanh đậm
        textColor: '#FFFFFF'        // Màu chữ trắng
      },
      {
        id: 3,
        backgroundImg: '/images/slider/slide-bg-1.jpg',    // Ảnh nền slide 3
        foregroundImage: '/images/slider/office.jpg',// Ảnh Laptop Văn phòng
        title: 'VĂN PHÒNG HIỆN ĐẠI',
        subtitle: 'Laptop mỏng nhẹ, mạnh mẽ',
        buttonText: 'Khám Phá',
        link: '/products?category=office',
        bgColorFallback: '#1A237E',  // Màu nền xanh đậm
        textColor: '#FFFFFF'        // Màu chữ trắng
      }
    ];
    // --- KẾT THÚC CẬP NHẬT DỮ LIỆU ---


    return (
      <Box className="hero-slider-wrapper" sx={{ mb: 4, position: 'relative', overflow: 'hidden' }}>
        <Slider {...settings}>
          {slides.map((slide) => (
            <div key={slide.id}>
              <Box
                sx={{
                  display: 'flex !important',
                  alignItems: 'center',
                  minHeight: { xs: '350px', sm: '400px', md: '450px' },
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), url(${slide.backgroundImg || '/placeholder.png'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundColor: slide.bgColorFallback || '#eee',
                  color: slide.textColor || '#333',
                }}
              >
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 4, md: 8 } }}>
                  <Grid container spacing={{ xs: 1, md: 3 }} alignItems="center">
                    {/* Text Column */}
                    <Grid item xs={12} md={6} className="slide-content">
                      <Typography
                        variant="h2"
                        component="h1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{
                          color: 'inherit',
                          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                          lineHeight: 1.2,
                          mb: 2
                        }}
                      >
                        {slide.title}
                      </Typography>
                      <Typography
                        variant="h5"
                        component="p"
                        sx={{
                          color: 'inherit',
                          opacity: 0.9,
                          mb: 3,
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          lineHeight: 1.4
                        }}
                      >
                        {slide.subtitle}
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        color={slide.buttonColor || "primary"}
                        component={RouterLink}
                        to={slide.link}
                        sx={{
                          mt: 2,
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: (theme) => theme.shadows[4]
                          }
                        }}
                      >
                        {slide.buttonText}
                      </Button>
                    </Grid>
                    
                    {/* Image Column */}
                    <Grid item xs={12} md={6} sx={{ textAlign: 'center' }} className="slide-content">
                      <Box
                        component="img"
                        src={slide.foregroundImage || '/placeholder.png'}
                        alt={slide.title}
                        sx={{
                          maxHeight: { xs: '180px', sm: '240px', md: '300px' },
                          maxWidth: '100%',
                          objectFit: 'contain',
                          transition: 'transform 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Container>
              </Box>
            </div>
          ))}
        </Slider>
      </Box>
    );
  }

  export default HeroSlider;