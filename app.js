const express = require('express');
const app = express();
const port = 3000;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const nodemailer = require('nodemailer');
const moment = require('moment'); // moment.js 추가

const cookieParser = require('cookie-parser');
const USER_COOKIE_KEY = 'USER'; // 로그인 성공 시 할당할 쿠키 이름

require('dotenv').config();
const { GMAIL_OAUTH_USER, GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REFRESH_TOKEN } = process.env;

const fs = require('fs').promises;
const path = require('path'); // path 모듈을 상단으로 이동
const USERS_JSON_FILENAME = 'public/js/data/user.json';
const RESTAURANT_JSON_FILENAME = 'public/js/data/restaurant.json';

async function fetchAllUsers() {
    const data = await fs.readFile(USERS_JSON_FILENAME);
    const users = JSON.parse(data.toString());
    return users;
}

async function fetchUser(userEmail) {
    const users = await fetchAllUsers();
    const user = users.find((user) => user.id === userEmail);
    return user;
}

async function createUser(newUser) {
    const users = await fetchAllUsers();
    users.push(newUser);
    await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, '\t'));
}

// 전체 레스토랑 가져오는 로직
async function fetchAllRestaurants() {
    const data = await fs.readFile(RESTAURANT_JSON_FILENAME);
    const restaurants = JSON.parse(data.toString());
    return restaurants;
}

// 아이디로 레스토랑 일부 빼오는 로직
async function fetchRestaurant(restaurantId) {
    const restaurants = await fetchAllRestaurants();
    const restaurant = restaurants.find((restaurant) => restaurant.id === String(restaurantId));
    return restaurant;
}

// 현재 restaurant.json 내 후기 정보를 바탕으로 후기 평점을 계산하는 함수
async function updateStarRate(restaurantId) {
    const restaurants = await fetchAllRestaurants();
    const restaurantIndex = restaurants.findIndex(r => r.id === String(restaurantId));
    if (restaurantIndex === -1) throw new Error('Restaurant not found');
    const reviews = restaurants[restaurantIndex].reviews;

    let count = 0;
    reviews.forEach(review => count += review.rating );
    try {restaurants[restaurantIndex].rating = count / reviews.length ;}
    catch { restaurants[restaurantIndex].rating = 0;}
    await fs.writeFile(RESTAURANT_JSON_FILENAME, JSON.stringify(restaurants, null, '\t'));
    console.log(`Update Star-rate : ${restaurants[restaurantIndex].name} by rating ${restaurants[restaurantIndex].rating}`);
}

// 후기 데이터 추가하는 함수
async function createReview(restaurantId, newReview) {
    const restaurants = await fetchAllRestaurants();
    const restaurantIndex = restaurants.findIndex(r => r.id === String(restaurantId));
    if (restaurantIndex === -1) throw new Error('Restaurant not found');
    restaurants[restaurantIndex].reviews.push(newReview);

    await fs.writeFile(RESTAURANT_JSON_FILENAME, JSON.stringify(restaurants, null, '\t'));
    updateStarRate(restaurantId);
}

// id로 레스토랑 이름 조회하는 함수
async function fetchRestaurantName(restaurantId) {
    const restaurants = await fetchAllRestaurants();
    const restaurant = restaurants.find(r => r.id === String(restaurantId));
    return restaurant ? restaurant.name : '';
}

// 레스토랑 예약 내역 추가하는 함수
async function createReserve(restaurantId, newReserve) {
    const restaurants = await fetchAllRestaurants();
    const restaurantIndex = restaurants.findIndex(r => r.id === String(restaurantId));
    if (restaurantIndex === -1) throw new Error('Restaurant not found');

    // 이전의 예약과 중복 확인
    const reservations = restaurants[restaurantIndex].reservations;
    reservations.forEach(reservation => {
        if (reservation.date === newReserve.date && reservation.time === newReserve.time) throw new Error('A reservation at the same time');
    })

    reservations.push(newReserve);

    await fs.writeFile(RESTAURANT_JSON_FILENAME, JSON.stringify(restaurants, null, '\t'));
    console.log(`New Reservation! : ${restaurants[restaurantIndex].name}`);
}

// 레스토랑 예약 내역 삭제하는 함수
async function deleteReserve(restaurantId, userId) {
    const restaurants = await fetchAllRestaurants();
    const restaurantIndex = restaurants.findIndex(r => r.id === String(restaurantId));
    if (restaurantIndex === -1) throw new Error('Restaurant not found');

    let reservations = restaurants[restaurantIndex].reservations;
    const reservation = reservations.filter(r => r.email === userId);
    reservation.forEach(r => {
        reserveIndex = reservations.indexOf(r);
        console.log(reserveIndex);
        reservations.splice(restaurantIndex, 1);
    })
    await fs.writeFile(RESTAURANT_JSON_FILENAME, JSON.stringify(restaurants, null, '\t'));
    console.log('Delete Completion!');
}

// 일괄 삭제하는 함수
async function clearReserve(restaurantId, userId) {
    const restaurants = await fetchAllRestaurants();
    const restaurantIndex = restaurants.findIndex(r => r.id === String(restaurantId));
    if (restaurantIndex === -1) throw new Error('Restaurant not found');

    let reservations = restaurants[restaurantIndex].reservations;
    restaurants[restaurantIndex].reservations = reservations.filter(r => r.email !== userId);

    await fs.writeFile(RESTAURANT_JSON_FILENAME, JSON.stringify(restaurants, null, '\t'));
    console.log('Delete Completion!');
}

// 메일 보내는 함수
const sendMail = async (to, subject, html) => {
    const googleTransporter = await nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        secure: true,
        auth:{
            type:'OAuth2',
            user: GMAIL_OAUTH_USER,
            clientId: GMAIL_OAUTH_CLIENT_ID,
            clientSecret: GMAIL_OAUTH_CLIENT_SECRET,
            refreshToken: GMAIL_OAUTH_REFRESH_TOKEN,
        },
    });
    
    const mailOptions = {
        from: '"Reservation-Panda 🐼" <test@test.gmail.com>',
        to,
        subject,
        html
    };

    try{
        await googleTransporter.sendMail(mailOptions);
        console.log(`Mail have sent to ${ to }`);
    } catch(err){
        console.log(err);
    } finally {
        googleTransporter.close();
    }
};

app.use(express.static('public'));
app.use('/restaurant', express.static('public'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// 로그인
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.post('/submit-your-login-form', async (req, res) => {
    const { email, password } = req.body;
    const user = await fetchUser(email);

    if (!user) {
        res.status(400).json({ success: false, message: "가입하지 않은 이메일입니다." });
        return;
    }
    if (password !== user.password) {
        res.status(400).send({ success: false, message: "잘못된 패스워드입니다." });
        return;
    }

    // 이메일, 비밀번호 다 맞으면 쿠키 할당
    res.cookie(USER_COOKIE_KEY, JSON.stringify(user)).json({ success: true });
});

// 로그아웃
app.get('/logout', (req, res) => {
    res.clearCookie(USER_COOKIE_KEY);
    res.redirect('/');
})

// 비밀번호 찾기
app.get('/reset-password', (req, res) => res.sendFile(__dirname + '/find-password.html'));

app.post('/submit-your-findPw-form', async (req, res) => {
    const { email, nickname, phoneNum } = req.body;
    const user = await fetchUser(email);

    if (!user) {
        res.json({ success: false });
        return;
    } else {
        if (user.nickname === nickname && user['phone-number'] === phoneNum) {
            res.json({ success: true, password: `${user.password}` });
            return;
        } else {
            res.json({ success: false });
            return;
        }
    }
})

// 회원가입
app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/signup.html');
});

app.post('/submit-your-register-form', async (req, res) => {
    const { email, password, nickname, phoneNum, location } = req.body;
    const user = await fetchUser(email);

    if (user) {
        // 이미 존재하는 이메일
        res.status(200).json({ success: false });
        return;
    } else {
        await sendMail(email, '예약판다 가입을 환영합니다!', `
        <html>
        <body style ="width : 500px">
        <h1>${nickname}님 가입을 환영합니다 :) </h1>
        <hr/>
        <div>이름 : ${nickname}</div>
        <div>전화번호 : ${phoneNum}</div>
        </body>
        </html>
        `);
        const users = await fetchAllUsers();
        const newUser = {
            "index" : users.length + 1,
            "id" : email,
            "password" : password,
            "location" : location,
            "nickname" : nickname,
            "phone-number" : phoneNum,
            "review" : [],
            "favorites" : []
        };
        await createUser(newUser);
        res.status(200).json({ success: true });
        return;
    }
})

app.get('/restaurant/:id', (req, res) => {
    res.sendFile(__dirname + "/detail.html");
});

app.get('/mypage', (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/mypage.html');
});

app.get('/reviews', (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/reviews.html');
});

app.get('/favorites', (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/favorites.html');
});

app.get('/profile', (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/profile.html');
});

app.get('/review', (req, res) => {
    res.sendFile(__dirname + '/review.html');
})

app.post('/change-password', async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const { password } = req.body;
    const user = JSON.parse(userCookie);
    const users = await fetchAllUsers();
    const userIndex = users.findIndex((u) => u.id === user.id);
    
    if (userIndex > -1) {
        users[userIndex].password = password;
        await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 사용자 정보를 가져오는 엔드포인트
app.get('/get-user-info', (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    res.json({ name: user.id.split('@')[0], nickname: user.nickname, phoneNum: user['phone-number'], location: user.location });
});

// 사용자 정보를 업데이트하는 엔드포인트
app.post('/update-profile', async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    const { nickname, phoneNum, location, password } = req.body;
    const users = await fetchAllUsers();
    const userIndex = users.findIndex((u) => u.id === user.id);
    
    if (userIndex > -1) {
        if (nickname) users[userIndex].nickname = nickname;
        if (phoneNum) users[userIndex]['phone-number'] = phoneNum;
        if (location) users[userIndex].location = location;
        if (password) users[userIndex].password = password;
        await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 비밀번호 확인 엔드포인트
app.post('/verify-password', async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    const { password } = req.body;
    const users = await fetchAllUsers();
    const userIndex = users.findIndex((u) => u.id === user.id);

    if (userIndex > -1 && users[userIndex].password === password) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 회원 탈퇴 엔드포인트
app.post('/delete-account', async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    let users = await fetchAllUsers();
    users = users.filter((u) => u.id !== user.id);

    await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, 2));
    res.clearCookie(USER_COOKIE_KEY);
    res.json({ success: true });
});

app.post('/reserve', async (req, res) => {
    const reservation = req.body;

    // 레스토랑 이름 정보 추가
    const restaurant = await fetchRestaurant(reservation.restaurantId);
    reservation.restaurantName = restaurant.name;

    console.log('Reservation request received:', reservation); // 요청 로그 추가

    // 현재 로그인한 사용자 정보 가져오기 (쿠키 또는 세션에서)
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(200).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);

    if(reservation.email === undefined){
        reservation.email = user.id;
        reservation.name = user.nickname;
        reservation.phone = user["phone-number"];
    }

    // 중복 검사 이후, restaurant.json에 예약 정보 추가
    try {
        await createReserve(reservation.restaurantId, reservation);
        // user.json 파일을 읽어와서 해당 사용자의 예약 정보에 추가
        const users = await fetchAllUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            if (!users[userIndex].reservations) {
                users[userIndex].reservations = [];
            }
            users[userIndex].reservations.push(reservation);

            await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
        }
    }
    catch(error) { 
        console.log(`${error}`);
        res.status(200).json({ success: false, message: "[중복알림] 해당 일시엔 예약이 불가능합니다." });
    }
});

app.post('/update-favorites', async (req, res) => {
    const { email, favorite, action } = req.body;

    try {
        const users = await fetchAllUsers();
        const user = users.find(u => u.id === email);

        if (user) {
            if (action === 'add') {
                if (!user.favorites.includes(favorite)) {
                    user.favorites.push(favorite);
                    await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, 2), 'utf-8');
                    res.status(200).json({ message: 'Favorite added successfully' });
                } else {
                    res.status(400).json({ message: 'Favorite already exists' });
                }
            } else if (action === 'remove') {
                user.favorites = user.favorites.filter(item => item !== favorite);
                await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, 2), 'utf-8');
                res.status(200).json({ message: 'Favorite removed successfully' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating favorites:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/get-user-reviews', async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    const users = await fetchAllUsers();
    const currentUser = users.find(u => u.id === user.id);

    if (currentUser) {
        res.json({ reviews: currentUser.reviews || [] });
    } else {
        res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }
});


app.get('/get-user-favorites', async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    const users = await fetchAllUsers();
    const currentUser = users.find(u => u.id === user.id);

    if (currentUser) {
        res.json({ favorites: currentUser.favorites || [] });
    } else {
        res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }
});

app.get('/favorites', (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/favorites.html');
});

// 사용자 예약 정보를 가져오는 엔드포인트 추가
app.get('/get-user-reservations', async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    const users = await fetchAllUsers();
    const currentUser = users.find(u => u.id === user.id);

    if (currentUser) {
        res.json({ reservations: currentUser.reservations || [] });
    } else {
        res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }
});

// 예약 정보 페이지 제공 경로 추가
app.get('/reservations', (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/reservations.html');
});

// 예약 시간까지 남은 시간 계산
async function fetchUser(email) {
    const data = await fs.readFile('public/js/data/user.json');
    const users = JSON.parse(data);
    return users.find(user => user.id === email);
}

app.get('/time-to-reservation', async (req, res) => {
    const email = req.query.email;
    const user = await fetchUser(email);

    if (!user || !user.reservations || user.reservations.length === 0) {
        res.status(400).json({ message: '예약한 정보가 없어요.' });
        return;
    }

    const reservation = user.reservations[user.reservations.length -1];
    const reservationDate = moment(`${reservation.date} ${reservation.time}`, 'YYYY-MM-DD HH:mm');
    const now = moment();

    if (reservationDate.isBefore(now)) {
        res.status(400).json({ message: 'Reservation time has already passed.' });
    } else {
        const duration = moment.duration(reservationDate.diff(now));
        const days = duration.days();
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        res.json({
            days,
            hours,
            minutes,
            seconds
        });
    }
});

async function saveUsers(users) {
    await fs.writeFile('public/js/data/user.json', JSON.stringify(users, null, 2), 'utf-8');
}

// 해당 레스토랑 관련 예약 일괄 삭제
app.post('/delete-all-reservations', async (req, res) => {
    const email = req.body.email;
    const restaurantId = req.body.restaurantId;
    const data = await fs.readFile('public/js/data/user.json');
    const users = JSON.parse(data);

    const user = users.find(user => user.id === email);

    if (!user || !user.reservations || user.reservations.length === 0) {
        res.status(200).json({ success:false, message: '예약한 정보가 없어요.' });
        return;
    }
    
    if (user) {
        await deleteReserve(restaurantId, email);
        reservations = user.reservations;
        const reservation = reservations.filter(r => r.restaurantId === restaurantId);
            reservation.forEach(r => {
            reserveIndex = reservations.indexOf(r);
            reservations.splice(reserveIndex, 1);
        })
        await saveUsers(users);
        res.json({ success: true, message: '다음에 다시 예약해주세요~!!!' });
    } else {
        res.status(404).json({ success: false, message: 'User not found.' });
    }
});

app.post('/clear-all-reservations', async (req, res) => {
    const email = req.body.email;
    const data = await fs.readFile('public/js/data/user.json');
    const users = JSON.parse(data);
    const user = users.find(user => user.id === email);

    // 해당 사용자의 예약 정보가 존재하지 않는 경우
    if (!user || !user.reservations || user.reservations.length === 0) {
        res.status(200).json({ success:false, message: '예약한 정보가 없어요.' });
        return;
    }
    if (user) {
        const restaurants = await fetchAllRestaurants();
        HasReserve = restaurants.filter(r => r.reservations.length > 0);
        const reservations = HasReserve.map(r => r.reservations).flat();
        
        for (const reservation of reservations) {
            if (reservation.email === email) {
                await clearReserve(reservation.restaurantId, email);
            }
        }

        user.reservations = [];
        await saveUsers(users);
        res.json({ success: true, message: '다음에 다시 예약해주세요~!!!' });
    } else {
        res.status(404).json({ success: false, message: 'User not found.' });
    }
});

app.post('/api/restaurants', async (req, res) => {
    const { searchInput, selectedTags, selectedPriceRange, parkingAvailable } = req.body;
    const restaurants = await fetchAllRestaurants();

    const filteredData = restaurants.filter(restaurant => {
        const matchesName = restaurant.name.toLowerCase().includes(searchInput);
        const matchesLocation = restaurant.location.toLowerCase().includes(searchInput);
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => restaurant.tag.includes(tag));
        const matchesPrice = !selectedPriceRange || restaurant.priceRange === selectedPriceRange;
        const matchesParking = !parkingAvailable || restaurant.additionalServices.includes("주차 가능");

        return (matchesName || matchesLocation) && matchesTags && matchesPrice && matchesParking;
    });

    res.json(filteredData);
});

// 리뷰 제출하기
app.post('/submit-review', upload.array('photo', 5), async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    const { comment, keywords, rating, restaurantId } = req.body;
    console.log(req.body);
    const files = req.files;

    const newReview = {
        author: user.nickname,
        comment,
        rating: parseFloat(rating),
        date: new Date().toISOString().split('T')[0],
        keywords: keywords,
        photos: files.map(file => file.path),
        restaurantName: await fetchRestaurantName(restaurantId)
    };

    try {
        // restaurant.json에 추가
        await createReview(restaurantId, newReview);
        
        // user.json에 추가
        const users = await fetchAllUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex === -1) throw new Error('User not found');
        if (!users[userIndex].reviews) {
            users[userIndex].reviews = [];
        }
        users[userIndex].reviews.push(newReview);
        await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, '\t'));

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '후기 제출에 실패했습니다.' });
    }
});

app.listen(port, () => console.log(`Page open in  port: ${port}`));
