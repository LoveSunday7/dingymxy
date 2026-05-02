// 身份验证模块
function initAuth() {
    console.log('认证模块初始化');

    // 注入弹窗HTML
    if (!document.getElementById('authModal')) {
        fetch('./modules/auth-modal.html')
            .then(r => r.text())
            .then(html => {
                document.body.insertAdjacentHTML('beforeend', html);
                bindAuthEvents();
                checkAuthStatus();
            })
            .catch(() => console.warn('认证弹窗加载失败'));
    } else {
        bindAuthEvents();
        checkAuthStatus();
    }

    // 监听登出事件
    window.addEventListener('auth-change', (e) => {
        if (e.detail.loggedOut) {
            checkAuthStatus();
        }
    });
}

function bindAuthEvents() {
    const modal = document.getElementById('authModal');
    const closeBtn = document.getElementById('authClose');
    const visitorSubmit = document.getElementById('authVisitorSubmit');
    const adminSubmit = document.getElementById('authAdminSubmit');
    const switchToAdmin = document.getElementById('switchToAdmin');
    const switchToVisitor = document.getElementById('switchToVisitor');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!modal) return;

    // 关闭弹窗
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    modal.querySelector('.auth-overlay').addEventListener('click', () => modal.style.display = 'none');

    // 切换表单
    switchToAdmin.addEventListener('click', () => {
        document.getElementById('visitorForm').style.display = 'none';
        document.getElementById('adminForm').style.display = 'block';
    });
    switchToVisitor.addEventListener('click', () => {
        document.getElementById('adminForm').style.display = 'none';
        document.getElementById('visitorForm').style.display = 'block';
    });

    // 访客验证：只需姓名 + 认证码
    visitorSubmit.addEventListener('click', async () => {
        const name = document.getElementById('authName').value.trim();
        const code = document.getElementById('authAccessCode').value.trim();

        if (!name || !code) {
            showAuthNotification('请输入姓名和认证码', 'error');
            return;
        }

        visitorSubmit.disabled = true;
        visitorSubmit.textContent = '验证中...';

        const result = await api.auth.verifyVisitor(code, name);

        visitorSubmit.disabled = false;
        visitorSubmit.textContent = '验证身份';

        if (result.access_token) {
            localStorage.setItem(APP_CONFIG.tokenKey, result.access_token);
            localStorage.setItem(APP_CONFIG.userInfoKey, JSON.stringify(result.user_info));
            modal.style.display = 'none';
            showAuthNotification('验证成功！欢迎，' + result.user_info.name, 'success');
            checkAuthStatus();
            window.dispatchEvent(new CustomEvent('auth-change', { detail: { loggedIn: true } }));
        } else {
            showAuthNotification(result.message || '验证失败', 'error');
        }
    });

    // 管理员登录：只需口令
    adminSubmit.addEventListener('click', async () => {
        const passphrase = document.getElementById('authAdminPass').value.trim();

        if (!passphrase) {
            showAuthNotification('请输入管理员口令', 'error');
            return;
        }

        adminSubmit.disabled = true;
        adminSubmit.textContent = '登录中...';

        const result = await api.auth.adminLogin(passphrase);

        adminSubmit.disabled = false;
        adminSubmit.textContent = '管理员登录';

        if (result.access_token) {
            localStorage.setItem(APP_CONFIG.tokenKey, result.access_token);
            localStorage.setItem(APP_CONFIG.userInfoKey, JSON.stringify(result.user_info));
            modal.style.display = 'none';
            showAuthNotification('管理员登录成功', 'success');
            checkAuthStatus();
            window.dispatchEvent(new CustomEvent('auth-change', { detail: { loggedIn: true } }));
        } else {
            showAuthNotification(result.message || '登录失败', 'error');
        }
    });

    // 登出
    logoutBtn.addEventListener('click', () => {
        api.logout();
        showAuthNotification('已退出', 'success');
    });
}

function checkAuthStatus() {
    const statusBar = document.getElementById('userStatusBar');
    const displayName = document.getElementById('userDisplayName');
    if (!statusBar) return;

    const userInfo = api.getUserInfo();
    if (userInfo) {
        statusBar.style.display = 'flex';
        displayName.textContent = userInfo.name || userInfo.username || '已登录';
    } else {
        statusBar.style.display = 'none';
    }
}

// 全局打开登录弹窗
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

function showAuthNotification(message, type) {
    const existing = document.querySelector('.auth-notification');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = `auth-notification ${type}`;
    el.textContent = message;
    el.style.cssText = `
        position: fixed; top: 1rem; right: 1rem;
        background-color: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white; padding: 0.7rem 1.2rem;
        border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 10002; font-size: 0.85rem;
        animation: authFadeIn 0.2s ease;
    `;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.2s';
        setTimeout(() => el.remove(), 200);
    }, 2500);
}

window.initAuth = initAuth;
window.showAuthModal = showAuthModal;
