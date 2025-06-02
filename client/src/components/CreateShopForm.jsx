import React, { useState } from 'react';
import './CreateShopForm.css';

const CreateShopForm = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    address: '',
    email: '',
    phone: '+84',
    adminPassword: ''
  });

  // Form data cho địa chỉ vận chuyển
  const [addressData, setAddressData] = useState({
    fullName: '',
    phoneNumber: '',
    province: '',
    detailAddress: ''
  });

  const steps = [
    'Thông tin Shop',
    'Cài đặt vận chuyển'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate step 1
      if (!formData.shopName || !formData.email || !formData.phone || formData.phone === '+84' || !formData.adminPassword) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc bao gồm mật khẩu tạo shop');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Validate step 2 và submit
      if (!addressData.fullName || !addressData.phoneNumber || !addressData.province || !addressData.detailAddress) {
        alert('Vui lòng điền đầy đủ thông tin địa chỉ');
        return;
      }
      
      if (onSubmit) {
        setLoading(true);
        try {
          const combinedData = {
            ...formData,
            address: `${addressData.detailAddress}, ${addressData.province}`,
            shippingAddress: addressData
          };
          const result = await onSubmit(combinedData);
          if (result?.success) {
            // Success sẽ được handle bởi parent component (navigate)
          }
        } catch (error) {
          console.error('Error submitting form:', error);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleSave = () => {
    console.log('Saving data:', { formData, addressData });
    // TODO: Implement save draft functionality
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      // Step 1: Thông tin Shop
      return (
        <div className="form-fields" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Tên Shop */}
          <div className="field-row" style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr 100px',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div className="field-label" style={{
              textAlign: 'right',
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>
              <span className="required" style={{
                color: '#ee4d2d',
                marginRight: '4px'
              }}>*</span> Tên Shop
            </div>
            <div className="field-input" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleInputChange}
                className="input-field"
                maxLength={30}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
              />
            </div>
            <div className="field-info" style={{
              textAlign: 'right',
              fontSize: '13px',
              color: '#999'
            }}>
              <span className="char-count" style={{
                color: '#666'
              }}>{formData.shopName.length}/30</span>
            </div>
          </div>

          {/* Địa chỉ lấy hàng */}
          <div className="field-row" style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr 100px',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div className="field-label" style={{
              textAlign: 'right',
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>
              <span className="required" style={{
                color: '#ee4d2d',
                marginRight: '4px'
              }}>*</span> Địa chỉ lấy hàng
            </div>
            <div className="field-input address-field" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="input-field"
                placeholder=""
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
              />
              <button className="add-button" style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: '#1890ff',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>+ Thêm</button>
            </div>
            <div className="field-info"></div>
          </div>

          {/* Email */}
          <div className="field-row" style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr 100px',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div className="field-label" style={{
              textAlign: 'right',
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>
              <span className="required" style={{
                color: '#ee4d2d',
                marginRight: '4px'
              }}>*</span> Email
            </div>
            <div className="field-input" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Nhập vào"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
              />
            </div>
            <div className="field-info"></div>
          </div>

          {/* Số điện thoại */}
          <div className="field-row" style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr 100px',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div className="field-label" style={{
              textAlign: 'right',
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>
              <span className="required" style={{
                color: '#ee4d2d',
                marginRight: '4px'
              }}>*</span> Số điện thoại
            </div>
            <div className="field-input" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-field"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
              />
            </div>
            <div className="field-info"></div>
          </div>

          {/* Mật khẩu tạo shop */}
          <div className="field-row" style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr 100px',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div className="field-label" style={{
              textAlign: 'right',
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>
              <span className="required" style={{
                color: '#ee4d2d',
                marginRight: '4px'
              }}>*</span> Mật khẩu tạo shop
            </div>
            <div className="field-input" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="password"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Nhập mật khẩu do admin cung cấp"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
              />
            </div>
            <div className="field-info" style={{
              textAlign: 'left',
              fontSize: '12px',
              color: '#999'
            }}>
              Liên hệ admin để lấy mật khẩu
            </div>
          </div>
        </div>
      );
    } else if (currentStep === 1) {
      // Step 2: Cài đặt vận chuyển - Form địa chỉ
      return (
        <div className="address-form" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '16px'
          }}>Thêm Địa Chỉ Mới</h3>

          {/* Họ & Tên */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <label style={{
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>Họ & Tên</label>
            <input
              type="text"
              name="fullName"
              value={addressData.fullName}
              onChange={handleAddressChange}
              style={{
                padding: '12px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          {/* Số điện thoại */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <label style={{
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>Số điện thoại</label>
            <input
              type="tel"
              name="phoneNumber"
              value={addressData.phoneNumber}
              onChange={handleAddressChange}
              placeholder="Nhập vào"
              style={{
                padding: '12px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          {/* Địa chỉ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <label style={{
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>Địa chỉ</label>
            
            {/* Tỉnh/Thành phố dropdown */}
            <select
              name="province"
              value={addressData.province}
              onChange={handleAddressChange}
              style={{
                padding: '12px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
            >
              <option value="">Chọn</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Hải Phòng">Hải Phòng</option>
              <option value="Cần Thơ">Cần Thơ</option>
              <option value="An Giang">An Giang</option>
              <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
              <option value="Bạc Liêu">Bạc Liêu</option>
              <option value="Bắc Giang">Bắc Giang</option>
              <option value="Bắc Kạn">Bắc Kạn</option>
              <option value="Bắc Ninh">Bắc Ninh</option>
              <option value="Bến Tre">Bến Tre</option>
              <option value="Bình Dương">Bình Dương</option>
              <option value="Bình Phước">Bình Phước</option>
              <option value="Bình Thuận">Bình Thuận</option>
              <option value="Bình Định">Bình Định</option>
              <option value="Cà Mau">Cà Mau</option>
              <option value="Cao Bằng">Cao Bằng</option>
              <option value="Đắk Lắk">Đắk Lắk</option>
              <option value="Đắk Nông">Đắk Nông</option>
              <option value="Điện Biên">Điện Biên</option>
              <option value="Đồng Nai">Đồng Nai</option>
              <option value="Đồng Tháp">Đồng Tháp</option>
              <option value="Gia Lai">Gia Lai</option>
              <option value="Hà Giang">Hà Giang</option>
              <option value="Hà Nam">Hà Nam</option>
              <option value="Hà Tĩnh">Hà Tĩnh</option>
              <option value="Hải Dương">Hải Dương</option>
              <option value="Hậu Giang">Hậu Giang</option>
              <option value="Hòa Bình">Hòa Bình</option>
              <option value="Hưng Yên">Hưng Yên</option>
              <option value="Khánh Hòa">Khánh Hòa</option>
              <option value="Kiên Giang">Kiên Giang</option>
              <option value="Kon Tum">Kon Tum</option>
              <option value="Lai Châu">Lai Châu</option>
              <option value="Lâm Đồng">Lâm Đồng</option>
              <option value="Lạng Sơn">Lạng Sơn</option>
              <option value="Lào Cai">Lào Cai</option>
              <option value="Long An">Long An</option>
              <option value="Nam Định">Nam Định</option>
              <option value="Nghệ An">Nghệ An</option>
              <option value="Ninh Bình">Ninh Bình</option>
              <option value="Ninh Thuận">Ninh Thuận</option>
              <option value="Phú Thọ">Phú Thọ</option>
              <option value="Phú Yên">Phú Yên</option>
              <option value="Quảng Bình">Quảng Bình</option>
              <option value="Quảng Nam">Quảng Nam</option>
              <option value="Quảng Ngãi">Quảng Ngãi</option>
              <option value="Quảng Ninh">Quảng Ninh</option>
              <option value="Quảng Trị">Quảng Trị</option>
              <option value="Sóc Trăng">Sóc Trăng</option>
              <option value="Sơn La">Sơn La</option>
              <option value="Tây Ninh">Tây Ninh</option>
              <option value="Thái Bình">Thái Bình</option>
              <option value="Thái Nguyên">Thái Nguyên</option>
              <option value="Thanh Hóa">Thanh Hóa</option>
              <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
              <option value="Tiền Giang">Tiền Giang</option>
              <option value="Trà Vinh">Trà Vinh</option>
              <option value="Tuyên Quang">Tuyên Quang</option>
              <option value="Vĩnh Long">Vĩnh Long</option>
              <option value="Vĩnh Phúc">Vĩnh Phúc</option>
              <option value="Yên Bái">Yên Bái</option>
            </select>
          </div>

          {/* Địa chỉ chi tiết */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <label style={{
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>Địa chỉ chi tiết</label>
            <textarea
              name="detailAddress"
              value={addressData.detailAddress}
              onChange={handleAddressChange}
              placeholder="Số nhà, tên đường v.v"
              rows="3"
              style={{
                padding: '12px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="shop-registration-container" style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Progress Steps */}
      <div className="progress-container" style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '32px 0'
      }}>
        <div className="progress-content" style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div className="progress-steps" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'relative'
          }}>
            {steps.map((step, index) => (
              <div key={index} className="step-item" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative'
              }}>
                <div className="step-line-container" style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  position: 'relative'
                }}>
                  <div className={`step-circle ${index === currentStep ? 'current' : index < currentStep ? 'completed' : ''}`} style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: index === currentStep ? '#ee4d2d' : index < currentStep ? '#52c41a' : '#ddd',
                    color: index <= currentStep ? 'white' : '#666',
                    position: 'relative',
                    zIndex: 2,
                    transition: 'all 0.3s ease',
                    transform: index === currentStep ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: index === currentStep ? '0 2px 8px rgba(238, 77, 45, 0.3)' : 'none'
                  }}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                </div>
                <span className={`step-label ${index <= currentStep ? 'active' : ''}`} style={{
                  marginTop: '12px',
                  fontSize: '13px',
                  color: index <= currentStep ? '#ee4d2d' : '#666',
                  textAlign: 'center',
                  lineHeight: '1.3',
                  transition: 'all 0.3s ease',
                  fontWeight: index <= currentStep ? '500' : 'normal'
                }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="form-container" style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 24px'
      }}>
        <div className="form-box" style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          transition: 'box-shadow 0.3s ease'
        }}>
          <div className="form-content" style={{
            padding: '40px'
          }}>
            <h2 className="form-title" style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '32px'
            }}>{currentStep === 0 ? 'Thông tin Shop' : 'Cài đặt vận chuyển'}</h2>
            
            {renderStepContent()}
          </div>

          {/* Form Actions */}
          <div className="form-actions" style={{
            background: '#fafafa',
            padding: '24px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #f0f0f0'
          }}>
            <button 
              className="save-button"
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                background: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                color: '#333',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Lưu
            </button>
            <button 
              className="next-button"
              onClick={handleNext}
              disabled={loading}
              style={{
                padding: '10px 32px',
                background: loading ? '#ccc' : '#ee4d2d',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Đang xử lý...' : currentStep === 0 ? 'Tiếp theo' : 'Tạo Shop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateShopForm; 