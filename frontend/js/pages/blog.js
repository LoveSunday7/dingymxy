// 博客页面 - 简洁版
function initBlog() {
    console.log('博客页面初始化');

    const blogList = document.getElementById('blogList');
    const blogDetail = document.getElementById('blogDetail');
    const blogControls = document.querySelector('.blog-controls');
    const blogPagination = document.getElementById('blogPagination');
    const tagButtons = document.querySelectorAll('.tag-btn');
    const searchInput = document.getElementById('blogSearch');
    const readMoreBtns = document.querySelectorAll('.read-more-btn');
    const pageNumbers = document.querySelectorAll('.page-number');
    const pageBtns = document.querySelectorAll('.page-btn');

    // 博客文章数据
    const blogData = {
        'react-18': {
            id: 'react-18',
            title: 'React 18新特性深度解析：并发渲染与Suspense的应用实践',
            author: '黑色小猫',
            date: '2024-03-15',
            views: 2548,
            comments: 86,
            likes: 152,
            tags: ['React', '性能优化', '并发渲染'],
            categories: ['前端开发', 'React'],
            content: `
                <h2>React 18带来的变革</h2>
                <p>React 18是React框架发展历程中的一个重要里程碑，它引入了并发渲染（Concurrent Rendering）这一革命性特性，彻底改变了我们构建React应用的方式。</p>
                
                <h3>并发渲染的核心概念</h3>
                <p>并发渲染允许React应用在执行渲染任务时可以被中断，这使得应用能够更好地响应用户输入，提供更流畅的用户体验。</p>
                
                <div class="code-block">
                    <div class="code-language">JavaScript</div>
                    <pre><code>import { useState, useTransition } from 'react';

function SearchResults() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isPending, startTransition] = useTransition();
    
    const handleSearch = (e) => {
        const value = e.target.value;
        setQuery(value);
        startTransition(() => {
            const filteredResults = performSearch(value);
            setResults(filteredResults);
        });
    };
    
    return (
        &lt;div&gt;
            &lt;input value={query} onChange={handleSearch} /&gt;
            {isPending && &lt;span&gt;加载中...&lt;/span&gt;}
            &lt;ul&gt;{results.map(r => &lt;li key={r.id}&gt;{r.title}&lt;/li&gt;)}&lt;/ul&gt;
        &lt;/div&gt;
    );
}</code></pre>
                </div>
                
                <h3>Suspense在数据获取中的应用</h3>
                <p>React 18进一步增强了Suspense的功能，使其可以用于数据获取场景，而不仅仅是代码分割。</p>
                
                <h3>性能优化实践</h3>
                <ul>
                    <li>合理使用useTransition标记非紧急更新</li>
                    <li>利用useDeferredValue延迟计算昂贵的值</li>
                    <li>优化Suspense边界的设计</li>
                    <li>监控和测量应用的性能指标</li>
                </ul>
                
                <h3>总结</h3>
                <p>React 18的并发特性为构建高性能、响应式的Web应用提供了强大的工具。通过合理应用这些新特性，可以显著提升大型React应用的用户体验。</p>
            `,
            relatedPosts: [
                { id: 'microfrontend', title: '微前端架构在大型企业应用中的落地实践与挑战', date: '2024-02-28' },
                { id: 'typescript-advanced', title: 'TypeScript高级类型编程', date: '2024-02-10' }
            ]
        },
        'microfrontend': {
            id: 'microfrontend',
            title: '微前端架构在大型企业应用中的落地实践与挑战',
            author: '黑色小猫',
            date: '2024-02-28',
            views: 3892,
            comments: 124,
            likes: 235,
            tags: ['微前端', '架构设计', '乾坤'],
            categories: ['前端开发', 'JavaScript'],
            featured: true,
            content: `
                <h2>微前端架构的必要性</h2>
                <p>随着企业应用的不断复杂化，单体前端架构已经难以满足快速迭代和团队协作的需求。微前端架构将大型前端应用拆分为多个独立的子应用。</p>
                
                <h3>技术选型：为什么选择乾坤(Qiankun)</h3>
                <ul>
                    <li>基于Single-SPA，成熟稳定</li>
                    <li>样式隔离机制完善</li>
                    <li>JavaScript沙箱机制</li>
                    <li>良好的TypeScript支持</li>
                </ul>
                
                <div class="code-block">
                    <div class="code-language">JavaScript</div>
                    <pre><code>import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
    { name: 'react-app', entry: '//localhost:7100', container: '#subapp-container', activeRule: '/react' },
    { name: 'vue-app', entry: '//localhost:7101', container: '#subapp-container', activeRule: '/vue' },
]);

start({ sandbox: { strictStyleIsolation: true }, prefetch: true });</code></pre>
                </div>
                
                <h3>总结与展望</h3>
                <p>微前端架构在大型企业应用中展现出巨大优势，但也带来了新的挑战。未来我们将继续探索模块联邦等新技术在微前端架构中的应用。</p>
            `,
            relatedPosts: [
                { id: 'react-18', title: 'React 18新特性深度解析', date: '2024-03-15' }
            ]
        },
        'typescript-advanced': {
            id: 'typescript-advanced',
            title: 'TypeScript高级类型编程：从泛型到条件类型的实战应用',
            author: '黑色小猫',
            date: '2024-02-10',
            views: 1874,
            comments: 45,
            likes: 89,
            tags: ['TypeScript', '类型系统', '泛型'],
            categories: ['前端开发', 'TypeScript'],
            content: `
                <h2>TypeScript高级类型系统</h2>
                <p>TypeScript的类型系统提供了强大的编程能力，让开发者可以在编译时捕获更多的错误。</p>
                
                <h3>泛型的进阶应用</h3>
                <div class="code-block">
                    <div class="code-language">TypeScript</div>
                    <pre><code>interface HasLength { length: number; }

function logLength&lt;T extends HasLength&gt;(arg: T): T {
    console.log(arg.length);
    return arg;
}

function mergeObjects&lt;T, U&gt;(obj1: T, obj2: U): T & U {
    return { ...obj1, ...obj2 };
}</code></pre>
                </div>
                
                <h3>条件类型</h3>
                <div class="code-block">
                    <div class="code-language">TypeScript</div>
                    <pre><code>type IsString&lt;T&gt; = T extends string ? true : false;
type ElementType&lt;T&gt; = T extends (infer U)[] ? U : never;

type Test1 = IsString&lt;string&gt;;  // true
type Test2 = ElementType&lt;string[]&gt;; // string</code></pre>
                </div>
                
                <h3>总结</h3>
                <p>TypeScript的高级类型系统为构建类型安全的复杂应用提供了强大的工具，显著提高代码质量和开发效率。</p>
            `,
            relatedPosts: [
                { id: 'vue3-composition', title: 'Vue 3 Composition API最佳实践', date: '2024-01-22' },
                { id: 'async-programming', title: '现代JavaScript异步编程完全指南', date: '2023-12-15' }
            ]
        },
        'vue3-composition': {
            id: 'vue3-composition',
            title: 'Vue 3 Composition API最佳实践：从Options API到Composition API的平滑迁移',
            author: '黑色小猫',
            date: '2024-01-22',
            views: 2157,
            comments: 67,
            likes: 112,
            tags: ['Vue 3', 'Composition API', '性能优化'],
            categories: ['前端开发', 'Vue.js'],
            content: '<h2>Vue 3 Composition API</h2><p>Vue 3的Composition API彻底改变了我们组织Vue组件逻辑的方式...</p><h3>迁移要点</h3><ul><li>理解setup()函数的生命周期</li><li>使用ref和reactive管理状态</li><li>合理拆分组合式函数</li></ul><h3>总结</h3><p>Composition API让代码更加可维护和可复用，是Vue 3开发的推荐方式。</p>',
            relatedPosts: [
                { id: 'react-18', title: 'React 18新特性深度解析', date: '2024-03-15' },
                { id: 'typescript-advanced', title: 'TypeScript高级类型编程', date: '2024-02-10' }
            ]
        },
        'async-programming': {
            id: 'async-programming',
            title: '现代JavaScript异步编程完全指南：从Promise到Async/Await再到Observables',
            author: '黑色小猫',
            date: '2023-12-15',
            views: 3025,
            comments: 92,
            likes: 178,
            tags: ['JavaScript', '异步编程', 'Promise'],
            categories: ['前端开发', 'JavaScript'],
            content: '<h2>JavaScript异步编程</h2><p>异步编程是现代JavaScript开发的核心技能...</p><h3>Promise基础</h3><p>Promise提供了更优雅的异步操作管理方式。</p><h3>Async/Await</h3><p>Async/Await让异步代码看起来像同步代码，极大提升了可读性。</p><h3>总结</h3><p>掌握异步编程是成为优秀JavaScript开发者的必经之路。</p>',
            relatedPosts: [
                { id: 'typescript-advanced', title: 'TypeScript高级类型编程', date: '2024-02-10' },
                { id: 'programming-journey', title: '五年编程生涯感悟', date: '2023-11-30' }
            ]
        },
        'programming-journey': {
            id: 'programming-journey',
            title: '五年编程生涯感悟：从代码新手到架构师的成长之路',
            author: '黑色小猫',
            date: '2023-11-30',
            views: 4892,
            comments: 156,
            likes: 324,
            tags: ['职业发展', '成长历程', '学习心得'],
            categories: ['生活感悟'],
            content: '<h2>五年编程生涯</h2><p>回顾五年的编程生涯，从一个只会写静态页面的新手，成长为能够独立负责大型项目架构的前端工程师。</p><h3>学习方法</h3><ul><li>坚持写技术博客</li><li>参与开源项目</li><li>持续学习新技术</li></ul><h3>总结</h3><p>成长没有捷径，唯有坚持和热爱。</p>',
            relatedPosts: [
                { id: 'microfrontend', title: '微前端架构落地实践', date: '2024-02-28' },
                { id: 'async-programming', title: 'JavaScript异步编程指南', date: '2023-12-15' }
            ]
        }
    };

    let currentPostId = null;

    // ====== 事件监听 ======

    // 阅读全文
    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            showBlogDetail(this.dataset.post);
        });
    });

    // 返回列表
    document.addEventListener('click', function (e) {
        if (e.target.closest('.back-to-list')) {
            e.preventDefault();
            showBlogList();
        }
    });

    // 标签筛选
    tagButtons.forEach(button => {
        button.addEventListener('click', function () {
            tagButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            filterBlogPosts(this.dataset.tag);
        });
    });

    // 搜索（回车触发）
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') performSearch();
    });

    // 分页
    pageNumbers.forEach(number => {
        number.addEventListener('click', function () {
            pageNumbers.forEach(num => num.classList.remove('active'));
            this.classList.add('active');
            loadPage(parseInt(this.textContent));
        });
    });

    pageBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.classList.contains('disabled')) return;
            const currentPage = parseInt(document.querySelector('.page-number.active').textContent);
            const pageNum = this.querySelector('.fa-chevron-left') ? currentPage - 1 : currentPage + 1;
            if (pageNum < 1 || pageNum > 5) return;
            pageNumbers.forEach(num => num.classList.remove('active'));
            pageNumbers[pageNum - 1].classList.add('active');
            loadPage(pageNum);
        });
    });

    // ====== 核心功能 ======

    function showBlogDetail(postId) {
        const postData = blogData[postId];
        if (!postData) return;

        currentPostId = postId;
        searchInput.value = '';

        blogList.style.display = 'none';
        blogControls.style.display = 'none';
        blogPagination.style.display = 'none';
        blogDetail.style.display = 'block';

        blogDetail.innerHTML = generateDetailHTML(postData);
        initDetailEventListeners(postData);

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

    function generateDetailHTML(postData) {
        const categoriesHTML = postData.categories.map(c => {
            const cls = c.toLowerCase().replace(/[^a-z]/g, '');
            return `<span class="category-badge ${cls}">${c}</span>`;
        }).join('');

        const tagsHTML = postData.tags.map(t =>
            `<a href="#" class="detail-tag" data-tag="${t.toLowerCase()}">${t}</a>`
        ).join('');

        const relatedHTML = postData.relatedPosts ? postData.relatedPosts.map(r => `
            <div class="related-post" data-post="${r.id}">
                <div class="related-post-title">${r.title}</div>
                <div class="related-post-meta">${r.date}</div>
            </div>
        `).join('') : '';

        return `
            <a href="#" class="back-to-list">← 返回列表</a>
            <h1 class="detail-title">${postData.title}</h1>
            <div class="detail-meta">
                <span><i class="far fa-calendar"></i> ${postData.date}</span>
                <span><i class="far fa-eye"></i> ${postData.views.toLocaleString()} 阅读</span>
                <span><i class="far fa-comment"></i> ${postData.comments} 评论</span>
            </div>
            <div class="detail-category">${categoriesHTML}</div>
            <div class="detail-tags">${tagsHTML}</div>
            <div class="detail-content">${postData.content}</div>
            <div class="detail-actions">
                <button class="action-btn like-btn" data-post="${postData.id}">
                    <i class="far fa-heart"></i> ${postData.likes}
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
                <h3>评论 (${postData.comments})</h3>
                <div class="comment-form">
                    <textarea placeholder="写下你的评论..."></textarea>
                    <div class="comment-form-actions">
                        <button class="comment-submit">提交评论</button>
                    </div>
                </div>
                <div class="comments-list">
                    <div class="comment-item">
                        <div class="comment-header">
                            <div class="comment-author">
                                <div class="comment-author-info">
                                    <h4>技术爱好者</h4>
                                    <span class="comment-date">2天前</span>
                                </div>
                            </div>
                        </div>
                        <div class="comment-content">这篇文章写得太好了，解决了我一直以来的困惑！</div>
                        <div class="comment-actions">
                            <button class="comment-action-btn"><i class="far fa-thumbs-up"></i> 12</button>
                            <button class="comment-action-btn"><i class="fas fa-reply"></i> 回复</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function initDetailEventListeners(postData) {
        // 喜欢按钮
        const likeBtn = document.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', function () {
                const icon = this.querySelector('i');
                if (icon.classList.contains('far')) {
                    icon.classList.replace('far', 'fas');
                    this.classList.add('active');
                    this.innerHTML = `<i class="fas fa-heart"></i> ${postData.likes + 1}`;
                    showNotification('感谢你的喜欢！', 'success');
                } else {
                    icon.classList.replace('fas', 'far');
                    this.classList.remove('active');
                    this.innerHTML = `<i class="far fa-heart"></i> ${postData.likes}`;
                }
            });
        }

        // 分享按钮
        const shareBtn = document.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function () {
                if (navigator.share) {
                    navigator.share({ title: postData.title, url: window.location.href });
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
            commentSubmit.addEventListener('click', function () {
                const comment = commentTextarea.value.trim();
                if (!comment) {
                    showNotification('请输入评论内容', 'error');
                    return;
                }
                showNotification('评论提交成功，等待审核', 'success');
                commentTextarea.value = '';
            });
            commentTextarea.addEventListener('keypress', function (e) {
                if (e.key === 'Enter' && e.ctrlKey) commentSubmit.click();
            });
        }

        // 标签点击 → 返回列表并筛选
        document.querySelectorAll('.detail-tag').forEach(tag => {
            tag.addEventListener('click', function (e) {
                e.preventDefault();
                const tagName = this.dataset.tag;
                showBlogList();
                setTimeout(() => {
                    tagButtons.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.tag === tagName) btn.classList.add('active');
                    });
                    filterBlogPosts(tagName);
                }, 100);
            });
        });

        // 相关文章点击
        document.querySelectorAll('.related-post').forEach(post => {
            post.addEventListener('click', function () {
                showBlogDetail(this.dataset.post);
            });
        });
    }

    function filterBlogPosts(tag) {
        const posts = document.querySelectorAll('.blog-post');
        let visibleCount = 0;

        posts.forEach(post => {
            const postTags = post.dataset.tags.split(',');
            if (tag === 'all' || postTags.includes(tag)) {
                post.style.display = 'block';
                visibleCount++;
                setTimeout(() => { post.style.opacity = '1'; post.style.transform = 'translateY(0)'; }, 50);
            } else {
                post.style.opacity = '0';
                post.style.transform = 'translateY(10px)';
                setTimeout(() => { post.style.display = 'none'; }, 200);
            }
        });

        showNoResultsMessage(visibleCount === 0);
    }

    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        const posts = document.querySelectorAll('.blog-post');
        let foundCount = 0;

        posts.forEach(post => {
            const title = post.querySelector('.post-title').textContent.toLowerCase();
            const excerpt = post.querySelector('.post-excerpt').textContent.toLowerCase();
            if (title.includes(query) || excerpt.includes(query)) {
                post.style.display = 'block';
                foundCount++;
            } else {
                post.style.display = 'none';
            }
        });

        showNoResultsMessage(foundCount === 0);
        showNotification(foundCount > 0 ? `找到${foundCount}篇相关文章` : '未找到相关文章', foundCount > 0 ? 'success' : 'error');
    }

    function loadPage(pageNum) {
        const btns = document.querySelectorAll('.page-btn');
        btns[0].classList.toggle('disabled', pageNum === 1);
        btns[1].classList.toggle('disabled', pageNum === 5);
    }

    function showNoResultsMessage(show) {
        const existing = document.querySelector('.no-results-message');
        if (show && !existing) {
            const msg = document.createElement('div');
            msg.className = 'no-results-message';
            msg.innerHTML = '<i class="fas fa-search"></i><h3>未找到相关文章</h3><p>尝试使用其他标签或关键词</p>';
            blogList.appendChild(msg);
        } else if (!show && existing) {
            existing.remove();
        }
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

    // 添加动画样式
    if (!document.querySelector('#blog-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'blog-animation-styles';
        style.textContent = `
            @keyframes blogSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // 入场动画
    document.querySelectorAll('.blog-post').forEach((post, i) => {
        post.style.opacity = '0';
        post.style.transform = 'translateY(10px)';
        post.style.transition = 'opacity 0.4s, transform 0.4s';
        setTimeout(() => { post.style.opacity = '1'; post.style.transform = 'translateY(0)'; }, 80 + i * 80);
    });

    // URL历史记录处理
    function handleHistoryState() {
        const hash = window.location.hash;
        if (hash.startsWith('#blog/')) {
            const postId = hash.replace('#blog/', '');
            blogData[postId] ? showBlogDetail(postId) : showBlogList();
        } else if (hash === '#blog') {
            showBlogList();
        }
    }

    handleHistoryState();
    window.addEventListener('hashchange', handleHistoryState);
    window.addEventListener('popstate', (e) => {
        e.state && e.state.type === 'blog-detail' ? showBlogDetail(e.state.postId) : showBlogList();
    });

    console.log('博客页面初始化完成');
}

window.initBlog = initBlog;
