// 首页特定的功能
function initHome() {
    loadOwnerName();

    // 为兴趣项添加延迟动画
    const interestItems = document.querySelectorAll('.interest-item');
    interestItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.5s, transform 0.5s';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 300 + index * 100);
    });

    loadAvatar();

    // 管理员登录后才启用编辑
    if (api.isAdmin()) {
        enableEdits();
    }

    // 监听登录/登出
    window.addEventListener('auth-change', () => {
        if (api.isAdmin()) {
            enableEdits();
        } else {
            disableEdits();
        }
    });
}

// ====== 头像 ======

function loadAvatar() {
    api.avatar.getUrl().then(result => {
        if (result && result.url) {
            updateAllAvatars(result.url);
        }
    });
}

function updateAllAvatars(url) {
    if (!url) return;
    const apiBase = APP_CONFIG.apiBaseUrl.replace('/api', '');
    const profileImg = document.getElementById('profileImg');
    if (profileImg) profileImg.src = apiBase + url;
    document.querySelectorAll('.moment-avatar').forEach(img => { img.src = apiBase + url; });
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) favicon.href = apiBase + url;
}

// ====== 名称 ======

const OWNER_NAME_KEY = 'owner_name';

function loadOwnerName() {
    const saved = localStorage.getItem(OWNER_NAME_KEY);
    if (saved) applyOwnerName(saved);
}

function applyOwnerName(name) {
    const h1 = document.getElementById('ownerName');
    if (h1) h1.textContent = name;
    document.title = name + '的GitHub小窝';
    if (window.APP_CONFIG && APP_CONFIG.site) {
        APP_CONFIG.site.name = name + '的GitHub小窝';
        APP_CONFIG.site.author = name;
    }
    document.querySelectorAll('.quote-author').forEach(el => { el.textContent = '————' + name; });
    const logoEl = document.querySelector('.logo span');
    if (logoEl) logoEl.textContent = name + '的小窝';
    document.querySelectorAll('.moment-username').forEach(el => { el.textContent = name; });
}

// ====== 编辑开关 ======

function enableEdits() {
    // 头像编辑
    const avatarW = document.querySelector('.avatar-wrapper');
    if (avatarW && !avatarW._bound) {
        avatarW.classList.add('show-edit');
        avatarW.addEventListener('click', onAvatarClick);
        avatarW._bound = true;
    }

    // 名称编辑
    const nameW = document.querySelector('.name-wrapper');
    const h1 = document.getElementById('ownerName');
    if (nameW && h1 && !nameW._bound) {
        nameW.classList.add('show-edit');
        h1.contentEditable = 'true';
        h1.setAttribute('spellcheck', 'false');
        h1.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); h1.blur(); } };
        h1.onblur = () => {
            const n = h1.textContent.trim();
            if (n) { localStorage.setItem(OWNER_NAME_KEY, n); applyOwnerName(n); }
            else { h1.textContent = localStorage.getItem(OWNER_NAME_KEY) || '黑色小猫'; }
        };
        nameW._bound = true;
    }
}

function disableEdits() {
    const avatarW = document.querySelector('.avatar-wrapper');
    if (avatarW && avatarW._bound) {
        avatarW.classList.remove('show-edit');
        avatarW.removeEventListener('click', onAvatarClick);
        avatarW._bound = false;
    }

    const nameW = document.querySelector('.name-wrapper');
    const h1 = document.getElementById('ownerName');
    if (nameW && h1 && nameW._bound) {
        nameW.classList.remove('show-edit');
        h1.contentEditable = 'false';
        h1.onkeydown = null;
        h1.onblur = null;
        nameW._bound = false;
    }
}

function onAvatarClick() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('图片大小不能超过 5MB'); return; }
        const result = await api.avatar.upload(file);
        if (result && result.success) {
            updateAllAvatars(result.url);
            if (typeof showAuthNotification === 'function') showAuthNotification('头像更新成功', 'success');
        } else {
            alert((result && result.message) || '上传失败');
        }
    };
    input.click();
}

// 导出
window.initHome = initHome;