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
            const updateLink = (id, key, value) => {
                const el = document.getElementById(id);
                if (el && value) {
                    el.innerText = value;
                    el.href = `gallery.html?${key}=${encodeURIComponent(value)}`;
                }
            };

            // 1. 映射带筛选功能的链接
            updateLink('link-reg', 'reg', photo.reg);
            updateLink('link-model', 'model', photo.model);
            updateLink('link-airline', 'airline', photo.airline);
            updateLink('link-date', 'date', photo.date);
            updateLink('link-airport', 'airport', photo.airport);

            // 2. 映射不带筛选功能的纯文字字段
            // 细分机型 (Sub-model)
            const subModelEl = document.getElementById('info-sub-model');
            if (subModelEl) {
                // 如果 JSON 中有 sub_model 则显示，并在前面加个空格或括号区分
                subModelEl.innerText = photo.sub_model ? `(${photo.sub_model})` : "";
            }

            // 图片备注 (Remarks)
            const remarksEl = document.getElementById('info-remarks');
            if (remarksEl) {
                remarksEl.innerText = photo.remarks || "No remarks provided for this photo.";
            }

            // 3. 其他原有逻辑保持不变
            const navReg = document.getElementById('nav-reg');
            if (navReg) navReg.innerText = photo.reg;

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
            if (e.key === 'Enter') {
                performNavSearch();
            }
        });
    }
});