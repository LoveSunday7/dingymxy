// 路由功能 - 页面切换
function initRouter() {
    const pageLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page');
    
    if (pageLinks.length === 0 || pages.length === 0) return;
    
    // 页面切换函数
    function switchPage(pageId) {
        // 隐藏所有页面
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // 更新导航链接的活跃状态
        pageLinks.forEach(navLink => {
            navLink.classList.remove('active');
            if (navLink.getAttribute('data-page') === pageId) {
                navLink.classList.add('active');
            }
        });
        
        // 滚动到顶部
        window.scrollTo(0, 0);
        
        // 初始化页面特定的动画
        setTimeout(() => {
            if (typeof initScrollAnimation === 'function') {
                initScrollAnimation();
            }
        }, 100);
        
        // 如果是博客页面，检查是否需要显示详情
        if (pageId === 'blog') {
            setTimeout(() => {
                if (typeof initBlog === 'function') {
                    initBlog();
                }
            }, 200);
        }
    }
    
    // 为导航链接添加点击事件
    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 获取目标页面ID
            const targetPage = link.getAttribute('data-page');
            
            // 切换页面
            switchPage(targetPage);
            
            // 更新URL哈希
            window.history.pushState({ page: targetPage }, '', `#${targetPage}`);
        });
    });
    
    // 监听URL哈希变化
    window.addEventListener('hashchange', () => {
        const pageId = window.location.hash.substring(1) || 'home';
        if (pageId.startsWith('blog/')) {
            // 如果是博客详情，确保博客页面已激活
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
    
    // 初始化页面 - 检查URL哈希或默认显示首页
    const initialPageId = window.location.hash.substring(1) || 'home';
    switchPage(initialPageId);
}

// 导出函数
window.initRouter = initRouter;