// Debug amount calculation
console.log('=== AMOUNT DEBUG ===');

// Test case 1: Laptop 59.99 triệu VND
const amount1 = 59.99; // triệu VND
const vnd1 = Math.round(amount1 * 1000000);
console.log(`${amount1} triệu VND = ${vnd1.toLocaleString()} VND`);

// Test case 2: Laptop 52.49 triệu VND (từ log)
const amount2 = 52.49; // triệu VND
const vnd2 = Math.round(amount2 * 1000000);
console.log(`${amount2} triệu VND = ${vnd2.toLocaleString()} VND`);

// Test case 3: Sản phẩm rẻ 1.5 triệu VND
const amount3 = 1.5; // triệu VND
const vnd3 = Math.round(amount3 * 1000000);
console.log(`${amount3} triệu VND = ${vnd3.toLocaleString()} VND`);

console.log('\n=== VNPay Amount Format ===');
console.log('VNPay vnp_Amount (VND):', vnd2);
console.log('Expected in VNPay URL: vnp_Amount=' + vnd2);

console.log('\n=== Tóm tắt ===');
console.log('✅ Đúng: 52.49 triệu VND → 52,490,000 VND');
console.log('❌ Sai:  52,490,000 × 100 = 5,249,000,000 (quá lớn)');
console.log('✅ Fix:  Dùng trực tiếp 52,490,000 cho vnp_Amount'); 