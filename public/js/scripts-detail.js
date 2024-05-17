// URL에서 식당 id 추출하기 위한 변수
const searchParams = new URL(location.href);
const path = searchParams.pathname.split('/');

// 식당 id
const id = path[path.length -1];

// 식당 id에 맞게 내용 구성하는 코드
document.addEventListener("DOMContentLoaded", () => {
    fetch('js/data/restaurant.json')
    .then(res => res.json())
    .then(data => {
        // id에 해당하는 식당 데이터
        const restaurantData = data[id-1];

        // (식당 이름 위) 키워드 추출
        restaurantData.additionalServices.forEach(elem => {
            const span = document.createElement('span');
            span.style.marginRight = "15px";
            span.textContent = `#${elem}`;

            const holder = document.querySelector("#keyword-holder");
            holder.appendChild(span);
        })

        // 태그 추출
        restaurantData.tag.forEach(elem => {
            const tag = document.createElement('span');
            tag.style.marginRight = "15px";
            tag.textContent = `${elem}`;

            const holder = document.querySelector("#keyword-holder");
            holder.appendChild(tag);
        })
        
        // 식당 이름
        const name = document.querySelector("#restaurantName");
        name.textContent = `${restaurantData.name}`;

        // 영업 시간
        const hour = document.querySelector("#hours");
        hour.textContent = `${restaurantData.businessHours}`;

        // 주소
        const location = document.querySelector("#location");
        location.textContent = `${restaurantData.location}`;

        // 주의사항
        const note = document.querySelector("#notes");
        note.textContent = `${restaurantData.specialNotes}`

        // contact - 1)식당 전화번호
        const phone = document.querySelector("#contact-phone");
        phone.textContent = `${restaurantData.contact.phone}`;

        // 메뉴 추출해 아래 타일식으로 제공
        restaurantData.menus.forEach(elem => {
            const container = document.createElement('div');
            container.className = "col mb-5";
            container.innerHTML = `
            <div class="card h-100">
                <img class="card-img-top" src="https://dummyimage.com/450x300/dee2e6/6c757d.jpg" alt="..." />
                <div class="card-body p-4">
                    <div class="text-center">
                        <h5 class="fw-bolder">${elem.name}</h5>
                        ${elem.price}
                    </div>
                </div>
                <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                    <div class="text-center"><a class="btn btn-outline-dark mt-auto" href="#book">
                            Book a table
                    </a></div>
                </div>
            </div>`;
            
            const holder = document.querySelector("#menu-holder");
            holder.appendChild(container);
        });
        // 메뉴 상세 정보 보기 버튼 클릭 이벤트 처리
        document.querySelectorAll('.menu-detail-btn').forEach(button => {
            button.addEventListener('click', event => {
                const menuId = event.target.getAttribute('data-menu-id');
                fetchMenuDetail(menuId);
            });
        });
    });
});

// FatSecret API를 호출하여 메뉴 상세 정보를 가져오는 함수
function fetchMenuDetail(menuId) {
    // Access Token 얻기 (이미 있는 토큰을 사용하거나 새로 얻어야 합니다)
    const access_token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ4NDUzNUJFOUI2REY5QzM3M0VDNUNBRTRGMEJFNUE2QTk3REQ3QkMiLCJ0eXAiOiJhdCtqd3QiLCJ4NXQiOiJTRVUxdnB0dC1jTno3Rnl1VHd2bHBxbDkxN3cifQ.eyJuYmYiOjE3MTU5MDk0NDUsImV4cCI6MTcxNTk5NTg0NSwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5mYXRzZWNyZXQuY29tIiwiYXVkIjoiYmFzaWMiLCJjbGllbnRfaWQiOiIzMzI4MGQ1NDBjYWY0MGI1YTA5MTM1ZTU1OTlhNGIzZCIsInNjb3BlIjpbImJhc2ljIl19.sHG2Y7FZrnfLsA0TSK3RBAxuagCanspZySUYlcRZKPpB1eR_VLDh_tOl_LvmTCnAYBN99DBK7uvC2wzEP8Ctmmhz4afgXGX2XOPuDoBes0AftWXRUNzOvqx0Bq7e8XLL4sDaO9Y5XJDIMDTA4_ACwNYovs8W5p_NfY78FKCgZQ5fOQ10jZsKjIdKTFy2rOH44HbgRFcVOB1URyahz_OsoVupPKM0u_SYrCAB_k7YwJuWFTJFi9LtId6LuIRisGYwD3UvBZ3c4oFDll3Xb8mQBYDKNkEoT5o6uFERXVkDrNJSU7KW2vCSvG7ifDhDJKoT3a-12DXJ2KUqCEcp42xlCg'

    // FatSecret API 엔드포인트 및 매개변수
    const url = 'https://platform.fatsecret.com/rest/server.api';
    const headers = {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
    };
    const params = {
        'method': 'food.get.v2',
        'food_id': menuId,
        'format': 'json'
    };

    // API 요청 보내기
    fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => {
        showMenuDetail(data);
    })
    .catch(error => {
        console.error('Error fetching menu detail:', error);
    });
}

// 메뉴 상세 정보를 표시하는 함수
function showMenuDetail(data) {
    const food = data.food;
    const modal = document.querySelector("#menuDetailModal");

    // 모달 내용 설정
    modal.querySelector(".modal-title").textContent = food.name;
    modal.querySelector(".modal-body").innerHTML = `
        <p>칼로리: ${food.calories} kcal</p>
        <p>지방: ${food.fat} g</p>
        <p>탄수화물: ${food.carbohydrate} g</p>
        <p>단백질: ${food.protein} g</p>
    `;

    // 모달 표시
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}
