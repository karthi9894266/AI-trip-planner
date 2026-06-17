import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  hotelName: String,
  address: String,           // 🏨 Human-readable address
  cityCode: String,          // 🏙️ City like NYC, LON, etc.
  checkInDate: String,
  checkOutDate: String,
  price: String,
  currency: String,          // 💵 Like USD, EUR
  dateSaved: { type: Date, default: Date.now }
});

export default mongoose.model('Hotel', hotelSchema);