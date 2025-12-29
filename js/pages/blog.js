// 博客页面特定的功能
function initBlog() {
    console.log('博客页面初始化');
    
    // 初始化变量
    const blogPosts = document.querySelectorAll('.blog-post');
    const tagButtons = document.querySelectorAll('.tag-btn');
    const hotTags = document.querySelectorAll('.hot-tag');
    const searchInput = document.getElementById('blogSearch');
    const searchBtn = document.querySelector('.search-btn');
    const sortSelect = document.getElementById('blogSort');
    const readMoreBtns = document.querySelectorAll('.read-more-btn');
    const pageNumbers = document.querySelectorAll('.page-number');
    const pageBtns = document.querySelectorAll('.page-btn');
    const subscribeBtn = document.querySelector('.subscribe-btn');
    const subscribeInput = document.querySelector('.subscribe-form input');
    
    // 标签筛选功能
    tagButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            tagButtons.forEach(btn => btn.classList.remove('active'));
            // 给当前点击的按钮添加active类
            this.classList.add('active');
            
            const selectedTag = this.dataset.tag;
            filterBlogPosts(selectedTag);
        });
    });
    
    // 热门标签点击
    hotTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagName = this.dataset.tag;
            
            // 更新筛选按钮状态
            tagButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tag === tagName) {
                    btn.classList.add('active');
                }
            });
            
            filterBlogPosts(tagName);
        });
    });
    
    // 搜索功能
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 排序功能
    sortSelect.addEventListener('change', function() {
        sortBlogPosts(this.value);
    });
    
    // 阅读全文功能
    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const post = this.closest('.blog-post');
            const title = post.querySelector('.post-title').textContent;
            showBlogDetail(title);
        });
    });
    
    // 分页功能
    pageNumbers.forEach(number => {
        number.addEventListener('click', function() {
            // 移除所有页码的active类
            pageNumbers.forEach(num => num.classList.remove('active'));
            // 给当前点击的页码添加active类
            this.classList.add('active');
            
            // 模拟加载对应页码的内容
            const pageNum = parseInt(this.textContent);
            loadPage(pageNum);
        });
    });
    
    // 上一页/下一页
    pageBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            
            const currentPage = document.querySelector('.page-number.active');
            let currentPageNum = parseInt(currentPage.textContent);
            
            if (this.textContent.includes('上一页')) {
                if (currentPageNum > 1) {
                    currentPageNum--;
                }
            } else {
                if (currentPageNum < 5) {
                    currentPageNum++;
                }
            }
            
            // 更新页码状态
            pageNumbers.forEach(num => num.classList.remove('active'));
            pageNumbers[currentPageNum - 1].classList.add('active');
            
            loadPage(currentPageNum);
        });
    });
    
    // 订阅功能
    subscribeBtn.addEventListener('click', function() {
        const email = subscribeInput.value.trim();
        
        if (!email) {
            showNotification('请输入邮箱地址', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showNotification('请输入有效的邮箱地址', 'error');
            return;
        }
        
        // 模拟订阅成功
        showNotification('订阅成功！您将收到最新的博客更新通知', 'success');
        subscribeInput.value = '';
        
        // 这里可以添加实际的订阅逻辑，比如发送到后端
        console.log('用户订阅邮箱:', email);
    });
    
    // 热门文章点击
    const hotPostLinks = document.querySelectorAll('.hot-post-link');
    hotPostLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const title = this.querySelector('.hot-post-title').textContent;
            showBlogDetail(title);
        });
    });
    
    // 归档点击
    const archiveLinks = document.querySelectorAll('.archive-list a');
    archiveLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const month = this.textContent.split(' (')[0];
            filterByMonth(month);
        });
    });
    
    // 初始化动画效果
    initializeBlogAnimations();
}

// 筛选博客文章
function filterBlogPosts(tag) {
    const blogPosts = document.querySelectorAll('.blog-post');
    let visibleCount = 0;
    
    blogPosts.forEach(post => {
        const postTags = post.dataset.tags.split(',');
        
        if (tag === 'all' || postTags.includes(tag)) {
            post.style.display = 'block';
            visibleCount++;
            
            // 添加淡入动画
            setTimeout(() => {
                post.style.opacity = '1';
                post.style.transform = 'translateY(0)';
            }, 50);
        } else {
            post.style.opacity = '0';
            post.style.transform = 'translateY(20px)';
            setTimeout(() => {
                post.style.display = 'none';
            }, 300);
        }
    });
    
    // 如果没有文章显示，显示提示信息
    showNoResultsMessage(visibleCount === 0);
}

// 搜索功能
function performSearch() {
    const searchInput = document.getElementById('blogSearch');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        showNotification('请输入搜索关键词', 'error');
        return;
    }
    
    const blogPosts = document.querySelectorAll('.blog-post');
    let foundCount = 0;
    
    blogPosts.forEach(post => {
        const title = post.querySelector('.post-title').textContent.toLowerCase();
        const excerpt = post.querySelector('.post-excerpt').textContent.toLowerCase();
        const tags = post.querySelectorAll('.post-tags span');
        let tagText = '';
        tags.forEach(tag => {
            tagText += tag.textContent.toLowerCase() + ' ';
        });
        
        if (title.includes(query) || excerpt.includes(query) || tagText.includes(query)) {
            post.style.display = 'block';
            post.style.backgroundColor = 'rgba(var(--primary-color-rgb, 74, 144, 226), 0.05)';
            foundCount++;
        } else {
            post.style.display = 'none';
            post.style.backgroundColor = '';
        }
    });
    
    if (foundCount === 0) {
        showNotification(`未找到包含"${query}"的文章`, 'error');
    } else {
        showNotification(`找到${foundCount}篇相关文章`, 'success');
    }
}

// 排序博客文章
function sortBlogPosts(sortBy) {
    const blogContainer = document.querySelector('.blog-content');
    const blogPosts = Array.from(document.querySelectorAll('.blog-post'));
    
    blogPosts.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'newest':
                // 假设日期在post-date span中
                const aDate = new Date(a.querySelector('.post-date').textContent.replace(' ', ''));
                const bDate = new Date(b.querySelector('.post-date').textContent.replace(' ', ''));
                return bDate - aDate;
                
            case 'popular':
                aValue = parseInt(a.querySelector('.post-likes').textContent.replace(/,/g, ''));
                bValue = parseInt(b.querySelector('.post-likes').textContent.replace(/,/g, ''));
                return bValue - aValue;
                
            case 'views':
                aValue = parseInt(a.querySelector('.post-views').textContent.replace(/,/g, ''));
                bValue = parseInt(b.querySelector('.post-views').textContent.replace(/,/g, ''));
                return bValue - aValue;
                
            case 'comments':
                aValue = parseInt(a.querySelector('.post-comments').textContent.replace(/,/g, ''));
                bValue = parseInt(b.querySelector('.post-comments').textContent.replace(/,/g, ''));
                return bValue - aValue;
                
            default:
                return 0;
        }
    });
    
    // 重新排序DOM元素
    blogPosts.forEach(post => {
        blogContainer.appendChild(post);
    });
    
    showNotification(`已按${getSortText(sortBy)}排序`, 'success');
}

// 显示博客详情
function showBlogDetail(title) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'blog-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close"><i class="fas fa-times"></i></button>
            <div class="modal-header">
                <h2>${title}</h2>
                <div class="modal-meta">
                    <span><i class="fas fa-user"></i> 黑色小猫</span>
                    <span><i class="far fa-calendar"></i> ${getRandomDate()}</span>
                    <span><i class="far fa-eye"></i> ${getRandomNumber(2000, 5000).toLocaleString()}</span>
                </div>
            </div>
            <div class="modal-body">
                <div class="blog-content-detail">
                    <p>这是"${title}"的详细内容。在实际应用中，这里会从服务器加载完整的博客文章内容。</p>
                    <p>本文将深入探讨相关技术细节，提供完整的代码示例和最佳实践建议。由于这是演示页面，我们只展示文章的基本框架。</p>
                    
                    <h3>章节一：技术背景</h3>
                    <p>介绍相关的技术背景和历史演进，帮助读者理解当前技术的发展脉络。</p>
                    
                    <h3>章节二：核心概念</h3>
                    <p>详细讲解文章涉及的核心技术概念和原理，使用通俗易懂的语言进行解释。</p>
                    
                    <h3>章节三：实践应用</h3>
                    <p>通过实际的代码示例展示如何应用这些技术，包括最佳实践和常见问题的解决方案。</p>
                    
                    <h3>章节四：性能优化</h3>
                    <p>讨论性能优化的技巧和方法，提供实际的数据对比和优化建议。</p>
                    
                    <h3>章节五：总结与展望</h3>
                    <p>总结文章的核心观点，展望未来的发展趋势，提供进一步学习的资源推荐。</p>
                    
                    <div class="code-block">
                        <pre><code>// 示例代码
function exampleCode() {
    console.log("这里是示例代码");
    return "Hello, Blog!";
}</code></pre>
                    </div>
                </div>
                
                <div class="blog-comments">
                    <h3>评论 (86)</h3>
                    <div class="comment-form">
                        <textarea placeholder="写下你的评论..."></textarea>
                        <button class="comment-submit">提交评论</button>
                    </div>
                    
                    <div class="comment-list">
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-author">技术爱好者</span>
                                <span class="comment-date">2天前</span>
                            </div>
                            <p class="comment-content">这篇文章写得太好了，解决了我一直以来的困惑！</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // 关闭模态框
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    closeBtn.addEventListener('click', () => closeModal(modal));
    overlay.addEventListener('click', () => closeModal(modal));
    
    // ESC键关闭
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// 按月份筛选
function filterByMonth(month) {
    showNotification(`筛选${month}的文章`, 'success');
    // 在实际应用中，这里会调用API获取对应月份的文章
    console.log('筛选月份:', month);
}

// 加载分页
function loadPage(pageNum) {
    showNotification(`加载第${pageNum}页`, 'success');
    // 在实际应用中，这里会调用API获取对应页码的文章
    console.log('加载页面:', pageNum);
    
    // 更新分页按钮状态
    const pageBtns = document.querySelectorAll('.page-btn');
    if (pageNum === 1) {
        pageBtns[0].classList.add('disabled');
    } else {
        pageBtns[0].classList.remove('disabled');
    }
    
    if (pageNum === 5) {
        pageBtns[1].classList.add('disabled');
    } else {
        pageBtns[1].classList.remove('disabled');
    }
}

// 显示通知
function showNotification(message, type) {
    // 移除现有的通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        background-color: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 初始化动画
function initializeBlogAnimations() {
    const blogPosts = document.querySelectorAll('.blog-post');
    
    blogPosts.forEach((post, index) => {
        post.style.opacity = '0';
        post.style.transform = 'translateY(20px)';
        post.style.transition = 'opacity 0.5s, transform 0.5s';
        
        setTimeout(() => {
            post.style.opacity = '1';
            post.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
}

// 显示无结果消息
function showNoResultsMessage(show) {
    const existingMessage = document.querySelector('.no-results-message');
    
    if (show && !existingMessage) {
        const message = document.createElement('div');
        message.className = 'no-results-message';
        message.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-color);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3 style="margin-bottom: 0.5rem;">未找到相关文章</h3>
                <p>尝试使用其他标签或关键词进行搜索</p>
            </div>
        `;
        
        const blogContent = document.querySelector('.blog-content');
        blogContent.appendChild(message);
    } else if (!show && existingMessage) {
        existingMessage.remove();
    }
}

// 关闭模态框
function closeModal(modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
        document.body.style.overflow = 'auto';
    }, 300);
}

// 辅助函数
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function getSortText(sortBy) {
    const sortMap = {
        'newest': '最新发布',
        'popular': '最受欢迎',
        'views': '最多阅读',
        'comments': '最多评论'
    };
    return sortMap[sortBy] || '默认';
}

function getRandomDate() {
    const months = ['01', '02', '03'];
    const days = ['01', '15', '28'];
    const month = months[Math.floor(Math.random() * months.length)];
    const day = days[Math.floor(Math.random() * days.length)];
    return `2024-${month}-${day}`;
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 添加模态框CSS
function addModalStyles() {
    if (!document.querySelector('#blog-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'blog-modal-styles';
        style.textContent = `
            .blog-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
            }
            
            .modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                background-color: var(--card-bg);
                border-radius: var(--border-radius);
                overflow-y: auto;
                box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.3);
            }
            
            .modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                color: var(--text-color);
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 1;
            }
            
            .modal-header {
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid rgba(var(--primary-color-rgb, 74, 144, 226), 0.1);
            }
            
            .modal-header h2 {
                color: var(--text-color);
                margin-bottom: 1rem;
                font-size: 1.8rem;
            }
            
            .modal-meta {
                display: flex;
                gap: 1.5rem;
                color: #666;
                font-size: 0.9rem;
            }
            
            .modal-body {
                padding: 1rem 2rem 2rem;
            }
            
            .blog-content-detail {
                line-height: 1.8;
                margin-bottom: 2rem;
            }
            
            .blog-content-detail h3 {
                color: var(--primary-color);
                margin: 1.5rem 0 0.75rem;
                font-size: 1.3rem;
            }
            
            .code-block {
                background-color: rgba(0, 0, 0, 0.05);
                border-radius: 0.5rem;
                padding: 1rem;
                margin: 1rem 0;
                overflow-x: auto;
            }
            
            .code-block pre {
                margin: 0;
            }
            
            .code-block code {
                font-family: 'Courier New', monospace;
                color: #333;
            }
            
            .blog-comments {
                border-top: 1px solid rgba(var(--primary-color-rgb, 74, 144, 226), 0.1);
                padding-top: 2rem;
            }
            
            .blog-comments h3 {
                color: var(--text-color);
                margin-bottom: 1rem;
            }
            
            .comment-form textarea {
                width: 100%;
                min-height: 100px;
                padding: 0.75rem;
                border: 1px solid rgba(var(--primary-color-rgb, 74, 144, 226), 0.2);
                border-radius: 0.5rem;
                background-color: var(--card-bg);
                color: var(--text-color);
                margin-bottom: 1rem;
                resize: vertical;
            }
            
            .comment-submit {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 0.5rem 1.5rem;
                border-radius: 0.5rem;
                cursor: pointer;
            }
            
            .comment-list {
                margin-top: 2rem;
            }
            
            .comment-item {
                background-color: rgba(var(--primary-color-rgb, 74, 144, 226), 0.05);
                padding: 1rem;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
            }
            
            .comment-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }
            
            .comment-author {
                font-weight: bold;
                color: var(--primary-color);
            }
            
            .comment-date {
                color: #666;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 导出函数
window.initBlog = initBlog;