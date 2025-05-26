const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const axios = require('axios');

// Cấu hình passport với Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
  scope: ['profile', 'email', 
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/user.birthday.read',
    'https://www.googleapis.com/auth/user.gender.read',
    'https://www.googleapis.com/auth/userinfo.profile']  // Thêm quyền để lấy thông tin số điện thoại
}, async (accessToken, refreshToken, profile, done) => {
  // Đây là phần lưu thông tin người dùng vào session
  try {
    // Gọi Google People API để lấy thêm birthday và gender
    const response = await axios.get(
      'https://people.googleapis.com/v1/people/me?personFields=genders,birthdays',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const extra = response.data;
    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
      picture: profile.photos?.[0]?.value,
      gender: extra.genders?.[0]?.value ?? null,
      birthday: extra.birthdays?.[0]?.date ?? null
    };
    

    return done(null, user);
  } catch (err) {
    console.error('Lỗi lấy thêm thông tin:', err);
    return done(err, profile); // fallback dùng profile bình thường
  }
}));
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos'] // lấy dữ liệu cần
}, (accessToken, refreshToken, profile, done) =>{

  const user = {
    id: profile.id,
    displayName: profile.displayName,
    picture: profile.photos?.[0]?.value || '',
  };
  return done(null, user);
}));


// Lưu trữ thông tin người dùng vào session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;