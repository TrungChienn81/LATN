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
      arrows: true, 
      responsive: [
        {
          breakpoint: 768,
          settings: {
            arrows: false,
          }
        }
      ]
    };

    const slides = [
      {
        id: 1,
        backgroundImg: '/images/slider/slide-bg-1.jpg',
        foregroundImage: '/images/slider/upgradepc.jpg',
        title: 'THU CŨ - ĐỔI MỚI',
        subtitle: 'TẠI NHÀ',
        buttonText: 'Liên hệ ngay',
        link: '/contact',
        bgColorFallback: '#1A237E',
        textColor: '#FFFFFF'
      },
      {
        id: 2,
        backgroundImg: '/images/slider/slide-bg-1.jpg',
        foregroundImage: '/images/slider/gaming.jpg',
        title: 'LAPTOP GAMING',
        subtitle: 'Hiệu năng đỉnh cao',
        buttonText: 'Xem Ngay',
        link: '/products?category=gaming',
        bgColorFallback: '#1A237E',
        textColor: '#FFFFFF'
      },
      {
        id: 3,
        backgroundImg: '/images/slider/slide-bg-1.jpg',
        foregroundImage: '/images/slider/office.jpg',
        title: 'VĂN PHÒNG HIỆN ĐẠI',
        subtitle: 'Laptop mỏng nhẹ, mạnh mẽ',
        buttonText: 'Khám Phá',
        link: '/products?category=office',
        bgColorFallback: '#1A237E',
        textColor: '#FFFFFF'
      }
    ];

    return (
      <Box className="hero-slider-wrapper" sx={{ position: 'relative', overflow: 'hidden', height: { xs: '350px', sm: '400px', md: '450px' } }}>
        <Slider {...settings}>
          {slides.map((slide) => (
            <div key={slide.id}>
              <Box
                sx={{
                  display: 'flex !important',
                  alignItems: 'center',
                  height: { xs: '350px', sm: '400px', md: '450px' },
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), url(${slide.backgroundImg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundColor: slide.bgColorFallback,
                  color: slide.textColor,
                }}
              >
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 4 } }}>
                  <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
                    <Grid item xs={12} md={6} className="slide-content">
                      <Typography variant="h2" component="h1" fontWeight="bold" sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1.2, mb: 2 }}>
                        {slide.title}
                      </Typography>
                      <Typography variant="h5" component="p" sx={{ opacity: 0.9, mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {slide.subtitle}
                      </Typography>
                      <Button component={RouterLink} to={slide.link} variant="contained" size="large" sx={{ mt: 2, px: 4, py: 1.5, fontWeight: 600 }}>
                        {slide.buttonText}
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={6} sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }} className="slide-content">
                      <Box
                        component="img"
                        src={slide.foregroundImage}
                        alt={slide.title}
                        sx={{
                          maxHeight: { xs: '200px', sm: '250px', md: '300px' },
                          maxWidth: '100%',
                          objectFit: 'contain',
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