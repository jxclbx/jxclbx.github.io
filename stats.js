let allData = [];
let charts = {}; 

async function initStatsPage() {
    try {
        const response = await fetch('data.json');
        allData = await response.json();

        // 1. 初始化原有的筛选菜单逻辑
        initFilters();

        // 2. 渲染所有图表
        renderAllStatistics();

        // 3. 监听窗口缩放
        window.addEventListener('resize', () => {
            Object.values(charts).forEach(c => c.resize());
        });

    } catch (err) {
        console.error("加载数据失败:", err);
    }
}

// --- 核心同步逻辑 ---
function syncGlobalYear(year) {
    // 1. 同步两个下拉菜单的数值
    document.getElementById('monthly-year-select').value = year;
    document.getElementById('heatmap-year-select').value = year;
    
    // 2. 重新渲染受年份影响的图表
    updateMonthlyChart(year);
    updateHeatmapChart(year);
}

function renderAllStatistics() {
    // 基础资产分布
    renderRankedChart('airline', 'chart-airline', 'table-airline');
    renderRankedChart('model', 'chart-model', 'table-model');
    renderRankedChart('airport', 'chart-airport', 'table-airport');

    // 时间统计初始化
    const years = [...new Set(allData.map(item => item.date.split('-')[0]))].sort();
    const latestYear = years[years.length - 1];

    // 初始化下拉菜单选项
    const populateYearSelect = (id) => {
        const select = document.getElementById(id);
        select.innerHTML = years.slice().reverse().map(y => `<option value="${y}">${y}</option>`).join('');
    };
    populateYearSelect('monthly-year-select');
    populateYearSelect('heatmap-year-select');

    // 绑定下拉菜单事件
    document.getElementById('monthly-year-select').onchange = (e) => syncGlobalYear(e.target.value);
    document.getElementById('heatmap-year-select').onchange = (e) => syncGlobalYear(e.target.value);

    // 渲染年度柱状图
    renderYearlyChart(years);
    
    // 初始同步到最新一年
    syncGlobalYear(latestYear);
}

// --- 具体渲染函数 ---

function renderYearlyChart(years) {
    const yearlyCounts = {};
    allData.forEach(item => {
        const y = item.date.split('-')[0];
        yearlyCounts[y] = (yearlyCounts[y] || 0) + 1;
    });
    const values = years.map(y => yearlyCounts[y]);

    const chart = echarts.init(document.getElementById('chart-yearly'));
    charts['chart-yearly'] = chart;
    
    chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: years, axisLine: { lineStyle: { color: '#ccc' } } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{
            data: values, type: 'bar', barWidth: '40%',
            itemStyle: { color: '#282828' },
            emphasis: { itemStyle: { color: '#3b82f6' } }
        }]
    });

    // 点击柱子同步全年
    chart.on('click', (params) => syncGlobalYear(params.name));
}

function updateMonthlyChart(year) {
    const monthlyCounts = Array(12).fill(0);
    allData.forEach(item => {
        const [y, m] = item.date.split('-');
        if (y === year) monthlyCounts[parseInt(m) - 1]++;
    });

    const chart = echarts.init(document.getElementById('chart-monthly'));
    charts['chart-monthly'] = chart;
    chart.setOption({
        tooltip: { trigger: 'axis', formatter: '{b}: {c} 张' },
        xAxis: { 
            type: 'category', 
            data: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            axisLabel: { fontSize: 10 }
        },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{ data: monthlyCounts, type: 'bar', barWidth: '50%', itemStyle: { color: '#3b82f6' } }]
    });
}

function updateHeatmapChart(year) {
    const chart = echarts.init(document.getElementById('chart-heatmap'));
    charts['chart-heatmap'] = chart;

    const dateCounts = {};
    allData.forEach(item => {
        if (item.date.startsWith(year)) dateCounts[item.date] = (dateCounts[item.date] || 0) + 1;
    });
    const heatmapData = Object.entries(dateCounts);

    chart.setOption({
        visualMap: {
            show: false, min: 0, max: 5,
            inRange: { color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] }
        },
        calendar: {
            top: 30, left: 30, right: 30, range: year, cellSize: ['auto', 13],
            dayLabel: { fontSize: 10, firstDay: 1 },
            monthLabel: { fontSize: 10 },
            itemStyle: { borderWidth: 2, borderColor: '#fff' },
            splitLine: { show: false }
        },
        series: { type: 'heatmap', coordinateSystem: 'calendar', data: heatmapData }
    });
}

function renderRankedChart(field, chartId, tableId) {
    const counts = {};
    allData.forEach(item => { if(item[field]) counts[item[field]] = (counts[item[field]] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    const total = allData.length;

    const tbody = document.getElementById(tableId);
    tbody.innerHTML = sorted.slice(0, 15).map((item, index) => `
        <tr>
            <td class="font-bold text-gray-400 w-8">${index + 1}</td>
            <td class="font-bold">${item.name}</td>
            <td class="text-right">${item.value}</td>
            <td class="text-right text-blue-500 font-medium">${((item.value/total)*100).toFixed(1)}%</td>
        </tr>
    `).join('');

    const chart = echarts.init(document.getElementById(chartId));
    charts[chartId] = chart;
    chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
            type: 'pie', radius: ['40%', '70%'],
            itemStyle: { borderRadius: 2, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: sorted.slice(0, 10),
            color: ['#282828', '#3b82f6', '#4b5563', '#94a3b8', '#cbd5e1', '#e2e8f0']
        }]
    });
}

// --- 基础过滤逻辑 ---
function initFilters() {
    const getUnique = (field) => [...new Set(allData.map(item => item[field]))].filter(v => v).sort();
    const populate = (id, values) => {
        const select = document.getElementById(id);
        select.innerHTML = select.options[0].outerHTML; 
        values.forEach(val => {
            const opt = document.createElement('option');
            opt.value = opt.innerText = val;
            select.appendChild(opt);
        });
    };
    populate('select-airline', getUnique('airline'));
    populate('select-airport', getUnique('airport'));
    populate('select-model', getUnique('model'));
    ['select-airline', 'select-airport', 'select-model', 'select-featured'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateRegDropdown);
    });
}

function updateRegDropdown() {
    const airline = document.getElementById('select-airline').value;
    const airport = document.getElementById('select-airport').value;
    const model = document.getElementById('select-model').value;
    const featured = document.getElementById('select-featured').value;
    const regSelect = document.getElementById('select-reg');
    if (!airline && !airport && !model && !featured) {
        regSelect.disabled = true;
        regSelect.innerHTML = '<option value="">Select filters first...</option>';
        return;
    }
    regSelect.disabled = false;
    const available = allData.filter(item => 
        (!airline || item.airline === airline) &&
        (!airport || item.airport === airport) &&
        (!model || item.model === model) &&
        (!featured || String(item.featured) === featured)
    );
    const regs = [...new Set(available.map(item => item.reg))].filter(v => v).sort();
    regSelect.innerHTML = `<option value="">Any Registration (${regs.length})</option>` + 
        regs.map(r => `<option value="${r}">${r}</option>`).join('');
}

function applyFilters() {
    const filters = {
        airline: document.getElementById('select-airline').value,
        airport: document.getElementById('select-airport').value,
        model: document.getElementById('select-model').value,
        reg: document.getElementById('select-reg').value,
        featured: document.getElementById('select-featured').value
    };
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if(v) params.append(k, v); });
    window.location.href = `gallery.html?${params.toString()}`;
}

initStatsPage();