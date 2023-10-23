document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const searchAbbreviation = document.getElementById("searchAbbreviation");
    const searchFull = document.getElementById("searchFull");
    const resultsContainer = document.getElementById("searchResults");

    // 入力フィールドの入力イベントを監視
    searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value.toLowerCase();

        fetch("https://yuzki.github.io/test/ewaia.json")
            .then(response => response.json())
            .then(data => {
                resultsContainer.innerHTML = "";

                for (const key in data) {
                    const items = data[key];
                    for (const item of items) {
                        if ((searchAbbreviation.checked && item.abbreviation.toLowerCase().includes(searchTerm)) || (searchFull.checked && item.full.toLowerCase().includes(searchTerm))) {
                            // Bootstrapのカードを使用して結果を表示
                            const card = document.createElement("div");
                            card.classList.add("card");
                            const cardHeader = document.createElement("div");
                            cardHeader.classList.add("card-header");
                            cardHeader.textContent = item.abbreviation;
                            const cardBody = document.createElement("div");
                            cardBody.classList.add("card-body");
                            const cardTitle = document.createElement("h5");
                            cardTitle.classList.add("card-title");
                            cardTitle.textContent = item.full;
                            const cardText = document.createElement("p");
                            cardText.classList.add("card-text");
                            cardText.textContent = item.type;

                            cardBody.appendChild(cardTitle);
                            cardBody.appendChild(cardText);
                            card.appendChild(cardHeader);
                            card.appendChild(cardBody);
                            resultsContainer.appendChild(card);
                        }
                    }
                }
            });
    });
});
