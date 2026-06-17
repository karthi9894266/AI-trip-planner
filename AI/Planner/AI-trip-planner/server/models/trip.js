import mongoose from 'mongoose'; // Changed require to import

const TripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    origin: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    numberOfDays: { type: Number },

    groupType: { type: String },
    preferences: [String],
    hotelBudget: { type: String },
    hotelAmenities: [String],
    transportOptions: [String],
    foodInterests: [String],
    specialRequirements: [String],
    notes: { type: String },

    itinerary: { type: String }, // AI-generated itinerary

    flight: {
      from: { type: String },
      to: { type: String },
      price: { type: String }
    },

    hotel: {
      name: { type: String },
      address: { type: String },
      price: { type: String }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Trip', TripSchema);