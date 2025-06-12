const API_BASE_URL = 'https://fantasyonline2.com/api/public';
        const API_KEY = process.env.API_KEY; // Replace with your actual key if needed
        let embeddedItemData = null; // Initialize as null

        // Mock data for demonstration (replace with your actual data loading)
        async function loadEmbeddedItemData() {
            try {
                console.log('Loading mock item data...');
                // Mock data structure - replace with your actual JSON loading
                embeddedItemData = [
                    {
                        "Item ID": "1",
                        "Name": "Iron Sword",
                        "Sprite-Link": "https://via.placeholder.com/48x48/4CAF50/white?text=🗡",
                        "Buy": "100",
                        "Sell": "50"
                    },
                    {
                        "Item ID": "2", 
                        "Name": "Health Potion",
                        "Sprite-Link": "https://via.placeholder.com/48x48/f44336/white?text=🧪",
                        "Buy": "25",
                        "Sell": "10"
                    },
                    {
                        "Item ID": "3",
                        "Name": "Magic Staff",
                        "Sprite-Link": "https://via.placeholder.com/48x48/9C27B0/white?text=🪄",
                        "Buy": "200",
                        "Sell": "100"
                    }
                ];
                console.log('Mock item data loaded:', embeddedItemData);
            } catch (error) {
                console.error('Error loading embedded item data:', error);
            }
        }

        loadEmbeddedItemData();

        let currentPage = 1;
        let totalPages = 1;
        let currentSort = 'TimeLeft';
        let currentDirection = 'DESC';
        let lastApiSearchTerm = '';
        let isLoading = false;
        let itemDatabase = null;
        let currentMarketListings = [];
        let currentlyDisplayedListings = [];
        let abortController = null;
        let showProfitableOnlyState = false;
        let isComprehensiveSearchActive = false;
        let comprehensiveSearchResults = [];
        let searchedPages = 0;
        let totalSearchPages = 0;
        let comprehensiveSearchAborted = false;
        let personalPrices = {};
        let selectedItemId = null;

        // DOM Elements
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const messageContainer = document.getElementById('message-container');
        const databaseStatus = document.getElementById('database-status');
        const resultsContainer = document.getElementById('results-container');
        const resultsGrid = document.getElementById('results-grid');
        const prevPageButton = document.getElementById('prev-page');
        const nextPageButton = document.getElementById('next-page');
        const currentPageSpan = document.getElementById('current-page');
        const totalPagesSpan = document.getElementById('total-pages');
        const itemDetailsColumn = document.getElementById('item-details-column');
        const detailsIcon = document.getElementById('details-icon');
        const detailsName = document.getElementById('details-name');
        const detailsRecentlyListedPrice = document.getElementById('details-recently-listed-price');
        const detailsBuyPrice = document.getElementById('details-buy-price');
        const detailsSellPrice = document.getElementById('details-sell-price');
        const detailsError = document.getElementById('details-error');
        const refreshButton = document.getElementById('refresh-button');
        const detailsPotentialProfit = document.getElementById('details-potential-profit');
        const detailsPersonalProfit = document.getElementById('details-personal-profit');
        const showProfitableButton = document.getElementById('show-profitable-only');
        const personalPriceInput = document.getElementById('details-personal-price');
        const searchProgressModal = document.getElementById('search-progress-modal');
        const searchProgressMessage = document.getElementById('search-progress-message');
        const searchProgressBar = document.getElementById('search-progress-bar');
        const cancelSearchButton = document.getElementById('cancel-search-button');

        // Mock localStorage functions for demo
        function loadPersonalPrices() {
            personalPrices = {};
            console.log("Loaded personal prices:", Object.keys(personalPrices).length);
        }

        function savePersonalPrice(itemId, price) {
            if (itemId == null) return;
            const stringItemId = String(itemId);
            const priceValue = price === '' ? null : parseFloat(price);

            if (priceValue === null || (!isNaN(priceValue) && priceValue >= 0)) {
                if (priceValue === null || price === '') {
                    delete personalPrices[stringItemId];
                } else {
                    personalPrices[stringItemId] = priceValue;
                }
                console.log("Saved personal price:", stringItemId, priceValue);
                displayResults(currentlyDisplayedListings);
                if (selectedItemId === stringItemId) {
                    displayItemDetails(itemId);
                }
            }
        }

        async function loadItemDatabase() {
            try {
                if (!embeddedItemData || embeddedItemData.length === 0) {
                    throw new Error("Embedded item data is missing or empty.");
                }
                itemDatabase = {};
                let validItems = 0;
                embeddedItemData.forEach(item => {
                    const itemIdStr = String(item["Item ID"]);
                    if (item["Item ID"] != null && itemIdStr !== '') {
                        itemDatabase[itemIdStr] = item;
                        validItems++;
                    }
                });
                console.log('Database loaded successfully:', validItems);
                return true;
            } catch (error) {
                console.error('Database load error:', error);
                return false;
            }
        }

        function findItemById(itemId) { 
            return itemDatabase?.[String(itemId)] || null; 
        }

        function formatNumber(num) { 
            return (num == null || isNaN(num)) ? 'N/A' : num.toLocaleString(); 
        }

        function formatPrice(price) { 
            return (price == null || price === "" || isNaN(price)) ? 'N/A' : `${formatNumber(price)} Coins`; 
        }

        function setGridLoading(loading) {
            if (loading) {
                resultsGrid.innerHTML = `<div class="loading-grid"><div class="loading-spinner"></div></div>`;
            }
        }

        // Mock search function for demo
        async function searchMarket(page = currentPage, term = searchInput.value.trim(), sort = currentSort, direction = currentDirection) {
            const isForComprehensive = isComprehensiveSearchActive;
            if (isLoading && !isForComprehensive) return { error: "Already loading" };

            isLoading = true;
            disableControls(true, isForComprehensive);
            if (!isForComprehensive) {
                setGridLoading(true);
                messageContainer.innerHTML = '';
            }
            lastApiSearchTerm = term;

            // Mock delay
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                // Mock market data
                const mockListings = [
                    { ItemDefinitionId: "1", Price: 30, Listed: Date.now() - 3600000, Duration: 24 },
                    { ItemDefinitionId: "2", Price: 15, Listed: Date.now() - 7200000, Duration: 24 },
                    { ItemDefinitionId: "3", Price: 80, Listed: Date.now() - 1800000, Duration: 24 },
                    { ItemDefinitionId: "1", Price: 35, Listed: Date.now() - 900000, Duration: 24 },
                    { ItemDefinitionId: "2", Price: 8, Listed: Date.now() - 5400000, Duration: 24 },
                    { ItemDefinitionId: "3", Price: 120, Listed: Date.now() - 2700000, Duration: 24 }
                ];

                const data = {
                    listings: mockListings,
                    pagination: { totalPages: 3 }
                };

                if (isForComprehensive) {
                    isLoading = false;
                    disableControls(false, isForComprehensive);
                    return data;
                }

                currentMarketListings = data.listings || [];
                if (data.pagination) {
                    totalPages = parseInt(data.pagination.totalPages) || 1;
                    currentPage = Math.min(page, totalPages);
                    currentPage = Math.max(1, currentPage);
                } else {
                    totalPages = 1; 
                    currentPage = 1;
                }
                updatePagination();
                applyClientSideFilter();
                resultsContainer.style.display = 'flex';
                return data;

            } catch (error) {
                console.error('Search error:', error);
                if (!isForComprehensive) {
                    showMessage('error', `Failed to fetch market data: ${error.message}`);
                    resultsGrid.innerHTML = `<div style="text-align:center; padding: 20px; color: red;">Error loading data.</div>`;
                    currentlyDisplayedListings = [];
                    itemDetailsColumn.style.display = 'none';
                    selectedItemId = null;
                    personalPriceInput.value = '';
                    personalPriceInput.disabled = true;
                    totalPages = 1; 
                    currentPage = 1;
                    updatePagination();
                }
                return { error: error.message };
            } finally {
                if (!isForComprehensive) {
                    isLoading = false;
                    disableControls(false, false);
                    abortController = null;
                }
            }
        }

        function applyClientSideFilter() {
            const filterText = searchInput.value.trim().toLowerCase();
            let listingsToFilter = isComprehensiveSearchActive ? comprehensiveSearchResults : currentMarketListings;

            if (!listingsToFilter) {
                currentlyDisplayedListings = [];
                resultsGrid.innerHTML = `<div style="text-align:center; padding: 20px;">No listings available.</div>`;
                return;
            }

            let filteredListings = listingsToFilter;
            if (filterText) {
                filteredListings = listingsToFilter.filter(item => {
                    if (!item || item.ItemDefinitionId == null) return false;
                    const dbItem = findItemById(item.ItemDefinitionId);
                    const itemName = dbItem ? dbItem.Name.toLowerCase() : `item #${item.ItemDefinitionId}`;
                    return itemName.includes(filterText);
                });
            }

            if (showProfitableOnlyState && !isComprehensiveSearchActive) {
                filteredListings = filteredListings.filter(item => isItemProfitable(item));
            }

            currentlyDisplayedListings = filteredListings;
            displayResults(filteredListings);

            let baseListingsCount = (isComprehensiveSearchActive ? comprehensiveSearchResults : currentMarketListings)?.length ?? 0;
            if (filteredListings.length === 0) {
                let message = "No listings found.";
                if (filterText && (showProfitableOnlyState && !isComprehensiveSearchActive)) {
                    message = `No profitable items match '${filterText}'.`;
                } else if (filterText) {
                    message = `No items match '${filterText}' in the current view.`;
                    if (isComprehensiveSearchActive) message = `No profitable items match '${filterText}'.`;
                } else if (showProfitableOnlyState && !isComprehensiveSearchActive) {
                    message = 'No profitable items found on this page.';
                } else if (baseListingsCount === 0 && !isLoading) {
                    message = 'No listings available for the current view. Try Refreshing.';
                }
                resultsGrid.innerHTML = `<div style="text-align:center; padding: 20px;">${message}</div>`;
            }
        }

        function isItemProfitable(item) {
            if (!item || item.ItemDefinitionId == null || item.Price == null) return false;
            const itemDefinitionId = String(item.ItemDefinitionId);
            const dbItem = findItemById(itemDefinitionId);

            if (dbItem && dbItem.Sell) {
                const sellPrice = (typeof dbItem.Sell === 'string' && dbItem.Sell !== '')
                    ? parseInt(dbItem.Sell.replace(/,/g, ''), 10) : dbItem.Sell;
                if (sellPrice && !isNaN(sellPrice) && sellPrice > item.Price) {
                    return true;
                }
            }
            const personalPrice = personalPrices[itemDefinitionId];
            if (personalPrice != null && !isNaN(personalPrice) && personalPrice > item.Price) {
                return true;
            }
            return false;
        }

        function displayResults(listingsToDisplay) {
            if (!listingsToDisplay) {
                resultsGrid.innerHTML = `<div style="text-align:center; padding: 20px;">Error displaying listings.</div>`;
                return;
            }

            if (listingsToDisplay.length === 0 && !isLoading) {
                if (resultsGrid.innerHTML === '') {
                    resultsGrid.innerHTML = `<div style="text-align:center; padding: 20px;">No listings match the current filters.</div>`;
                }
                return;
            }

            resultsGrid.innerHTML = '';
            listingsToDisplay.forEach(item => {
                if (!item || item.ItemDefinitionId == null || item.Price == null) {
                    console.warn("Skipping invalid listing item:", item); 
                    return;
                }

                const itemDefinitionId = String(item.ItemDefinitionId);
                const databaseItem = findItemById(itemDefinitionId);
                const itemName = databaseItem ? databaseItem.Name : `Item #${itemDefinitionId}`;
                const iconUrl = databaseItem ? databaseItem["Sprite-Link"] : null;

                // Profit Calculation
                let npcProfit = null, personalProfit = null;
                let isNpcProfitable = false, isPersonalProfitable = false;

                if (databaseItem && databaseItem.Sell) {
                    const sellPrice = (typeof databaseItem.Sell === 'string' && databaseItem.Sell !== '')
                        ? parseInt(databaseItem.Sell.replace(/,/g, ''), 10) : databaseItem.Sell;
                    if (sellPrice && !isNaN(sellPrice) && sellPrice > item.Price) {
                        isNpcProfitable = true;
                        npcProfit = sellPrice - item.Price;
                    }
                }
                const personalPrice = personalPrices[itemDefinitionId];
                if (personalPrice != null && !isNaN(personalPrice) && personalPrice > item.Price) {
                    isPersonalProfitable = true;
                    personalProfit = personalPrice - item.Price;
                }

                // Create item card
                const card = document.createElement('div');
                card.className = 'item-card';
                card.dataset.itemId = itemDefinitionId;

                // Add profit classes
                if (isNpcProfitable || isPersonalProfitable) {
                    card.classList.add('profitable-item');
                }
                if (isPersonalProfitable) {
                    card.classList.add('personal-price-highlight');
                }

                // Build profit indicators
                let profitIndicators = '';
                if (isNpcProfitable) {
                    profitIndicators += `<span class="profit-amount npc-profit">NPC +${formatNumber(npcProfit)}</span>`;
                }
                if (isPersonalProfitable) {
                    profitIndicators += `<span class="profit-amount personal-profit">Pers +${formatNumber(personalProfit)}</span>`;
                }

                card.innerHTML = `
                    <img src="${iconUrl || 'https://via.placeholder.com/48x48/ccc/666?text=?'}" 
                         class="item-icon" alt="${itemName}" 
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/48x48/ccc/666?text=?';">
                    <div class="item-name">${itemName}</div>
                    <div class="item-price">${formatNumber(item.Price)} Coins</div>
                    ${profitIndicators ? `<div class="profit-indicators">${profitIndicators}</div>` : ''}
                `;

                resultsGrid.appendChild(card);
            });
        }

        function displayItemDetails(itemId) {
            detailsError.style.display = 'none'; 
            detailsError.textContent = '';
            const stringItemId = String(itemId);
            selectedItemId = stringItemId;

            if (!itemDatabase) {
                detailsError.textContent = 'Error: Item database not available'; 
                detailsError.style.display = 'block';
                personalPriceInput.value = ''; 
                personalPriceInput.disabled = true; 
                return;
            }
            const dbItemInfo = findItemById(stringItemId);
            if (!dbItemInfo) {
                detailsError.textContent = `Error: Item #${stringItemId} not found in database`; 
                detailsError.style.display = 'block';
                selectedItemId = null; 
                personalPriceInput.value = ''; 
                personalPriceInput.disabled = true; 
                return;
            }

            const specificItemListings = currentlyDisplayedListings.filter(listing => String(listing.ItemDefinitionId) === stringItemId);
            let recentlyListedPriceStr = 'N/A';
            const prices = specificItemListings.map(listing => listing.Price).sort((a, b) => a - b);
            const lowestPrice = prices.length > 0 ? prices[0] : null;

            if (lowestPrice !== null) {
                recentlyListedPriceStr = formatPrice(lowestPrice);
            } else if (specificItemListings.length > 0) {
                const sortedByTime = [...specificItemListings].sort((a, b) => b.Listed - a.Listed);
                recentlyListedPriceStr = formatPrice(sortedByTime[0].Price);
            } else {
                recentlyListedPriceStr = 'N/A (Not in current view)';
            }

            let npcProfitStr = 'N/A', personalProfitStr = 'N/A';
            let npcProfitClass = '', personalProfitClass = '';
            const sellPrice = (typeof dbItemInfo.Sell === 'string' && dbItemInfo.Sell !== '') 
                ? parseInt(dbItemInfo.Sell.replace(/,/g, ''), 10) : dbItemInfo.Sell;

            if (sellPrice && !isNaN(sellPrice) && lowestPrice !== null) {
                if (lowestPrice < sellPrice) {
                    npcProfitStr = `+${formatNumber(sellPrice - lowestPrice)} Coins`; 
                    npcProfitClass = 'profit-positive';
                } else {
                    npcProfitStr = 'No profit'; 
                    npcProfitClass = 'profit-negative';
                }
            } else if (!lowestPrice) {
                npcProfitStr = 'N/A (No listing displayed)'; 
                npcProfitClass = 'profit-negative';
            }

            const personalPrice = personalPrices[stringItemId];
            if (personalPrice != null && !isNaN(personalPrice) && lowestPrice !== null) {
                if (lowestPrice < personalPrice) {
                    personalProfitStr = `+${formatNumber(personalPrice - lowestPrice)} Coins`; 
                    personalProfitClass = 'profit-positive';
                } else {
                    personalProfitStr = 'No profit'; 
                    personalProfitClass = 'profit-negative';
                }
            } else if (lowestPrice && personalPrice == null) {
                personalProfitStr = 'N/A (No personal price)'; 
                personalProfitClass = 'profit-negative';
            } else if (!lowestPrice && personalPrice != null) {
                personalProfitStr = 'N/A (No listing displayed)'; 
                personalProfitClass = 'profit-negative';
            }

            detailsIcon.src = dbItemInfo["Sprite-Link"] || 'https://via.placeholder.com/64x64/ccc/666?text=?'; 
            detailsIcon.onerror = () => { detailsIcon.src = 'https://via.placeholder.com/64x64/ccc/666?text=?'; }; 
            detailsIcon.alt = dbItemInfo.Name;
            detailsName.textContent = dbItemInfo.Name;
            detailsBuyPrice.textContent = formatPrice(dbItemInfo.Buy);
            detailsSellPrice.textContent = formatPrice(dbItemInfo.Sell);
            if (detailsRecentlyListedPrice) { 
                detailsRecentlyListedPrice.textContent = recentlyListedPriceStr; 
            }
            if (detailsPotentialProfit) { 
                detailsPotentialProfit.textContent = npcProfitStr; 
                detailsPotentialProfit.className = npcProfitClass; 
            }
            if (detailsPersonalProfit) { 
                detailsPersonalProfit.textContent = personalProfitStr; 
                detailsPersonalProfit.className = personalProfitClass; 
            }

            const savedPersonalPrice = personalPrices[selectedItemId];
            personalPriceInput.value = (savedPersonalPrice != null && !isNaN(savedPersonalPrice)) ? savedPersonalPrice : '';
            personalPriceInput.disabled = false;
            itemDetailsColumn.style.display = 'block';
        }

        function updatePagination() {
            currentPageSpan.textContent = currentPage;
            totalPagesSpan.textContent = totalPages;
            const disablePag = isLoading || isComprehensiveSearchActive;
            prevPageButton.disabled = currentPage <= 1 || disablePag;
            nextPageButton.disabled = currentPage >= totalPages || disablePag;
        }

        function showMessage(type, message, isDismissable = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `${type}-message`;
            const textNode = document.createTextNode(message + ' ');
            messageDiv.appendChild(textNode);

            if (isDismissable) {
                const dismissButton = document.createElement('button');
                dismissButton.textContent = 'Dismiss';
                dismissButton.style.marginLeft = '10px';
                dismissButton.onclick = () => messageDiv.remove();
                messageDiv.appendChild(dismissButton);
            }
            messageContainer.innerHTML = '';
            messageContainer.appendChild(messageDiv);
        }

        function disableControls(disable, isCompSearch = false) {
            searchButton.disabled = disable;
            refreshButton.disabled = disable;
            showProfitableButton.disabled = disable;
            searchInput.disabled = disable;

            prevPageButton.disabled = disable || (isComprehensiveSearchActive && !isCompSearch);
            nextPageButton.disabled = disable || (isComprehensiveSearchActive && !isCompSearch);

            if (disable && !isCompSearch) {
                refreshButton.innerHTML = 'Refreshing...<span class="refresh-spinner"></span>';
            } else if (!disable) {
                refreshButton.textContent = 'Refresh';
            }
        }

        // Mock comprehensive search
        async function performComprehensiveSearch() {
            if (isLoading) { 
                showMessage('info', 'Please wait for the current operation to finish.'); 
                return; 
            }

            isComprehensiveSearchActive = true;
            showProfitableOnlyState = true;
            comprehensiveSearchResults = [];

            showMessage('info', 'Comprehensive search is mocked in this demo. Showing sample profitable items.', true);
            
            // Mock profitable results
            comprehensiveSearchResults = [
                { ItemDefinitionId: "2", Price: 8, Listed: Date.now() - 5400000, Duration: 24 },
                { ItemDefinitionId: "1", Price: 30, Listed: Date.now() - 3600000, Duration: 24 }
            ];

            displayComprehensiveResults();
        }

        function displayComprehensiveResults() {
            currentlyDisplayedListings = comprehensiveSearchResults;
            displayResults(currentlyDisplayedListings);
            currentPage = 1; 
            totalPages = 1;
            updatePagination();

            const resultCount = comprehensiveSearchResults.length;
            showMessage('info', `Showing ${resultCount} profitable items found (mock data). Sorted by highest potential profit.`, true);

            showProfitableButton.classList.add('active');
            showProfitableButton.textContent = 'Reset Search';
            isComprehensiveSearchActive = true;
            disableControls(false, true);
        }

        function resetToNormalView() {
            console.log("Resetting to normal view...");
            isComprehensiveSearchActive = false;
            showProfitableOnlyState = false;
            comprehensiveSearchResults = [];

            showProfitableButton.classList.remove('active');
            showProfitableButton.textContent = 'Show Profitable Only';
            currentPage = 1;
            searchInput.value = lastApiSearchTerm || '';
            searchMarket();
        }

        // Event Listeners
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (isComprehensiveSearchActive) {
                applyClientSideFilter();
            } else {
                currentPage = 1;
                searchMarket();
            }
        });

        searchInput.addEventListener('input', () => { 
            applyClientSideFilter(); 
        });

        prevPageButton.addEventListener('click', function() {
            if (this.disabled || isComprehensiveSearchActive) return;
            if (currentPage > 1) { 
                currentPage--; 
                searchMarket(); 
            }
        });

        nextPageButton.addEventListener('click', function() {
            if (this.disabled || isComprehensiveSearchActive) return;
            if (currentPage < totalPages) { 
                currentPage++; 
                searchMarket(); 
            }
        });

        resultsGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.item-card');
            if (card && card.dataset.itemId) {
                displayItemDetails(card.dataset.itemId);
            }
        });

        refreshButton.addEventListener('click', () => {
            if (!isLoading) { 
                resetToNormalView(); 
            }
        });

        personalPriceInput.addEventListener('change', () => {
            if (selectedItemId) { 
                savePersonalPrice(selectedItemId, personalPriceInput.value); 
            }
        });

        showProfitableButton.addEventListener('click', function() {
            if (isLoading) return;

            if (isComprehensiveSearchActive) {
                resetToNormalView();
            } else {
                performComprehensiveSearch();
            }
        });

        // Initialize app
        async function initializeApp() {
            try {
                loadPersonalPrices();
                await loadEmbeddedItemData();
                const dbLoaded = await loadItemDatabase();

                if (dbLoaded) {
                    await searchMarket();
                } else {
                    showMessage('error', 'Failed to load item database. Market data cannot be displayed.');
                    disableControls(true);
                }

                personalPriceInput.disabled = true;
            } catch (error) {
                console.error('Error initializing application:', error);
                showMessage('error', 'An unexpected error occurred during initialization.');
            }
        }

        window.addEventListener('DOMContentLoaded', initializeApp);
