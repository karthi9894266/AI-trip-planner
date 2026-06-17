import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: { 
    type: String, 
    required: function() {
      // Only require password if googleId is not present (for email/password registration)
      return !this.googleId;
    }
  },
  name: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);