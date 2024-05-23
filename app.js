const express = require('express');
const app = express();
const port = 3000;
const nodemailer = require('nodemailer');

const cookieParser = require('cookie-parser');
const USER_COOKIE_KEY = 'USER'; // 로그인 성공 시 할당할 쿠키 이름

require('dotenv').config();
const { GMAIL_OAUTH_USER, GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REFRESH_TOKEN } = process.env;

const fs = require('fs').promises;
const path = require('path'); // path 모듈을 상단으로 이동
const USERS_JSON_FILENAME = 'public/js/data/user.json';

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

app.get('/location', (req, res) => {
    res.sendFile(__dirname + '/location.html');
});

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
        if (user.nickname === nickname) {
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
        await sendMail(email, '예약판다 가입을 환영합니다!', `환영합니다, ${nickname} 님 :)`);
        const users = await fetchAllUsers();
        const newUser = {
            "index" : users.length + 1,
            "id" : email,
            "password" : password,
            "location" : location,
            "nickname" : nickname,
            "phone-number" : phoneNum,
            "review" : "",
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
    console.log('Reservation request received:', reservation); // 요청 로그 추가

    // 현재 로그인한 사용자 정보 가져오기 (쿠키 또는 세션에서)
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);

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

app.post('/submit-review', async (req, res) => {
    const userCookie = req.cookies[USER_COOKIE_KEY];
    if (!userCookie) {
        res.status(403).json({ success: false, message: "로그인이 필요합니다." });
        return;
    }

    const user = JSON.parse(userCookie);
    const { restaurantName, comment, date } = req.body;

    const users = await fetchAllUsers();
    const currentUserIndex = users.findIndex(u => u.id === user.id);

    if (currentUserIndex !== -1) {
        if (!users[currentUserIndex].reviews) {
            users[currentUserIndex].reviews = [];
        }
        users[currentUserIndex].reviews.push({ restaurantName, comment, date });
        await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
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

app.listen(port, () => console.log(`Page open in  port: ${port}`));
