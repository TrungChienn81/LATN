// Các pattern nhận diện prompt và regex trích xuất thông số sản phẩm
module.exports = [
  {
    name: 'card_do_hoa',
    keywords: [
      'card đồ hoạ', 'card do hoa', 'GPU', 'VGA', 'card màn hình', 'graphics card', 'video card', 'card đồ họa', 'card do hoa la', 'card đồ hoạ là', 'card đồ họa là', 'card là gì', 'card gì', 'card gì vậy', 'card gì thế', 'card gì nhỉ'
    ],
    regex: /(rtx|gtx|quadro|radeon|vega|iris|hd|mx|geforce|nvidia|amd|intel)[^,;\n\r]*/i,
    label: 'Card đồ hoạ'
  },
  {
    name: 'cpu',
    keywords: [
      'cpu', 'bộ vi xử lý', 'vi xử lý', 'processor', 'chip', 'core i', 'intel', 'amd', 'cpu là gì', 'cpu gì', 'cpu gì vậy', 'cpu gì thế', 'cpu gì nhỉ'
    ],
    regex: /(core\s*i[3579][- ]?\d{3,4}[a-zA-Z]*|i[3579][- ]?\d{3,4}[a-zA-Z]*|ryzen\s*\d+|intel\s*\w+|amd\s*\w+|apple\s*m[0-9]+|snapdragon\s*\w+)/i,
    label: 'CPU'
  },
  {
    name: 'ram',
    keywords: [
      'ram', 'bộ nhớ ram', 'ram là gì', 'ram gì', 'ram gì vậy', 'ram gì thế', 'ram gì nhỉ'
    ],
    regex: /(\d{2,4}\s*gb\s*ram|ram\s*\d{2,4}\s*gb|\d{2,4}gb\s*ram|ram\s*\d{2,4}gb|\d{2,4}\s*gb)/i,
    label: 'RAM'
  },
  {
    name: 'man_hinh',
    keywords: [
      'màn hình', 'screen', 'display', 'kích thước màn hình', 'inch', 'độ phân giải', 'tần số quét', 'hz', 'màn hình là gì', 'màn hình gì', 'màn hình gì vậy', 'màn hình gì thế', 'màn hình gì nhỉ'
    ],
    regex: /(\d{2,3}(\.\d)?\s*inch|inch|wuxga|qhd\+|qhd|uhd|fhd|4k|oled|ips|tn|va|tần số quét\s*\d{2,3}\s*hz|\d{2,3}\s*hz)/i,
    label: 'Màn hình'
  },
  {
    name: 'o_cung',
    keywords: [
      'ổ cứng', 'ssd', 'hdd', 'storage', 'dung lượng', 'ổ cứng là gì', 'ổ cứng gì', 'ổ cứng gì vậy', 'ổ cứng gì thế', 'ổ cứng gì nhỉ'
    ],
    regex: /(\d{3,4}\s*gb|\d{1,2}\s*tb|ssd|hdd)/i,
    label: 'Ổ cứng'
  }
]; 