import { FatSecretClient } from "fatsecret-api";

// FatSecretClient 인스턴스 초기화
const fatSecretClient = new FatSecretClient({
    clientId: "33280d540caf40b5a09135e5599a4b3d",
    clientSecret: "7ee76b09ceff49e4b178fb87af9f7b5e",
    scope: "basic",
});

// 음식 검색 함수
async function searchFood(searchQuery) {
    try {
        const searchResults = await fatSecretClient.getFoodSearch({ search_expression: searchQuery });
        return searchResults;
    } catch (error) {
        console.error('Error searching food:', error);
        throw error;
    }
}

// 음식 상세 정보 가져오기 함수
async function getFoodDetails(foodId) {
    try {
        const foodDetails = await fatSecretClient.getFood({ food_id: foodId });
        return foodDetails;
    } catch (error) {
        console.error('Error getting food details:', error);
        throw error;
    }
}

// 메인 함수
(async () => {
    try {
        // 여기서 menu 이름 바꾸기
        const searchQuery = 'pasta';
        const searchResults = await searchFood(searchQuery);
        console.log('Search Results:', searchResults);

        // 첫 번째 검색 결과에서 음식 ID 추출
        const foodId = searchResults.foods.food[0].food_id;
        console.log(`Food ID: ${foodId}`);

        // 음식 상세 정보 가져오기
        const foodDetails = await getFoodDetails(foodId);
        console.log('Food Details:', foodDetails);

    } catch (error) {
        console.error('Error:', error);
    }
})();
