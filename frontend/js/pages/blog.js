// 博客页面 - 对接后端API版
function initBlog() {
    console.log('博客页面初始化');

    const blogList = document.getElementById('blogList');
    const blogDetail = document.getElementById('blogDetail');
    const blogControls = document.querySelector('.blog-controls');
    const blogPagination = document.getElementById('blogPagination');
    const tagButtons = document.querySelectorAll('.tag-btn');
    const searchInput = document.getElementById('blogSearch');

    let currentPage = 1;
    let totalPages = 1;
    let currentFilter = 'all';
    let isLoading = false;

    // 初始化加载文章
    loadPosts();

    // ====== 事件监听 ======

    // 标签筛选
    tagButtons.forEach(button => {
        button.addEventListener('click', function () {
            tagButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.tag;
            currentPage = 1;
            loadPosts();
        });
    });

    // 搜索（回车触发）
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            currentPage = 1;
            loadPosts();
        }
    });

    // 分页事件委托
    blogPagination.addEventListener('click', function (e) {
        const pageBtn = e.target.closest('.page-btn');
        const pageNumber = e.target.closest('.page-number');
        if (pageBtn) {
            if (pageBtn.classList.contains('disabled')) return;
            const delta = pageBtn.querySelector('.fa-chevron-left') ? -1 : 1;
            currentPage += delta;
            loadPosts();
        } else if (pageNumber) {
            currentPage = parseInt(pageNumber.textContent);
            loadPosts();
        }
    });

    // 返回列表 + 阅读全文（事件委托）
    document.addEventListener('click', function (e) {
        if (e.target.closest('.back-to-list')) {
            e.preventDefault();
            showBlogList();
        }
        if (e.target.closest('.read-more-btn')) {
            const postId = e.target.closest('.read-more-btn').dataset.post;
            if (postId) showBlogDetail(parseInt(postId));
        }
    });

    // ====== 核心功能 ======

    async function loadPosts() {
        if (isLoading) return;
        isLoading = true;
        blogList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';

        const params = { page: currentPage };
        const search = searchInput.value.trim();
        if (search) params.search = search;
        if (currentFilter !== 'all') params.tag = currentFilter;

        const result = await api.blog.listPosts(currentPage, 10, params);
        isLoading = false;

        // API返回 {posts, total, page, per_page, total_pages} 或 {success:false, message:'...'}
        if (!result.posts) {
            blogList.innerHTML = '<div class="no-results-message"><i class="fas fa-exclamation-circle"></i><h3>加载失败</h3><p>' + (result.message || '请检查后端服务是否启动') + '</p></div>';
            return;
        }

        const { posts, total, total_pages } = result;
        totalPages = total_pages;

        if (!posts || posts.length === 0) {
            blogList.innerHTML = '<div class="no-results-message"><i class="fas fa-search"></i><h3>暂无文章</h3><p>尝试使用其他标签或关键词</p></div>';
            blogPagination.style.display = 'none';
            return;
        }

        blogList.innerHTML = posts.map(post => generatePostCardHTML(post)).join('');
        renderPagination();

        // 入场动画
        document.querySelectorAll('.blog-post').forEach((post, i) => {
            post.style.opacity = '0';
            post.style.transform = 'translateY(10px)';
            post.style.transition = 'opacity 0.4s, transform 0.4s';
            setTimeout(() => { post.style.opacity = '1'; post.style.transform = 'translateY(0)'; }, 80 + i * 80);
        });
    }

    function generatePostCardHTML(post) {
        const categoryHTML = post.category
            ? `<span class="category-badge ${post.category.slug}">${post.category.name}</span>`
            : '';
        const featuredHTML = post.is_featured ? '<span class="featured-badge">精选</span>' : '';
        const tagsHTML = (post.tags || []).map(t => `<span>${t.name}</span>`).join('');
        const dateStr = post.published_at ? new Date(post.published_at).toLocaleDateString('zh-CN') : '';

        return `
            <article class="blog-post${post.is_featured ? ' featured' : ''}" data-post="${post.id}">
                ${featuredHTML}
                <div class="post-header">
                    ${categoryHTML}
                    <span class="post-date">${dateStr}</span>
                </div>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <p class="post-excerpt">${escapeHtml(post.excerpt || '')}</p>
                <div class="post-footer">
                    <div class="post-tags">${tagsHTML}</div>
                    <button class="read-more-btn" data-post="${post.id}">阅读全文 →</button>
                </div>
            </article>
        `;
    }

    async function showBlogDetail(postId) {
        blogList.style.display = 'none';
        blogControls.style.display = 'none';
        blogPagination.style.display = 'none';
        blogDetail.style.display = 'block';
        blogDetail.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';

        const post = await api.blog.getPost(postId);
        if (!post.id) {
            blogDetail.innerHTML = '<div class="no-results-message"><h3>文章不存在</h3><p>' + (post.message || '') + '</p></div>';
            return;
        }

        blogDetail.innerHTML = generateDetailHTML(post);
        initDetailEventListeners(post);
        window.history.pushState({ postId, type: 'blog-detail' }, '', `#blog/${postId}`);
        window.scrollTo(0, 0);
    }

    function showBlogList() {
        blogList.style.display = 'flex';
        blogControls.style.display = 'block';
        blogPagination.style.display = 'flex';
        blogDetail.style.display = 'none';
        window.history.pushState({ type: 'blog-list' }, '', '#blog');
        window.scrollTo(0, 0);
    }

    function generateDetailHTML(post) {
        const categoriesHTML = post.category
            ? `<span class="category-badge ${post.category.slug}">${post.category.name}</span>`
            : '';
        const tagsHTML = (post.tags || []).map(t =>
            `<a href="#" class="detail-tag" data-tag="${t.slug}">${t.name}</a>`
        ).join('');
        const relatedHTML = (post.related_posts || []).map(r => `
            <div class="related-post" data-post="${r.id}">
                <div class="related-post-title">${escapeHtml(r.title)}</div>
                <div class="related-post-meta">${r.date || ''}</div>
            </div>
        `).join('');

        const commentsHTML = (post.comments || []).map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="comment-author-info">
                            <h4>${escapeHtml(c.author_name)}</h4>
                            <span class="comment-date">${new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                    </div>
                </div>
                <div class="comment-content">${escapeHtml(c.content)}</div>
                <div class="comment-actions">
                    <button class="comment-action-btn" data-comment-id="${c.id}"><i class="far fa-thumbs-up"></i> ${c.likes}</button>
                </div>
            </div>
        `).join('');

        return `
            <a href="#" class="back-to-list">← 返回列表</a>
            <h1 class="detail-title">${escapeHtml(post.title)}</h1>
            <div class="detail-meta">
                <span><i class="far fa-calendar"></i> ${new Date(post.published_at).toLocaleDateString('zh-CN')}</span>
                <span><i class="far fa-eye"></i> ${post.views} 阅读</span>
                <span><i class="far fa-comment"></i> ${(post.comments || []).length} 评论</span>
            </div>
            <div class="detail-category">${categoriesHTML}</div>
            <div class="detail-tags">${tagsHTML}</div>
            <div class="detail-content">${post.content}</div>
            <div class="detail-actions">
                <button class="action-btn like-btn" data-post="${post.id}">
                    <i class="far fa-heart"></i> ${post.likes}
                </button>
                <button class="action-btn share-btn">
                    <i class="fas fa-share-alt"></i> 分享
                </button>
            </div>
            ${relatedHTML ? `
            <div class="related-posts">
                <h3>相关文章</h3>
                <div class="related-post-grid">${relatedHTML}</div>
            </div>` : ''}
            <div class="detail-comments">
                <h3>评论 (${(post.comments || []).length})</h3>
                <div class="comment-form">
                    <textarea placeholder="写下你的评论..."></textarea>
                    <div class="comment-form-actions">
                        <button class="comment-submit" data-post-id="${post.id}">提交评论</button>
                    </div>
                </div>
                <div class="comments-list">${commentsHTML}</div>
            </div>
        `;
    }

    function initDetailEventListeners(post) {
        // 喜欢
        const likeBtn = document.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', async function () {
                const icon = this.querySelector('i');
                if (icon.classList.contains('far')) {
                    const result = await api.blog.likePost(post.id);
                    if (result.success) {
                        icon.classList.replace('far', 'fas');
                        this.classList.add('active');
                        this.innerHTML = `<i class="fas fa-heart"></i> ${result.data.likes}`;
                        showNotification('感谢你的喜欢！', 'success');
                    }
                }
            });
        }

        // 分享
        const shareBtn = document.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function () {
                if (navigator.share) {
                    navigator.share({ title: post.title, url: window.location.href });
                } else {
                    navigator.clipboard.writeText(window.location.href);
                    showNotification('链接已复制到剪贴板', 'success');
                }
            });
        }

        // 评论提交
        const commentSubmit = document.querySelector('.comment-submit');
        const commentTextarea = document.querySelector('.comment-form textarea');
        if (commentSubmit && commentTextarea) {
            commentSubmit.addEventListener('click', async function () {
                const content = commentTextarea.value.trim();
                if (!content) { showNotification('请输入评论内容', 'error'); return; }

                const userInfo = api.getUserInfo();
                const result = await api.blog.createComment(parseInt(this.dataset.postId), {
                    author_name: userInfo ? userInfo.name : '匿名访客',
                    author_email: userInfo?.email || null,
                    content,
                });

                if (result.success) {
                    showNotification('评论提交成功！', 'success');
                    commentTextarea.value = '';
                } else {
                    showNotification(result.message || '评论提交失败', 'error');
                }
            });
            commentTextarea.addEventListener('keypress', function (e) {
                if (e.key === 'Enter' && e.ctrlKey) commentSubmit.click();
            });
        }

        // 评论点赞
        document.querySelectorAll('.comment-action-btn[data-comment-id]').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = parseInt(this.dataset.commentId);
                const result = await api.blog.likeComment(id);
                if (result.success) {
                    this.innerHTML = `<i class="fas fa-thumbs-up"></i> ${result.data.likes}`;
                    this.style.color = 'var(--primary-color)';
                }
            });
        });

        // 标签点击 → 返回列表筛选
        document.querySelectorAll('.detail-tag').forEach(tag => {
            tag.addEventListener('click', function (e) {
                e.preventDefault();
                const tagSlug = this.dataset.tag;
                showBlogList();
                setTimeout(() => {
                    tagButtons.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.tag === tagSlug) btn.classList.add('active');
                    });
                    currentFilter = tagSlug;
                    currentPage = 1;
                    loadPosts();
                }, 100);
            });
        });

        // 相关文章
        document.querySelectorAll('.related-post').forEach(el => {
            el.addEventListener('click', function () {
                showBlogDetail(parseInt(this.dataset.post));
            });
        });
    }

    // ====== 分页渲染 ======

    function renderPagination() {
        if (totalPages <= 1) {
            blogPagination.style.display = 'none';
            return;
        }
        blogPagination.style.display = 'flex';

        let numbersHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            numbersHTML += `<span class="page-number${i === currentPage ? ' active' : ''}">${i}</span>`;
        }

        blogPagination.innerHTML = `
            <button class="page-btn${currentPage <= 1 ? ' disabled' : ''}"><i class="fas fa-chevron-left"></i></button>
            <div class="page-numbers">${numbersHTML}</div>
            <button class="page-btn${currentPage >= totalPages ? ' disabled' : ''}"><i class="fas fa-chevron-right"></i></button>
        `;
    }

    // ====== 工具函数 ======

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.blog-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `blog-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 1rem; right: 1rem;
            background-color: ${type === 'success' ? '#4caf50' : '#f44336'};
            color: white; padding: 0.75rem 1.25rem;
            border-radius: 0.4rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 10000; font-size: 0.9rem;
            animation: blogSlideIn 0.25s ease;
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.25s';
            setTimeout(() => notification.remove(), 250);
        }, 2500);
    }

    // 动画样式
    if (!document.querySelector('#blog-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'blog-animation-styles';
        style.textContent = `
            @keyframes blogSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .loading-indicator {
                text-align: center; padding: 3rem; color: var(--text-secondary);
            }
        `;
        document.head.appendChild(style);
    }

    // URL历史处理
    function handleHistoryState() {
        const hash = window.location.hash;
        if (hash.startsWith('#blog/')) {
            const postId = parseInt(hash.replace('#blog/', ''));
            postId ? showBlogDetail(postId) : showBlogList();
        } else if (hash === '#blog') {
            showBlogList();
        }
    }

    window.addEventListener('hashchange', handleHistoryState);
    window.addEventListener('popstate', (e) => {
        e.state && e.state.type === 'blog-detail' ? showBlogDetail(e.state.postId) : showBlogList();
    });

    console.log('博客页面初始化完成');
}

window.initBlog = initBlog;
