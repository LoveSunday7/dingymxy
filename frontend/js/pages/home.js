// 首页特定的功能
function initHome() {
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

    // 加载自定义头像
    loadAvatar();

    // 如果管理员已登录，启用头像编辑
    if (api.isAdmin()) {
        setupAvatarEdit();
    }

    // 监听认证状态变化
    window.addEventListener('auth-change', () => {
        if (api.isAdmin()) {
            setupAvatarEdit();
        } else {
            removeAvatarEdit();
        }
    });
}

// 从服务器加载头像URL
function loadAvatar() {
    api.avatar.getUrl().then(result => {
        if (result && result.url) {
            updateAllAvatars(result.url);
        }
    });
}

// 更新页面上所有头像
function updateAllAvatars(url) {
    if (!url) return;
    const apiBase = APP_CONFIG.apiBaseUrl.replace('/api', '');

    // 首页头像
    const profileImg = document.getElementById('profileImg');
    if (profileImg) {
        profileImg.src = apiBase + url;
    }

    // 朋友圈头像
    document.querySelectorAll('.moment-avatar').forEach(img => {
        img.src = apiBase + url;
    });

    // 网站图标
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
        favicon.href = apiBase + url;
    }
}

// 管理员：启用头像编辑
function setupAvatarEdit() {
    const wrapper = document.querySelector('.avatar-wrapper');
    if (!wrapper) return;

    wrapper.classList.add('show-edit');

    // 点击头像选择文件
    wrapper.onclick = function () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                alert('图片大小不能超过 5MB');
                return;
            }

            const result = await api.avatar.upload(file);
            if (result && result.success) {
                updateAllAvatars(result.url);
                if (typeof showAuthNotification === 'function') {
                    showAuthNotification('头像更新成功', 'success');
                }
            } else {
                alert((result && result.message) || '上传失败');
            }
        };
        input.click();
    };
}

// 非管理员：移除编辑功能
function removeAvatarEdit() {
    const wrapper = document.querySelector('.avatar-wrapper');
    if (wrapper) {
        wrapper.classList.remove('show-edit');
        wrapper.onclick = null;
    }
}

// 导出函数
window.initHome = initHome;