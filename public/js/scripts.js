// index.html에 전체 식당 정보 뿌리기
document.addEventListener("DOMContentLoaded", () => {
    fetch('./js/data/restaurant.json')  // js/data/restaurant.json 파일에 대한 GET 요청
        .then(res => res.json())    // 응답을 json 형태로 반환
        .then(data => {
            data.forEach(element => {
                // json 포맷의 응답 데이터를 순회하며 html에 요소로 추가
                const container = document.querySelector(".justify-content-center");
                
                const content = document.createElement('div');
                content.className = 'col mb-5';
                let inner = `
                <div class="card h-100">
                    <img class="card-img-top" src="https://dummyimage.com/450x300/dee2e6/6c757d.jpg" alt="..." />
                    <div class="card-body p-4">
                        <div class="text-center">
                            <h5 class="fw-bolder">${element.name}</h5>
                            <div class="d-flex justify-content-center small text-warning mb-2">
                                <div class="bi-star-fill"></div>
                                <span class="text-muted">${element.rating}</span>
                            </div>
                            ${element.location}
                        </div>
                    </div>
                    <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                        <div class="text-center"><a class="btn btn-outline-dark mt-auto" href="${element.id}">View details</a></div>
                    </div>
                `

                if(element.additionalServices.includes("주차 가능")) inner += `<div class="badge bg-dark text-white position-absolute" style="top: 0.5rem; right: 0.5rem">Parking</div>`;
                inner += `</div>`;
                content.innerHTML = inner;
                container.appendChild(content);
            });
        });
});
