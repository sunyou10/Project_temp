// 쿠키를 읽는 헬퍼 함수
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// URL에서 식당 id 추출하기 위한 변수
const searchParams = new URL(location.href);
const path = searchParams.pathname.split('/');

// 식당 id
const id = path[path.length - 1];

// 식당 id에 맞게 내용 구성하는 코드
document.addEventListener("DOMContentLoaded", () => {
    fetch('js/data/restaurant.json')
    .then(res => res.json())
    .then(data => {
        // id에 해당하는 식당 데이터
        const restaurantData = data[id-1];

        // 이미지 설정
        const imageHolder = document.querySelector("#restaurant-image");
        const img = document.createElement('img');
        img.className = "card-img-top mb-5 mb-md-0";
        img.src = restaurantData.image ? restaurantData.image : "https://dummyimage.com/600x700/dee2e6/6c757d.jpg";
        img.alt = "Restaurant Image";
        imageHolder.appendChild(img);

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
                <img class="card-img-top" src="${elem.image}" alt="" height="240" />
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
            const starRating = Math.round(elem.rating * 2)/2;
            full = Math.floor(starRating);
            half = starRating % 1 !== 0 ? 1 : 0;

            for(let i=0; i < full; i++){
                container.innerHTML += `<i class="bi bi-star-fill text-warning"></i> `;
            }
            if(half === 1) container.innerHTML += `<i class="bi bi-star-half text-warning"></i>`;
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
        });

        // 즐겨찾기 버튼 기능 추가
        const favoriteButton = document.querySelector("#favorite-button");
        let userFavorites = [];
        let isFavorite = false;
        
        let userCookie = getCookie("USER");
        try {
            const decodedUserCookie = decodeURIComponent(userCookie);
            const userEmail = JSON.parse(decodedUserCookie).id;
            fetch('js/data/user.json')
                .then(res => res.json())
                .then(users => {
                    const user = users.find(u => u.id === userEmail);
                    if (user) {
                        userFavorites = user.favorites;
                        isFavorite = userFavorites.includes(restaurantData.name);
                        updateFavoriteButton(isFavorite);
                    }
                });

            favoriteButton.addEventListener("click", () => {
                if (isFavorite) {
                    if (confirm('이미 즐겨찾기가 된 식당이에요. 즐겨찾기를 삭제하시겠어요?')) {
                        updateFavoriteStatus(userEmail, restaurantData.name, 'remove');
                    }
                } else {
                    updateFavoriteStatus(userEmail, restaurantData.name, 'add');
                }
            });
        } catch (error) {
            console.error('Error parsing user cookie:', error);
        };

        function updateFavoriteButton(isFavorite) {
            if (isFavorite) {
                favoriteButton.innerHTML = '<i class="bi bi-heart-fill"></i>';
            } else {
                favoriteButton.innerHTML = '<i class="bi bi-heart"></i>';
            }
        };

        function updateFavoriteStatus(email, favorite, action) {
            fetch('/update-favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, favorite, action })
            })
            .then(res => res.json())
            .then(response => {
                if (response.message === 'Favorite added successfully') {
                    alert(`${restaurantData.name} 식당을 즐겨찾기 했어요!`);
                    isFavorite = true;
                } else if (response.message === 'Favorite removed successfully') {
                    alert(`나중에 다시 찾아와주세요~`);
                    isFavorite = false;
                } else {
                    alert(response.message);
                }
                updateFavoriteButton(isFavorite);
            })
            .catch(error => {
                console.error('Error updating user favorites:', error);
            });
        }
                //체크 버튼
        const checkTimeButton = document.getElementById('check-time-button');
        checkTimeButton.addEventListener('click', () => {
            const userCookie = document.cookie.split('; ').find(row => row.startsWith('USER='));
            if (!userCookie) {
                alert('로그인이 필요합니다.');
                return;
            }
            
            const userEmail = JSON.parse(decodeURIComponent(userCookie.split('=')[1])).id;
    
            fetch(`/time-to-reservation?email=${userEmail}`)
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert(data.message);
                    } else {
                        alert(`예약까지 남은시간: ${data.days}일 ${data.hours}시간 ${data.minutes}분 ${data.seconds}초`);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });

        // 예약 일괄 삭제
        const allRemoveButton = document.getElementById('all-remove-button');
        allRemoveButton.addEventListener('click', () => {
            const userCookie = document.cookie.split('; ').find(row => row.startsWith('USER='));
            if (!userCookie) {
                alert('로그인이 필요합니다.');
                return;
            }
    
            const userEmail = JSON.parse(decodeURIComponent(userCookie.split('=')[1])).id;
            const restaurantId = window.location.pathname.split('/').pop();
            if (confirm('정말로 이 식당의 예약을 전부 삭제하시겠습니까?')) {
                fetch('/delete-all-reservations', {

                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: userEmail, restaurantId: restaurantId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message);
                    } else {
                        alert(`${data.message}` ||'예약 삭제 중 문제가 발생했습니다.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        });
    });
});

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
        restaurantId: id
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
            alert(result.message ||'Reservation failed. Please try again.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert(error.message || 'Reservation failed. Please try again.');
    })
});

window.addEventListener("load", () => {
    if(document.cookie.includes('USER')){
        const button = document.querySelector("#login-button");
        button.onclick = () => {location.href='/logout';};
        button.innerHTML = `<i class="bi-person-circle me-1"></i>Logout`;

        const mypage = document.querySelector("#hidden-item");
        mypage.style.visibility = "visible";

        const favoriteButton = document.querySelector("#favorite-button");
        favoriteButton.style.visibility = "visible";
    }
});

document.addEventListener('DOMContentLoaded', function() {
    checkReservationTime();
});

function checkReservationTime() {
    const userCookie = document.cookie.split('; ').find(row => row.startsWith('USER='));
    if (!userCookie) return;
    
    const userEmail = JSON.parse(decodeURIComponent(userCookie.split('=')[1])).id;
    fetch(`/time-to-reservation?email=${userEmail}`)
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Reservation time has already passed.') {
                const reviewButtonContainer = document.createElement('div');
                reviewButtonContainer.innerHTML = `
                    <button type="button" class="btn btn-primary" onclick="location.href='/review'" style="margin-left: 10px;">
                        후기 작성하러 가기!
                    </button>`;
                document.querySelector('.d-flex').appendChild(reviewButtonContainer);
            }
        })
        .catch(error => console.error('Error:', error));
}
