document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Function to apply theme
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            themeToggle.innerHTML = '☀️ Mode Terang';
        } else {
            themeToggle.innerHTML = '🌙 Mode Gelap';
        }
    }

    // Initialize theme
    let currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        applyTheme(currentTheme);
    } else {
        applyTheme(prefersDarkScheme.matches ? 'dark' : 'light');
    }
    
    themeToggle.addEventListener('click', function() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        this.blur(); // Remove focus after click
    });

    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) { // Only if user hasn't manually set a theme
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    const apiPopup = document.getElementById('apiPopup');
    const closePopup = document.getElementById('closePopup');
    const popupBody = document.getElementById('popupBody');
    const popupTitle = document.getElementById('popupTitle');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const statusNotification = document.getElementById('statusNotification');
    
    closePopup.addEventListener('click', function() {
        apiPopup.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === apiPopup) {
            apiPopup.style.display = 'none';
        }
    });
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    loadApiData(); // Load API data on page load
    
    function showStatusNotification(message, type = 'info') { // type can be 'info', 'success', 'error'
        statusNotification.textContent = message;
        statusNotification.className = 'status-notification'; // Reset classes
        if (type === 'success') {
            statusNotification.style.backgroundColor = 'var(--success-color)';
            statusNotification.style.color = 'white';
        } else if (type === 'error') {
            statusNotification.style.backgroundColor = 'var(--error-color)';
            statusNotification.style.color = 'white';
        } else { // 'info' or default
            statusNotification.style.backgroundColor = 'var(--card-bg-color)'; // Use card bg for info
            statusNotification.style.color = 'var(--text-color)';
            statusNotification.style.border = '1px solid var(--border-color)'; // Add border for info if needed
        }
        statusNotification.style.display = 'block';
        statusNotification.style.animation = 'fadeInBottom 0.3s ease-out';
        
        setTimeout(function() {
            statusNotification.style.animation = 'fadeOutBottom 0.3s ease-in forwards';
             setTimeout(() => {
                statusNotification.style.display = 'none';
                // Reset styles for next notification
                statusNotification.style.backgroundColor = '';
                statusNotification.style.color = '';
                statusNotification.style.border = '';
            }, 300);
        }, 3000);
    }
    
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const categories = document.querySelectorAll('.category');

        categories.forEach(category => {
            const apiCards = category.querySelectorAll('.api-card');
            let categoryHasVisibleCards = false;

            apiCards.forEach(card => {
                const name = card.dataset.apiName.toLowerCase();
                const desc = card.dataset.apiDesc.toLowerCase();
                const matches = name.includes(searchTerm) || desc.includes(searchTerm);
                
                if (matches) {
                    card.style.display = 'flex'; // Use flex as it's a flex item
                    categoryHasVisibleCards = true;
                } else {
                    card.style.display = 'none';
                }
            });

            if (categoryHasVisibleCards || !searchTerm) {
                category.style.display = 'block';
                category.classList.add('visible'); // Ensure visible if matching
            } else {
                category.style.display = 'none';
            }
        });
    }
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    function checkVisibility() {
        const categories = document.querySelectorAll('.category');
        const windowHeight = window.innerHeight;
        categories.forEach(category => {
            // Only apply visibility if not actively being hidden by search
            if (category.style.display !== 'none') {
                const rect = category.getBoundingClientRect();
                if (rect.top < windowHeight - 50 && rect.bottom >= 0) {
                    category.classList.add('visible');
                }
            }
        });
    }
    
    window.addEventListener('scroll', debounce(checkVisibility, 100));
    
    async function loadApiData() {
        try {
            const response = await fetch('./src/web-set.json'); // Ensure this path is correct
            if (!response.ok) {
                throw new Error(`Gagal memuat data: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            
            document.getElementById('api-name-display').textContent = data.name || "API Collection";
            if (data.header && data.header.status) {
                document.getElementById('api-status-display').textContent = data.header.status;
            }
            document.getElementById('api-description-display').textContent = data.description || "Explore our APIs.";
            document.getElementById('api-creator-display').textContent = (data.apiSettings && data.apiSettings.creator) || "API Team";
            document.getElementById('api-version-display').textContent = data.version || "v1.0";
            
            const categoriesContainer = document.getElementById('categories-container');
            categoriesContainer.innerHTML = ''; 
            
            if (!data.categories || data.categories.length === 0) {
                categoriesContainer.innerHTML = '<p style="text-align:center; color: var(--secondary-text-color);">Tidak ada API yang tersedia saat ini.</p>';
                return;
            }

            data.categories.forEach(category => {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category';
                categoryElement.dataset.category = category.name.toLowerCase();
                
                const categoryTitle = document.createElement('h2');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = category.name;
                
                const apiGrid = document.createElement('div');
                apiGrid.className = 'api-grid';
                
                if (!category.items || category.items.length === 0) {
                     apiGrid.innerHTML = '<p style="color: var(--secondary-text-color);">Tidak ada API dalam kategori ini.</p>';
                } else {
                    category.items.forEach(item => {
                        const apiCard = document.createElement('div');
                        apiCard.className = 'api-card';
                        apiCard.dataset.apiName = item.name.toLowerCase();
                        apiCard.dataset.apiDesc = item.desc.toLowerCase();
                        
                        const apiName = document.createElement('h3');
                        apiName.className = 'api-name';
                        apiName.textContent = item.name;
                        
                        const apiKeyBadge = document.createElement('span');
                        apiKeyBadge.className = `api-key-badge ${item.requireKey ? '' : 'public'}`;
                        apiKeyBadge.textContent = item.requireKey ? 'Butuh Key' : 'Publik';
                        apiName.appendChild(apiKeyBadge);
                        
                        const apiDesc = document.createElement('p');
                        apiDesc.className = 'api-desc';
                        apiDesc.textContent = item.desc;
                        
                        const apiPathContainer = document.createElement('div');
                        apiPathContainer.className = 'api-path-container';
                        
                        const apiPath = document.createElement('code');
                        apiPath.className = 'api-path';
                        apiPath.textContent = item.path;
                        
                        const copyPathBtn = document.createElement('button');
                        copyPathBtn.className = 'copy-path-btn';
                        copyPathBtn.title = 'Salin endpoint';
                        copyPathBtn.innerHTML = '<i class="far fa-copy"></i>';
                        copyPathBtn.addEventListener('click', function(e) {
                            e.stopPropagation(); 
                            navigator.clipboard.writeText(item.path).then(() => {
                                copyPathBtn.innerHTML = '<i class="fas fa-check"></i>';
                                showStatusNotification('Endpoint disalin!', 'success');
                                setTimeout(() => {
                                    copyPathBtn.innerHTML = '<i class="far fa-copy"></i>';
                                }, 2000);
                            }).catch(err => {
                                showStatusNotification('Gagal menyalin.', 'error');
                                console.error('Failed to copy path: ', err);
                            });
                        });
                        
                        apiPathContainer.appendChild(apiPath);
                        apiPathContainer.appendChild(copyPathBtn);
                        
                        const apiStatus = document.createElement('span');
                        apiStatus.className = `api-status status-${item.status.toLowerCase()}`;
                        
                        const statusIcon = document.createElement('i');
                        let statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);
                        
                        switch(item.status.toLowerCase()) {
                            case 'ready': statusIcon.className = 'fas fa-circle-check'; statusText = 'Online'; break;
                            case 'update': statusIcon.className = 'fas fa-circle-notch fa-spin'; statusText = 'Update'; break;
                            case 'offline': statusIcon.className = 'fas fa-circle-xmark'; statusText = 'Offline'; break;
                            case 'maintenance': statusIcon.className = 'fas fa-tools'; statusText = 'Maintenance'; break;
                            case 'error': statusIcon.className = 'fas fa-circle-exclamation'; statusText = 'Error'; break;
                            default: statusIcon.className = 'fas fa-circle';
                        }
                        
                        apiStatus.appendChild(statusIcon);
                        apiStatus.appendChild(document.createTextNode(' ' + statusText)); 
                        
                        apiCard.append(apiName, apiDesc, apiPathContainer, apiStatus);
                        
                        if (item.params && Object.keys(item.params).length > 0) {
                            const paramTitle = document.createElement('p');
                            paramTitle.className = 'param-title';
                            paramTitle.textContent = 'Parameter:';
                            
                            const paramList = document.createElement('div');
                            paramList.className = 'param-list';
                            
                            Object.entries(item.params).forEach(([key, desc]) => {
                                const paramItem = document.createElement('div');
                                paramItem.className = 'param-item';
                                paramItem.innerHTML = `<span class="param-name">${key}</span>: ${desc}`;
                                paramList.appendChild(paramItem);
                            });
                            apiCard.append(paramTitle, paramList);
                        }
                        
                        const tryBtn = document.createElement('button');
                        tryBtn.className = 'try-btn';
                        tryBtn.textContent = 'Coba Sekarang';
                        
                        if (item.status.toLowerCase() !== 'ready') {
                            tryBtn.classList.add('disabled');
                            tryBtn.title = `Endpoint ini sedang ${statusText.toLowerCase()}`;
                            tryBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showStatusNotification(`Endpoint ini sedang ${statusText.toLowerCase()}!`, 'info');
                            });
                        } else {
                            tryBtn.addEventListener('click', function(e) {
                                e.stopPropagation();
                                toggleTryContainer(apiCard, item);
                            });
                        }
                        
                        apiCard.appendChild(tryBtn);
                        apiGrid.appendChild(apiCard);
                    });
                }
                
                categoryElement.append(categoryTitle, apiGrid);
                categoriesContainer.appendChild(categoryElement);
            });
            
            checkVisibility(); 
            
        } catch (error) {
            console.error('Error memuat data API:', error);
            const categoriesContainer = document.getElementById('categories-container');
            categoriesContainer.innerHTML = 
                `<div style="text-align: center; padding: 20px; background-color: var(--error-color); color: white; border-radius: 8px;">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p style="font-size: 1.2rem; margin-top: 10px;">Error Memuat Data API</p>
                    <p>${error.message}</p>
                    <p>Pastikan file './src/web-set.json' ada dan dapat diakses.</p>
                 </div>`;
        }
    }
    
    function toggleTryContainer(apiCard, item) {
        let tryContainer = apiCard.querySelector('.try-container');
        if (!tryContainer) {
            tryContainer = createTryContainer(apiCard, item);
            apiCard.appendChild(tryContainer); 
        }
        
        if (tryContainer.style.display === 'block') {
            tryContainer.style.display = 'none';
        } else {
            tryContainer.style.display = 'block';
            setTimeout(() => { 
                tryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 0);
        }
    }
    
    function createTryContainer(apiCard, item) {
        const tryContainer = document.createElement('div');
        tryContainer.className = 'try-container';
        tryContainer.style.display = 'none'; 
        
        if (item.requireKey) {
            const keyGroup = document.createElement('div');
            keyGroup.className = 'input-group';
            const keyLabel = document.createElement('label');
            keyLabel.htmlFor = `api-key-${item.name.replace(/\s+/g, '-').toLowerCase()}`;
            keyLabel.innerHTML = 'API Key <span style="color: var(--primary-color); font-weight: normal;">*wajib</span>';
            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.placeholder = 'Masukkan API key Anda';
            keyInput.id = `api-key-${item.name.replace(/\s+/g, '-').toLowerCase()}`;
            keyInput.required = true;
            keyGroup.append(keyLabel, keyInput);
            tryContainer.appendChild(keyGroup);
        }
        
        if (item.params && Object.keys(item.params).length > 0) {
            Object.keys(item.params).forEach(param => {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group';
                const label = document.createElement('label');
                label.htmlFor = `param-${param}-${item.name.replace(/\s+/g, '-').toLowerCase()}`;
                label.textContent = param;
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = item.params[param]; 
                input.id = `param-${param}-${item.name.replace(/\s+/g, '-').toLowerCase()}`;
                inputGroup.append(label, input);
                tryContainer.appendChild(inputGroup);
            });
        } else if (!item.requireKey && (!item.params || Object.keys(item.params).length === 0)) {
             const noParamsMsg = document.createElement('p');
             noParamsMsg.textContent = 'Tidak ada parameter yang dibutuhkan untuk endpoint ini.';
             noParamsMsg.style.fontSize = '0.9rem';
             noParamsMsg.style.color = 'var(--secondary-text-color)';
             tryContainer.appendChild(noParamsMsg);
        }
        
        const buttonGroup = document.createElement('div');
        buttonGroup.style.marginTop = '15px';
        
        const executeBtn = document.createElement('button');
        executeBtn.className = 'execute-btn';
        executeBtn.textContent = 'Jalankan';
        executeBtn.addEventListener('click', function() {
            executeApi(item, apiCard); 
        });
        
        buttonGroup.appendChild(executeBtn);
        tryContainer.appendChild(buttonGroup);
        
        return tryContainer;
    }
    
    async function executeApi(item, apiCard) { 
        popupTitle.textContent = `Hasil: ${item.name}`;
        popupBody.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <div class="loading"></div>
                <p class="loading-text">Memproses request ke ${item.name}...</p>
            </div>
        `;
        apiPopup.style.display = 'flex';
        
        try {
            let url = item.path.split('?')[0]; 
            const queryParams = new URLSearchParams();
            
            if (item.requireKey) {
                const apiKeyInput = apiCard.querySelector(`#api-key-${item.name.replace(/\s+/g, '-').toLowerCase()}`);
                if (!apiKeyInput || !apiKeyInput.value.trim()) {
                    throw new Error('API key diperlukan dan tidak boleh kosong.');
                }
                queryParams.append('apikey', apiKeyInput.value.trim());
            }
            
            if (item.params) {
                Object.keys(item.params).forEach(param => {
                    const input = apiCard.querySelector(`#param-${param}-${item.name.replace(/\s+/g, '-').toLowerCase()}`);
                    if (input && input.value.trim()) {
                        queryParams.append(param, input.value.trim());
                    }
                });
            }
            
            const queryString = queryParams.toString();
            if (queryString) {
                url += '?' + queryString;
            }
            
            const response = await fetch(url);
            
            let responseData;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                responseData = await response.json();
            } else {
                responseData = await response.text(); 
            }

            if (!response.ok) {
                let errorDetail = response.statusText;
                if (typeof responseData === 'object' && responseData !== null && responseData.message) { // Common error structure
                    errorDetail = responseData.message;
                } else if (typeof responseData === 'object' && responseData !== null && responseData.error) {
                    errorDetail = responseData.error;
                } else if (typeof responseData === 'string' && responseData.length < 200) { 
                    errorDetail = responseData;
                }
                throw new Error(`Request gagal: ${response.status} ${errorDetail}`);
            }
            
            popupBody.innerHTML = ''; 
            const pre = document.createElement('pre');
            pre.className = 'result-content';
            if (typeof responseData === 'object') {
                pre.textContent = JSON.stringify(responseData, null, 2);
            } else {
                pre.textContent = responseData; 
            }
            popupBody.appendChild(pre);
            
        } catch (error) {
            console.error('Kesalahan Eksekusi API:', error);
            popupBody.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Coba lagi, periksa parameter Anda, atau API key jika diperlukan.</p>
                </div>
            `;
        }
    }
    
    copyResultBtn.addEventListener('click', function() {
        const resultPre = popupBody.querySelector('pre.result-content');
        if (resultPre && resultPre.textContent) {
            navigator.clipboard.writeText(resultPre.textContent).then(() => {
                const originalText = copyResultBtn.innerHTML;
                copyResultBtn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
                showStatusNotification('Hasil API disalin!', 'success');
                setTimeout(() => {
                    copyResultBtn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                showStatusNotification('Gagal menyalin hasil.', 'error');
                console.error('Gagal menyalin hasil: ', err);
            });
        } else {
             showStatusNotification('Tidak ada hasil untuk disalin.', 'info');
        }
    });

    checkVisibility();

});