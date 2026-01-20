// 配置参数
const ITEMS_PER_PAGE = 24; // 4x6 布局
let allData = [];          // 原始 JSON 数据
let filteredData = [];     // 过滤后的数据

// 1. 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const filterType = urlParams.get('type') || 'all'; 
const filterValue = urlParams.get('value') || '';  
let currentPage = parseInt(urlParams.get('page')) || 1;

// 2. 加载并处理数据
// 修改后的 gallery.js 核心逻辑
async function initGallery() {
    try {
        const response = await fetch('data.json');
        allData = await response.json();

        // 1. 获取所有 URL 参数 (转为对象)
        // 例如 URL 是 ?airline=Emirates&model=A380
        const searchParams = new URLSearchParams(window.location.search);
        const filters = Object.fromEntries(searchParams.entries());
        
        // 移除分页参数，因为它不属于数据过滤字段
        delete filters.page; 

        // 2. 多条件动态筛选逻辑
        filteredData = allData.filter(item => {
            // 检查每一个 URL 参数是否都在对应的照片数据中匹配
            return Object.keys(filters).every(key => {
                // 如果 URL 里有这个字段，且照片数据里也有，则进行匹配
                return String(item[key]) === String(filters[key]);
            });
        });

        // 3. 动态更新标题
        const filterCount = Object.keys(filters).length;
        document.getElementById('gallery-title').innerText = 
            filterCount > 0 ? `FILTERED RESULTS (${filteredData.length})` : "ALL PHOTOS";

        renderPage(currentPage);
    } catch (err) {
        console.error("Multi-filter failed:", err);
    }
}

// 3. 渲染指定页码的内容 (同步 Home.js 配色：#282828)
function renderPage(page) {
    const grid = document.getElementById('photo-grid');
    grid.innerHTML = ''; 

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, end);

    pageData.forEach(photo => {
        const card = document.createElement('div');
        // 移除边框和阴影，保持纯粹扁平化
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

// 4. 渲染分页按钮 (同步黑白纯净风格)
function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // --- 辅助函数：创建按钮 (同步 Home 风格：黑底白字/白底黑字) ---
    const createBtn = (content, targetPage, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = content;
        // 使用白色背景和黑色字体，active 状态为黑底白字，无边框
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

    // 1. 左箭头
    pagination.appendChild(createBtn('<i class="fa fa-angle-left"></i>', currentPage - 1, false, currentPage === 1));

    // 2. 页码逻辑
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

    // 3. 右箭头
    pagination.appendChild(createBtn('<i class="fa fa-angle-right"></i>', currentPage + 1, false, currentPage === totalPages));
}

// 启动
initGallery();

// 5. 监听浏览器返回/前进按钮
window.onpopstate = function(event) {
    const newParams = new URLSearchParams(window.location.search);
    const newPage = parseInt(newParams.get('page')) || 1;
    currentPage = newPage;
    renderPage(currentPage);
};

/**
 * 执行导航栏搜索逻辑
 * 跳转至 gallery.html 并应用注册号过滤参数
 */
function performNavSearch() {
    const input = document.getElementById('nav-search-input');
    const query = input.value.trim();
    
    if (query) {
        // 使用之前 gallery.js 已经支持的多条件过滤格式
        // 自动跳转并筛选对应的注册号
        window.location.href = `gallery.html?reg=${encodeURIComponent(query)}`;
    }
}

// 绑定回车键事件，方便用户直接按 Enter 搜索
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('nav-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performNavSearch();
            }
        });
    }
});