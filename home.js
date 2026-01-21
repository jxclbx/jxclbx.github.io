// 在此指定您最满意的 3 张图的 ID (在 data.json 中的 id)
const PINNED_IDS = [1, 2, 3]; 

// 辅助函数：洗牌
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

async function initHome() {
    const res = await fetch('data.json');
    const data = await res.json();

    // 1. 顶部及右侧统计
    document.getElementById('total-count').innerText = data.length.toLocaleString();
    document.getElementById('count-airlines').innerText = [...new Set(data.map(p => p.airline))].length;
    document.getElementById('count-airports').innerText = [...new Set(data.map(p => p.airport))].length;
    document.getElementById('count-regs').innerText = [...new Set(data.map(p => p.reg))].length;

    // 1.5 Gear / Photographer info (侧边栏)
    const gearListContainer = document.getElementById('gear-list');
    if (gearListContainer && typeof GEAR !== 'undefined') {
        let gearHtml = '';
        gearHtml += `
            <div class="mb-5">
                <h4 class="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 flex items-center">
                    <i class="fa fa-map-marker-alt w-6 mr-2"></i> LOCATION
                </h4>
                <p class="text-gray-900 font-bold ml-8">Tianjin, China</p>
            </div>`;
        gearHtml += `
            <div class="mb-5">
                <h4 class="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 flex items-center">
                    <i class="fa fa-camera w-6 mr-2"></i> CAMERA BODIES
                </h4>
                <div class="space-y-1.5">`;
        Object.values(GEAR.cameras).forEach(name => {
            gearHtml += `<p class="text-gray-900 font-bold ml-8">${name}</p>`;
        });
        gearHtml += `</div></div>`;
        gearHtml += `
            <div class="mb-5">
                <h4 class="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 flex items-center">
                    <i class="fa fa-circle-notch w-6 mr-2"></i> LENSES
                </h4>
                <div class="space-y-1.5">`;
        Object.values(GEAR.lenses).forEach(name => {
            gearHtml += `<p class="text-gray-900 font-bold ml-8">${name}</p>`;
        });
        gearHtml += `</div></div>`;
        gearHtml += `
            <div class="mb-5">
                <h4 class="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 flex items-center">
                    <i class="fa fa-star w-6 mr-2"></i> HOBBIES
                </h4>
                <div class="space-y-1.5">
                    <p class="text-gray-900 font-bold ml-8">Aviation, Photography, Cycling</p>
                </div>
            </div>`;
        gearListContainer.innerHTML = gearHtml;
    }

    // 2. 地图初始化
    const map = L.map('map', { zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    const markersGroup = L.featureGroup();
    const airports = [...new Set(data.map(p => p.airport))];

    airports.forEach(code => {
        if (AIRPORT_COORDS[code]) {
            // 创建圆点标记
            const marker = L.circleMarker(AIRPORT_COORDS[code], {
                radius: 7,          // 略微调大半径，方便点击
                color: 'white',
                fillColor: '#3b82f6',
                fillOpacity: 1,
                weight: 2,
                className: 'cursor-pointer' // 增加手型光标样式
            });

            // --- 核心改动：添加点击事件实现跳转 ---
            marker.on('click', () => {
                // 跳转至 gallery.html，并带上机场筛选参数
                window.location.href = `gallery.html?airport=${encodeURIComponent(code)}`;
            });

            // 绑定悬停提示
            marker.bindTooltip(`<b>${code}</b><br>`, {
                direction: 'top',
                offset: [0, -5]
            });

            marker.addTo(markersGroup);
        }
    });

    markersGroup.addTo(map);
    if (airports.length > 0) map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });

    // 3. 通用渲染网格函数
    const renderGrid = (containerId, photos, append = false) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const html = photos.map(p => `
            <div class="jet-card overflow-hidden">
                <a href="photo.html?id=${p.id}" class="block">
                    <div class="aspect-video overflow-hidden bg-black">
                        <img src="${p.src}" class="w-full h-full object-cover" loading="lazy">
                    </div>
                    <div class="p-2 bg-[#282828] text-[10px] grid grid-cols-2 gap-x-2 gap-y-1 text-white leading-tight font-sans">
                        <div class="text-left truncate min-w-0">${p.airline}</div>
                        <div class="text-right truncate min-w-0">${p.reg}</div>
                        <div class="text-left truncate min-w-0">${p.date}</div>
                        <div class="text-right truncate min-w-0">${p.model}</div>
                    </div>
                </a>
            </div>
        `).join('');
        if (append) container.insertAdjacentHTML('beforeend', html);
        else container.innerHTML = html;
    };

    // --- 新增：置顶 Pinned Photos ---
    const pinnedPhotos = data.filter(p => PINNED_IDS.includes(p.id));
    // 按照 PINNED_IDS 的顺序排序，避免乱序
    pinnedPhotos.sort((a, b) => PINNED_IDS.indexOf(a.id) - PINNED_IDS.indexOf(b.id));
    renderGrid('pinned-grid', pinnedPhotos);

    // --- A. 精选照片 (随机 8 张) ---
    const featuredPool = data.filter(p => p.featured === true);
    renderGrid('featured-grid', shuffle([...featuredPool]).slice(0, 8));

    // --- B. 随机发现 (随机 8 张) ---
    renderGrid('random-grid', shuffle([...data]).slice(0, 8));

    // --- C. 最新照片：无限滚动 ---
    const latestAll = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    const PAGE_SIZE = 24;
    let latestIndex = 0;
    let latestLoading = false;
    const sentinel = document.getElementById('latest-sentinel');
    const loadingEl = document.getElementById('latest-loading');

    function loadMoreLatest() {
        if (latestLoading || latestIndex >= latestAll.length) return;
        latestLoading = true;
        if (loadingEl) loadingEl.classList.remove('hidden');
        setTimeout(() => {
            const next = latestAll.slice(latestIndex, latestIndex + PAGE_SIZE);
            latestIndex += next.length;
            renderGrid('latest-grid', next, true);
            latestLoading = false;
            if (loadingEl) loadingEl.classList.add('hidden');
        }, 500);
    }

    loadMoreLatest();
    if (sentinel) {
        new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadMoreLatest();
        }, { rootMargin: '200px' }).observe(sentinel);
    }

    // 4. 初始化图表
    initCharts(data);
}

// 保持 initCharts 原有样式逻辑
function initCharts(data) {
    const yearlyData = {};
    data.forEach(p => {
        const year = p.date ? p.date.split('-')[0] : 'Unknown';
        yearlyData[year] = (yearlyData[year] || 0) + 1;
    });
    const years = Object.keys(yearlyData).sort();
    const yearlyCounts = years.map(y => yearlyData[y]);

    const airlineCounts = {};
    data.forEach(p => {
        const airline = p.airline || 'Other';
        airlineCounts[airline] = (airlineCounts[airline] || 0) + 1;
    });
    const sortedAirlines = Object.entries(airlineCounts).sort((a, b) => b[1] - a[1]);
    const topAirlines = sortedAirlines.slice(0, 4).map(a => ({ name: a[0], value: a[1] }));
    const otherCount = sortedAirlines.slice(4).reduce((sum, a) => sum + a[1], 0);
    if (otherCount > 0) topAirlines.push({ name: 'Other', value: otherCount });

    const chartYearly = echarts.init(document.getElementById('chart-growth'));
    chartYearly.setOption({
        title: { text: 'Photos uploaded per year', left: 'center', textStyle: { color: '#333', fontSize: 13, fontWeight: 'normal' } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '10%', right: '10%', bottom: '15%', top: '20%', containLabel: true },
        xAxis: { type: 'category', data: years, axisLine: { lineStyle: { color: '#ddd' } } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#eee' } } },
        series: [{ name: 'Photos uploaded', type: 'bar', data: yearlyCounts, barWidth: '40%', itemStyle: { color: '#0054a6', borderRadius: [2, 2, 0, 0] } }]
    });

    const chartAirline = echarts.init(document.getElementById('chart-airline'));
    chartAirline.setOption({
        title: { text: 'Most photographed airlines', left: 'center', textStyle: { color: '#333', fontSize: 13, fontWeight: 'normal' } },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
            name: 'Airlines', type: 'pie', radius: '65%', center: ['50%', '60%'], data: topAirlines,
            color: ['#003d73', '#0054a6', '#0070d2', '#3296ed', '#82c0f7'],
            label: { position: 'outside', formatter: '{b}', fontSize: 10, color: '#333' },
            itemStyle: { borderColor: '#fff', borderWidth: 1 }
        }]
    });

    window.addEventListener('resize', () => {
        chartYearly.resize();
        chartAirline.resize();
    });
}

function performNavSearch() {
    const input = document.getElementById('nav-search-input');
    const query = input.value.trim();
    if (query) window.location.href = `gallery.html?reg=${encodeURIComponent(query)}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('nav-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performNavSearch();
        });
    }
});

initHome();