// URL에서 식당 id 추출하기 위한 변수
const searchParams = new URL(location.href);
const path = searchParams.pathname.split('/');

// 식당 id
const id = path[path.length - 1];

// 식당 id에 맞게 내용 구성하는 코드
document.addEventListener("DOMContentLoaded", () => {
    fetch('/js/data/restaurant.json')
        .then(res => res.json())
        .then(data => {
            // id에 해당하는 식당 데이터
            const restaurantData = data.find(restaurant => restaurant.id === id);

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
            })

            // 후기 추출
            restaurantData.reviews.forEach(elem => {
                const container = document.createElement('div');
                container.className = "review-container";
                
                // 별점만큼 별 달기
                const starRating = Math.round(elem.rating * 2) / 2;
                const full = Math.floor(starRating);
                const half = starRating % 1 !== 0 ? 1 : 0;

                for (let i = 0; i < full; i++) {
                    container.innerHTML += `<i class="bi bi-star-fill text-warning"></i> `;
                }
                if (half === 1) container.innerHTML += `<i class="bi bi-star-half text-warning"></i>`;
                container.innerHTML += `<span class="text-warning"> ${starRating}<span>`;

                container.innerHTML += `
                    <hr>
                    <div>
                        <h5>${elem.author}</h5>
                        <p>${elem.comment}</p>
                        <p style="float:right">${elem.date}</p>
                    </div> 
                `;
                const holder = document.querySelector("#review");
                holder.appendChild(container);
            })

            // 예약 버튼 이벤트 리스너 추가
            document.getElementById('easyReservationButton').addEventListener('click', () => {
                const date = document.getElementById('reservationDate').value;
                const time = document.getElementById('reservationTime').value;
                const people = document.getElementById('reservationPeople').value;

                console.log("Reservation details:", { date, time, people });

                const reservationData = {
                    date,
                    time,
                    people,
                    restaurantId: id,
                    userId: JSON.parse(document.cookie.split('USER=')[1]).id // 현재 로그인한 사용자 ID 가져오기
                };

                console.log("Sending reservation data:", reservationData);

                fetch('/reserve', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reservationData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        alert('Reservation successful!');
                    } else {
                        alert('Reservation failed. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Reservation failed. Please try again.');
                });
            });
        });
});