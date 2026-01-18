
// 辅助函数：洗牌
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

async function initHome() {
    const res = await fetch('data.json');
    const data = await res.json();

    // 1. 顶部统计
    document.getElementById('total-count').innerText = data.length.toLocaleString();
    document.getElementById('count-airlines').innerText = [...new Set(data.map(p => p.airline))].length;
    document.getElementById('count-airports').innerText = [...new Set(data.map(p => p.airport))].length;
    document.getElementById('count-regs').innerText = [...new Set(data.map(p => p.reg))].length;

    // 2. 地图初始化 (自适应缩放)
    const map = L.map('map', { zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    const markersGroup = L.featureGroup();
    const airports = [...new Set(data.map(p => p.airport))];
    airports.forEach(code => {
        if(AIRPORT_COORDS[code]) {
            L.circleMarker(AIRPORT_COORDS[code], {
                radius: 6, color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2
            }).addTo(markersGroup).bindTooltip(code);
        }
    });
    markersGroup.addTo(map);
    if (airports.length > 0) map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });

    // 3. 通用渲染网格函数 (16:9, 无动画, 四角白字)
    const renderGrid = (containerId, photos) => {
        const container = document.getElementById(containerId);
        container.innerHTML = photos.map(p => `
            <div class="jet-card overflow-hidden">
                <a href="photo.html?id=${p.id}" class="block">
                    <div class="aspect-video overflow-hidden bg-black">
                        <img src="${p.src}" class="w-full h-full object-cover" loading="lazy">
                    </div>
                    <div class="p-2 bg-[#282828] text-[10px] grid grid-cols-2 gap-1 text-white leading-tight font-sans">
                        <div class="text-left">${p.airline}</div>
                        <div class="text-right">${p.reg}</div>
                        <div class="text-left">${p.date}</div>
                        <div class="text-right">${p.model}</div>
                    </div>
                </a>
            </div>
        `).join('');
    };

    // --- A. 精选照片 (Featured: true, 随机 16 张) ---
    const featuredPool = data.filter(p => p.featured === true);
    renderGrid('featured-grid', shuffle([...featuredPool]).slice(0, 8));
    
    // --- B. 随机发现 (所有图中随机 8 张) ---
    renderGrid('random-grid', shuffle([...data]).slice(0, 8));

    // --- C. 最新照片 (按日期降序, 前 24 张) ---
    const latestPhotos = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 24);
    renderGrid('latest-grid', latestPhotos);

    // 4. 初始化图表
    initCharts(data);
}

function initCharts(data) {
    // ECharts 初始化逻辑（略，可复用之前的饼图和柱状图代码）
}

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

initHome();