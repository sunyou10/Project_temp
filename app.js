const express = require('express');
const app = express();
const port = 3000;

const cookieParser = require('cookie-parser');
const USER_COOKIE_KEY = 'USER'; // 로그인 성공 시 할당할 쿠키 이름

const fs = require('fs').promises;
const USERS_JSON_FILENAME = 'public/js/data/user.json';

async function fetchAllUsers() {
    // 모든 유저 데이터 가져오기
    const data = await fs.readFile(USERS_JSON_FILENAME);
    const users = JSON.parse(data.toString());
    return users;
}

async function fetchUser(userEmail) {
    // userEmail이 유저 데이터 내에 있는지 확인
    const users = await fetchAllUsers();
    const user = users.find((user) => user.id === userEmail);
    return user;
}

async function createUser(newUser) {
    // 새로운 유저 추가
    const users = await fetchAllUsers();
    users.push(newUser);
    await fs.writeFile(USERS_JSON_FILENAME, JSON.stringify(users, null, '\t'));
}

app.use(express.static('public'));
app.use('/restaurant',express.static('public'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.get('/location', (req, res) => {
    res.sendFile(__dirname+'/location.html')
});

// 로그인
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');  
});

app.post('/submit-your-login-form', async (req, res) => {
    // 로그인 서버 기능
    const { email, password } = req.body;
    const user = await fetchUser(email);

    if(!user) {
        res.status(400).json({success : false, message: "가입하지 않은 이메일입니다."});
        return ;
    }
    if(password !== user.password) {
        res.status(400).send({success : false, message: "잘못된 패스워드입니다."});
        return ;
    }
    
    // 이메일, 비밀번호 다 맞으면 쿠키 할당
    res.cookie(USER_COOKIE_KEY, JSON.stringify(user)).json({success:true});
});

// 로그아웃
app.get('/logout', (req, res) => {
    res.clearCookie(USER_COOKIE_KEY);
    res.redirect('/');
})

// 비밀번호 찾기
app.get('/reset-password', (req, res) => res.sendFile(__dirname + '/find-password.html'));

app.post('/submit-your-findPw-form', async (req, res) => {
    // 비밀번호 찾기 서버 기능
    const { email, nickname, phoneNum } = req.body;
    const user = await fetchUser(email);

    if(!user) {
        res.json({success : false});
        return ;
    } else{
        if(user.nickname === nickname) {
            res.json({success: true, password: `${user.password}`});
            return;
        } else {
            res.json({success : false});
            return ;
        }
    }
})

// 회원가입
app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/signup.html');
});

app.post('/submit-your-register-form', async (req, res) => {
    // 회원가입 서버 기능
    const { email, password, nickname, phoneNum, location} = req.body;
    const user = await fetchUser(email);

    if(user) {
       // 이미 존재하는 이메일
       res.status(200).json({success : false});
       return; 
    }
    else {
        const users = await fetchAllUsers();
        const newUser = {
            "index" : users.length + 1,
            "id" : email,
            "password" : password,
            "location" : location,
            "nickname" : nickname,
            // "phone-number" : phoneNum,
            "review" : "",
            "favorites" : []
        };
        await createUser(newUser);
        res.status(200).json({success : true});
        return;
    }
})

app.get('/restaurant/:id', (req, res) => {;
    res.sendFile(__dirname + "/detail.html");
});


app.listen(port, () => console.log(`Page open in  port: ${port}`));