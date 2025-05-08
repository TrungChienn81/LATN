// src/theme.js
import { createTheme } from '@mui/material/styles';
import { viVN } from '@mui/material/locale'; // Optional: Thêm tiếng Việt cho MUI

const theme = createTheme({
  palette: {
    mode: 'light', // Luôn dùng chế độ sáng
    primary: {
      // main: '#007bff', // Hoặc mã màu xanh bạn thích
      main: '#1976d2', // Màu xanh dương mặc định của MUI
    },
    secondary: {
      main: '#ffc107', // Ví dụ màu vàng cam
    },
    background: {
      default: '#f8f9fa', // Màu nền chính (xám rất nhạt) - giống hero section
      paper: '#ffffff',   // Nền của Card, Paper (trắng)
    },
    text: {
      primary: '#212529', // Màu chữ chính (đen nhạt)
      secondary: '#6c757d', // Màu chữ phụ (xám)
    },
    divider: 'rgba(0, 0, 0, 0.12)' // Màu đường kẻ phân cách
  },
  typography: {
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif', // Giữ font mặc định hoặc đổi
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h6: { fontWeight: 600 }, // Làm đậm h6 một chút
  },
  components: {
    MuiAppBar: {
      // Style mặc định cho AppBar (Navbar)
      defaultProps: {
         elevation: 0, // Bỏ shadow mặc định
         color: 'inherit', // Màu nền kế thừa từ background.paper (trắng)
      },
      styleOverrides: {
         root: ({ theme }) => ({
             backgroundColor: theme.palette.background.paper, // Nền trắng
             color: theme.palette.text.primary, // Chữ đen
             borderBottom: `1px solid ${theme.palette.divider}` // Thêm viền dưới
         }),
      }
    },
     MuiButton: {
        defaultProps: {
             disableElevation: true // Bỏ shadow cho nút contained
        },
        styleOverrides: {
            root: {
                textTransform: 'none', // Không viết hoa chữ nút
                borderRadius: 6 // Bo góc nhẹ
            },
             // containedPrimary: { // Style riêng cho nút màu chính
             //     color: '#fff' // Chữ trắng
             // }
        }
     },
     MuiCard: {
        defaultProps: {
             elevation: 0, // Bỏ shadow mặc định
        },
         styleOverrides: {
             root: ({ theme }) => ({
                 borderRadius: 8,
                 border: `1px solid ${theme.palette.divider}`, // Thêm viền nhẹ cho card
                 // transition: 'box-shadow 0.3s',
                 // '&:hover': { boxShadow: 3 } // Có thể bỏ hiệu ứng hover ở đây nếu muốn
             })
         }
     }
    // Thêm các tùy chỉnh khác nếu cần
  },
}, viVN); // Optional: Thêm locale tiếng Việt

export default theme;