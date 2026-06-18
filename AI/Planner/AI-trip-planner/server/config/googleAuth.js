import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔁 Google OAuth triggered');
        console.log('Profile:', profile);

        // Extract fields from Google profile
        const email = profile.emails?.[0]?.value || '';
        const name = profile.displayName || 'Google User';
        const picture = profile.photos?.[0]?.value || null;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
          // Create new user if not exists
          user = new User({
            googleId: profile.id,
            email,
            name,
            picture
          });
          await user.save();
          console.log('🆕 New Google user created:', user.email);
        } else {
          // Update googleId, picture, name if missing
          if (!user.googleId) user.googleId = profile.id;
          if (!user.picture) user.picture = picture;
          if (!user.name) user.name = name;
          await user.save();
          console.log('✅ Existing Google user:', user.email);
        }

        // Pass the user to passport
        done(null, user);
      } catch (err) {
        console.error('❌ Google OAuth error:', err);
        done(err, null);
      }
    }
  )
);

// Minimal serialize/deserialize for JWT usage
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;