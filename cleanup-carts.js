const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://TrungChienn:Chien2004@latn.af6hwio.mongodb.net/LATNShop08?retryWrites=true&w=majority&appName=LATN')
.then(async () => {
  console.log('Connected to MongoDB');
  const Cart = mongoose.connection.collection('Carts');
  
  // Tìm tất cả cart có userId null
  const nullUserCarts = await Cart.find({ userId: null }).toArray();
  console.log('Found', nullUserCarts.length, 'carts with null userId');
  
  if (nullUserCarts.length > 0) {
    // Xóa tất cả cart có userId null
    const result = await Cart.deleteMany({ userId: null });
    console.log('Deleted', result.deletedCount, 'carts with null userId');
  }
  
  // Kiểm tra index
  const indexes = await Cart.indexes();
  console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key })));
  
  mongoose.disconnect();
  console.log('Cleanup completed');
})
.catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  process.exit(1);
}); 