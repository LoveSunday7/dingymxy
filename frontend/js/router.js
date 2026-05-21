// 路由功能 - 页面切换（带权限守卫）
const PAGE_NAMES = {
    home: '首页', resume: '简历', experience: '经历',
    blog: '博客', friends: '朋友圈', contact: '联系我',
};

// 页面权限缓存
let pageAccessCache = {};
let cacheLoaded = false;

async function loadPageAccessCache() {
    try {
        const publicResult = await api.users.listPublicPages();
        const publicPages = publicResult.public_pages || [];
        const userInfo = api.getUserInfo();

        for (const pageId of Object.keys(PAGE_NAMES)) {
            if (publicPages.includes(pageId)) {
                pageAccessCache[pageId] = true;
            } else if (userInfo && userInfo.role === 'admin') {
                pageAccessCache[pageId] = true;
            } else if (userInfo && userInfo.role === 'user') {
                // 需要检查具体权限
                const result = await api.users.checkPageAccess(pageId);
                pageAccessCache[pageId] = result.accessible || false;
            } else {
                pageAccessCache[pageId] = false;
            }
        }
        cacheLoaded = true;
    } catch (e) {
        console.warn('加载页面权限失败，默认全部可访问:', e);
        for (const pageId of Object.keys(PAGE_NAMES)) {
            pageAccessCache[pageId] = true;
        }
        cacheLoaded = true;
    }
    updateNavVisibility();
}

function refreshPageAccess() {
    cacheLoaded = false;
    pageAccessCache = {};
    loadPageAccessCache();
}

function updateNavVisibility() {
    const pageLinks = document.querySelectorAll('.nav-links a');
    pageLinks.forEach(link => {
        const pageId = link.getAttribute('data-page');
        if (pageId && pageAccessCache[pageId] === false) {
            link.style.display = 'none';
        } else {
            link.style.display = '';
        }
    });
}

function initRouter() {
    const pageLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page');

    if (pageLinks.length === 0 || pages.length === 0) return;

    // 加载权限缓存
    loadPageAccessCache();

    // 登录/登出时刷新权限
    window.addEventListener('auth-change', () => {
        refreshPageAccess();
    });

    // 页面切换函数
    async function switchPage(pageId) {
        // 权限检查
        if (cacheLoaded && pageAccessCache[pageId] === false) {
            showAccessDenied(pageId);
            return;
        }

        // 隐藏所有页面
        pages.forEach(page => page.classList.remove('active'));

        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');

        // 更新导航链接的活跃状态
        pageLinks.forEach(navLink => {
            navLink.classList.remove('active');
            if (navLink.getAttribute('data-page') === pageId) {
                navLink.classList.add('active');
            }
        });

        window.scrollTo(0, 0);

        setTimeout(() => {
            if (typeof initScrollAnimation === 'function') initScrollAnimation();
        }, 100);

        if (pageId === 'blog') {
            setTimeout(() => {
                if (typeof initBlog === 'function') initBlog();
            }, 200);
        }
    }

    // 无权限提示
    function showAccessDenied(pageId) {
        const pageName = PAGE_NAMES[pageId] || pageId;
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:2rem;">
                    <i class="fas fa-lock" style="font-size:3rem;color:var(--text-secondary);margin-bottom:1.5rem;"></i>
                    <h2 style="color:var(--text-primary);margin-bottom:0.8rem;">无法访问「${pageName}」</h2>
                    <p style="color:var(--text-secondary);margin-bottom:1.5rem;font-size:0.95rem;">
                        该页面需要授权才能访问，请先验证身份
                    </p>
                    <button class="admin-btn primary" onclick="showAuthModal()" style="padding:0.7rem 2rem;font-size:0.95rem;">
                        <i class="fas fa-user-lock"></i> 验证身份
                    </button>
                </div>
            `;
        }

        pageLinks.forEach(navLink => {
            navLink.classList.remove('active');
            if (navLink.getAttribute('data-page') === pageId) {
                navLink.classList.add('active');
            }
        });
    }

    // 为导航链接添加点击事件
    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            switchPage(targetPage);
            window.history.pushState({ page: targetPage }, '', `#${targetPage}`);
        });
    });

    // 监听URL哈希变化
    window.addEventListener('hashchange', () => {
        const pageId = window.location.hash.substring(1) || 'home';
        if (pageId.startsWith('blog/')) {
            switchPage('blog');
        } else {
            switchPage(pageId);
        }
    });

    // 监听浏览器前进后退
    window.addEventListener('popstate', (event) => {
        const pageId = event.state ? event.state.page : 'home';
        switchPage(pageId);
    });

    // 初始化页面
    const initialPageId = window.location.hash.substring(1) || 'home';
    switchPage(initialPageId);
}

window.initRouter = initRouter;
window.refreshPageAccess = refreshPageAccess;
