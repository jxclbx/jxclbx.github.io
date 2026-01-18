const urlParams = new URLSearchParams(window.location.search);
const photoId = parseInt(urlParams.get('id'));

async function loadPhotoDetail() {
    if (!photoId) return;

    try {
        const response = await fetch('data.json');
        const allData = await response.json();
        const photo = allData.find(p => p.id === photoId);

        if (photo) {
            const bigImg = document.getElementById('big-photo');
            if (bigImg) {
                bigImg.src = photo.src;
                bigImg.classList.add('cursor-zoom-in');
                bigImg.onclick = () => {
                    const overlay = document.getElementById('fullscreen-overlay');
                    const fullImg = document.getElementById('full-size-image');
                    fullImg.src = photo.src; 
                    overlay.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                };
            }

            document.title = `${photo.reg} | ${photo.model} - Details`;

            // --- 核心增强：辅助函数，用于同时更新文字和筛选链接 ---
            // 建议在 photo-detail.js 中这样写，链接更简洁
            const updateLink = (id, key, value) => {
                const el = document.getElementById(id);
                if (el && value) {
                    el.innerText = value;
                    // 生成简洁的链接：gallery.html?airline=Emirates
                    el.href = `gallery.html?${key}=${encodeURIComponent(value)}`;
                }
            };

            // 映射字段到 gallery.js 能够识别的查询参数
            updateLink('link-reg', 'reg', photo.reg);
            updateLink('link-model', 'model', photo.model);
            updateLink('link-airline', 'airline', photo.airline);
            updateLink('link-date', 'date', photo.date);
            updateLink('link-airport', 'airport', photo.airport);

            // 导航栏注册号 (保持纯文字)
            const navReg = document.getElementById('nav-reg');
            if (navReg) navReg.innerText = photo.reg;

            // 器材信息 (保持纯文字)
            if (typeof GEAR !== 'undefined') {
                const cameraName = GEAR.cameras[photo.camera_id] || "Unknown Camera";
                const lensName = GEAR.lenses[photo.lens_id] || "Unknown Lens";
                const camEl = document.getElementById('info-camera');
                if (camEl) camEl.innerText = `${cameraName} | ${lensName}`;
            }
        }
    } catch (err) {
        console.error("Failed to load database:", err);
    }
}

document.getElementById('fullscreen-overlay').onclick = function() {
    this.classList.add('hidden');
    document.body.style.overflow = 'auto';
};

loadPhotoDetail();

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