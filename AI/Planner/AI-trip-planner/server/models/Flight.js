import mongoose from 'mongoose';

const flightSchema = new mongoose.Schema({
  totalPrice: String,
  departureCity: String,
  arrivalCity: String,
  dateSaved: { type: Date, default: Date.now }
});

export default mongoose.model('Flight', flightSchema);