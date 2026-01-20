// 配置参数
const ITEMS_PER_PAGE = 24; // 4x6 布局
let allData = [];          // 原始 JSON 数据
let filteredData = [];     // 过滤后的数据

// 1. 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
let currentPage = parseInt(urlParams.get('page')) || 1;

// 2. 加载并处理数据
async function initGallery() {
    try {
        const response = await fetch('data.json');
        allData = await response.json();

        // 1. 获取所有 URL 参数 (转为对象)
        const searchParams = new URLSearchParams(window.location.search);
        const filters = Object.fromEntries(searchParams.entries());
        
        // 移除分页参数
        delete filters.page; 

        // 2. 多条件动态筛选逻辑
        filteredData = allData.filter(item => {
            return Object.keys(filters).every(key => {
                return String(item[key]) === String(filters[key]);
            });
        });

        // --- 核心修改：按日期倒序排序 (最新的在前) ---
        filteredData.sort((a, b) => {
            // 将字符串日期转换为时间戳进行比较
            return new Date(b.date) - new Date(a.date);
        });

        // 3. 动态更新标题
        const filterCount = Object.keys(filters).length;
        document.getElementById('gallery-title').innerText = 
            filterCount > 0 ? `FILTERED RESULTS (${filteredData.length})` : "ALL PHOTOS";

        renderPage(currentPage);
    } catch (err) {
        console.error("Gallery initialization failed:", err);
    }
}

// 3. 渲染指定页码的内容
function renderPage(page) {
    const grid = document.getElementById('photo-grid');
    if (!grid) return;
    grid.innerHTML = ''; 

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, end);

    pageData.forEach(photo => {
        const card = document.createElement('div');
        card.className = 'photo-card overflow-hidden rounded-sm';
        card.innerHTML = `
            <a href="photo.html?id=${photo.id}" class="block">
            <div class="aspect-video overflow-hidden bg-black">
                <img src="${photo.src}" class="w-full h-full object-cover" loading="lazy">
            </div>
            <div class="p-2 bg-[#282828] text-[10px] grid grid-cols-2 gap-x-2 gap-y-1 text-white leading-tight font-sans">
                <div class="text-left truncate min-w-0">${photo.airline}</div>
                <div class="text-right truncate min-w-0">${photo.reg}</div>
                <div class="text-left truncate min-w-0">${photo.date}</div>
                <div class="text-right truncate min-w-0">${photo.model}</div>
            </div>
            </a>
        `;
        grid.appendChild(card);
    });

    renderPagination();
    window.scrollTo(0, 0); 
}

// 4. 渲染分页按钮 (逻辑保持不变)
function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const createBtn = (content, targetPage, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = content;
        btn.className = `px-4 py-2 text-xs transition min-w-[40px] h-[40px] flex items-center justify-center ${
            active ? 'bg-black text-white font-bold' : 
            disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'
        }`;
        
        if (!disabled && !active) {
            btn.onclick = () => {
                currentPage = targetPage;
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('page', targetPage);
                window.history.pushState({}, '', newUrl);
                renderPage(targetPage);
            };
        }
        return btn;
    };

    pagination.appendChild(createBtn('<i class="fa fa-angle-left"></i>', currentPage - 1, false, currentPage === 1));

    const range = 2;
    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > range + 2) pages.push('...');
        let start = Math.max(2, currentPage - range);
        let end = Math.min(totalPages - 1, currentPage + range);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - (range + 1)) pages.push('...');
        pages.push(totalPages);
    }

    pages.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.innerText = '...';
            span.className = 'px-2 text-gray-600';
            pagination.appendChild(span);
        } else {
            pagination.appendChild(createBtn(p, p, p === currentPage));
        }
    });

    pagination.appendChild(createBtn('<i class="fa fa-angle-right"></i>', currentPage + 1, false, currentPage === totalPages));
}

// 启动
initGallery();

// 5. 监听浏览器返回/前进
window.onpopstate = function(event) {
    const newParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(newParams.get('page')) || 1;
    renderPage(currentPage);
};

// 搜索逻辑
function performNavSearch() {
    const input = document.getElementById('nav-search-input');
    const query = input.value.trim();
    if (query) {
        window.location.href = `gallery.html?reg=${encodeURIComponent(query)}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('nav-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') performNavSearch();
        });
    }
});