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
            span.style.marginRight = "10px";
            span.textContent = `#${elem}`;

            const holder = document.querySelector("#keyword-holder");
            holder.appendChild(span);
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

        // contact - 2)이메일
        const email = document.querySelector("#contact-email");
        email.textContent = `${restaurantData.contact.email}`;

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
                    <div class="text-center"><a class="btn btn-outline-dark mt-auto" href="#">View options</a></div>
                </div>
            </div>`;
            
            const holder = document.querySelector("#menu-holder");
            holder.appendChild(container);
        })
    });
});
