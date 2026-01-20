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
    document.getElementById('monthly-year-select').value = year;
    document.getElementById('heatmap-year-select').value = year;
    
    updateMonthlyChart(year);
    updateHeatmapChart(year);
}

function renderAllStatistics() {
    // 基础资产分布 (饼图 + 表格)
    renderRankedChart('airline', 'chart-airline', 'table-airline', 'Most photographed airlines');
    renderRankedChart('model', 'chart-model', 'table-model', 'Most photographed aircraft');
    renderRankedChart('airport', 'chart-airport', 'table-airport', 'Most visited airports');

    const years = [...new Set(allData.map(item => item.date.split('-')[0]))].sort();
    const latestYear = years[years.length - 1];

    const populateYearSelect = (id) => {
        const select = document.getElementById(id);
        select.innerHTML = years.slice().reverse().map(y => `<option value="${y}">${y}</option>`).join('');
    };
    populateYearSelect('monthly-year-select');
    populateYearSelect('heatmap-year-select');

    document.getElementById('monthly-year-select').onchange = (e) => syncGlobalYear(e.target.value);
    document.getElementById('heatmap-year-select').onchange = (e) => syncGlobalYear(e.target.value);

    renderYearlyChart(years);
    syncGlobalYear(latestYear);
}

// --- 柱状图样式统一 (仿照截图样式) ---

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
        title: {
            text: 'Photos uploaded per year',
            left: 'center',
            textStyle: { color: '#333', fontSize: 13, fontWeight: 'normal' }
        },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: '20%', bottom: '15%', containLabel: true },
        xAxis: { 
            type: 'category', 
            data: years, 
            axisLine: { lineStyle: { color: '#ddd' } },
            axisLabel: { color: '#666', fontSize: 10 }
        },
        yAxis: { 
            type: 'value', 
            name: 'Photos uploaded',
            nameLocation: 'middle',
            nameGap: 35,
            nameTextStyle: { color: '#999', fontSize: 10 },
            splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
            axisLabel: { color: '#666', fontSize: 10 }
        },
        series: [{
            data: values, 
            type: 'bar', 
            barWidth: '40%',
            itemStyle: { color: '#0054a6', borderRadius: [2, 2, 0, 0] }
        }]
    });

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
        title: {
            text: `Monthly uploads in ${year}`,
            left: 'center',
            textStyle: { color: '#333', fontSize: 13, fontWeight: 'normal' }
        },
        tooltip: { trigger: 'axis', formatter: '{b}: {c} photos' },
        grid: { top: '20%', bottom: '15%', containLabel: true },
        xAxis: { 
            type: 'category', 
            data: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            axisLabel: { fontSize: 10, color: '#666' },
            axisLine: { lineStyle: { color: '#ddd' } }
        },
        yAxis: { 
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
            axisLabel: { color: '#666', fontSize: 10 }
        },
        series: [{ 
            data: monthlyCounts, 
            type: 'bar', 
            barWidth: '50%', 
            itemStyle: { color: '#0054a6', borderRadius: [2, 2, 0, 0] } 
        }]
    });
}

// --- 饼图样式统一 (实心饼图 + 蓝色系渐变) ---

function renderRankedChart(field, chartId, tableId, titleText) {
    const counts = {};
    allData.forEach(item => { if(item[field]) counts[item[field]] = (counts[item[field]] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    const total = allData.length;

    // 渲染表格
    const tbody = document.getElementById(tableId);
    tbody.innerHTML = sorted.slice(0, 15).map((item, index) => `
        <tr>
            <td class="font-bold text-gray-400 w-8">${index + 1}</td>
            <td class="font-bold">${item.name}</td>
            <td class="text-right">${item.value}</td>
            <td class="text-right text-blue-500 font-medium">${((item.value/total)*100).toFixed(1)}%</td>
        </tr>
    `).join('');

    // 渲染图表
    const chart = echarts.init(document.getElementById(chartId));
    charts[chartId] = chart;
    
    // 取前5名，其余合并为 Other
    let chartData = sorted.slice(0, 5);
    const otherVal = sorted.slice(5).reduce((sum, curr) => sum + curr.value, 0);
    if(otherVal > 0) chartData.push({ name: 'Other', value: otherVal });

    chart.setOption({
        title: {
            text: titleText,
            left: 'center',
            textStyle: { color: '#333', fontSize: 13, fontWeight: 'normal' }
        },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
            type: 'pie',
            radius: '65%', // 实心饼图
            center: ['50%', '60%'],
            itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 1 },
            label: {
                show: true,
                position: 'outside',
                formatter: '{b}',
                fontSize: 10,
                color: '#666'
            },
            data: chartData,
            // 经典的深蓝到浅蓝配色
            color: ['#003d73', '#0054a6', '#0070d2', '#3296ed', '#82c0f7']
        }]
    });
}

// --- 拍摄热力图逻辑 ---
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
            dayLabel: { fontSize: 10, firstDay: 1, color: '#999' },
            monthLabel: { fontSize: 10, color: '#999' },
            itemStyle: { borderWidth: 2, borderColor: '#fff' },
            splitLine: { show: false }
        },
        series: { type: 'heatmap', coordinateSystem: 'calendar', data: heatmapData }
    });
}

// --- 基础过滤逻辑 (保持不变) ---
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