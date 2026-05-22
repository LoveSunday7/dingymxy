// 首页特定的功能
function initHome() {
    loadOwnerName();
    loadSavedContent();

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

// ====== tagline & intro 内容持久化 ======

const TAGLINE_KEY = 'owner_tagline';
const INTRO_KEY = 'owner_intro';

function loadSavedContent() {
    const tagline = localStorage.getItem(TAGLINE_KEY);
    if (tagline) {
        const el = document.getElementById('taglineText');
        if (el) el.textContent = tagline;
    }
    const intro = localStorage.getItem(INTRO_KEY);
    if (intro) {
        const el = document.getElementById('introText');
        if (el) el.innerHTML = intro;
    }
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
    makeEditable('name-wrapper', 'ownerName', OWNER_NAME_KEY, true);

    // tagline 编辑
    makeEditable(null, 'taglineText', TAGLINE_KEY, false);

    // intro 编辑（保留 HTML 格式）
    makeEditable(null, 'introText', INTRO_KEY, true);
}

function disableEdits() {
    const avatarW = document.querySelector('.avatar-wrapper');
    if (avatarW && avatarW._bound) {
        avatarW.classList.remove('show-edit');
        avatarW.removeEventListener('click', onAvatarClick);
        avatarW._bound = false;
    }

    makeUneditable('name-wrapper', 'ownerName');
    makeUneditable(null, 'taglineText');
    makeUneditable(null, 'introText');
}

function makeEditable(wrapperClass, elId, storageKey, useInnerHTML) {
    const wrapper = wrapperClass ? document.querySelector('.' + wrapperClass) : null;
    const el = document.getElementById(elId);
    if (!el || el._bound) return;

    if (wrapper) wrapper.classList.add('show-edit');
    el.classList.add('editable');
    el.contentEditable = 'true';
    el.setAttribute('spellcheck', 'false');

    el.onkeydown = e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
    };

    el.onblur = () => {
        const val = useInnerHTML ? el.innerHTML.trim() : el.textContent.trim();
        if (val) {
            localStorage.setItem(storageKey, val);
        } else {
            el[useInnerHTML ? 'innerHTML' : 'textContent'] = localStorage.getItem(storageKey) || '';
        }
    };

    el._bound = true;
}

function makeUneditable(wrapperClass, elId) {
    const wrapper = wrapperClass ? document.querySelector('.' + wrapperClass) : null;
    const el = document.getElementById(elId);
    if (!el || !el._bound) return;

    if (wrapper) wrapper.classList.remove('show-edit');
    el.classList.remove('editable');
    el.contentEditable = 'false';
    el.onkeydown = null;
    el.onblur = null;
    el._bound = false;
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