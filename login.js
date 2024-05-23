const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const dotenv = require('dotenv');

// .env 파일 로드
dotenv.config();

passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID,
  callbackURL: process.env.KAKAO_CALLBACK_URL
},
function(accessToken, refreshToken, profile, done) {
  // 사용자 정보와 함께 done 호출
  return done(null, profile);
}));

// 세션에 사용자 정보 저장
passport.serializeUser(function(user, done) {
  done(null, user);
});

// 세션에서 사용자 정보 추출
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

module.exports = passport;
