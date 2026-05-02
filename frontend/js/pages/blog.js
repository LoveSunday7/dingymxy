// 博客页面特定的功能
function initBlog() {
    console.log('博客页面初始化');

    // 初始化变量
    const blogList = document.getElementById('blogList');
    const blogDetail = document.getElementById('blogDetail');
    const blogControls = document.querySelector('.blog-controls');
    const blogPagination = document.getElementById('blogPagination');
    const blogPosts = document.querySelectorAll('.blog-post');
    const tagButtons = document.querySelectorAll('.tag-btn');
    const hotTags = document.querySelectorAll('.hot-tag');
    const hotPostLinks = document.querySelectorAll('.hot-post-link');
    const searchInput = document.getElementById('blogSearch');
    const searchBtn = document.querySelector('.search-btn');
    const sortSelect = document.getElementById('blogSort');
    const readMoreBtns = document.querySelectorAll('.read-more-btn');
    const pageNumbers = document.querySelectorAll('.page-number');
    const pageBtns = document.querySelectorAll('.page-btn');
    const subscribeBtn = document.querySelector('.subscribe-btn');
    const subscribeInput = document.querySelector('.subscribe-form input');
    const archiveLinks = document.querySelectorAll('.archive-list a');

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
            featured: false,
            content: `
                <h2>React 18带来的变革</h2>
                <p>React 18是React框架发展历程中的一个重要里程碑，它引入了并发渲染（Concurrent Rendering）这一革命性特性，彻底改变了我们构建React应用的方式。</p>
                
                <h3>并发渲染的核心概念</h3>
                <p>并发渲染允许React应用在执行渲染任务时可以被中断，这使得应用能够更好地响应用户输入，提供更流畅的用户体验。</p>
                
                <div class="code-block">
                    <div class="code-language">JavaScript</div>
                    <pre><code>// React 18并发特性的使用示例
import { useState, useTransition } from 'react';

function SearchResults() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isPending, startTransition] = useTransition();
    
    const handleSearch = (e) => {
        const value = e.target.value;
        setQuery(value);
        
        // 使用startTransition标记非紧急更新
        startTransition(() => {
            // 模拟耗时的搜索操作
            const filteredResults = performSearch(value);
            setResults(filteredResults);
        });
    };
    
    return (
        &lt;div&gt;
            &lt;input value={query} onChange={handleSearch} /&gt;
            {isPending && &lt;span&gt;加载中...&lt;/span&gt;}
            &lt;ul&gt;
                {results.map(result => (
                    &lt;li key={result.id}&gt;{result.title}&lt;/li&gt;
                ))}
            &lt;/ul&gt;
        &lt;/div&gt;
    );
}</code></pre>
                </div>
                
                <h3>Suspense在数据获取中的应用</h3>
                <p>React 18进一步增强了Suspense的功能，使其可以用于数据获取场景，而不仅仅是代码分割。</p>
                
                <div class="code-block">
                    <div class="code-language">JavaScript</div>
                    <pre><code>// 使用Suspense进行数据获取
import { Suspense } from 'react';

function UserProfile() {
    return (
        &lt;Suspense fallback={<LoadingSpinner />}&gt;
            &lt;ProfileDetails /&gt;
            &lt;Suspense fallback={<FriendsListSkeleton />}&gt;
                &lt;FriendsList /&gt;
            &lt;/Suspense&gt;
        &lt;/Suspense&gt;
    );
}

// 在组件内部使用React.lazy和Suspense
const ProfileDetails = React.lazy(() => import('./ProfileDetails'));
const FriendsList = React.lazy(() => import('./FriendsList'));</code></pre>
                </div>
                
                <h3>性能优化实践</h3>
                <p>在实际项目中应用React 18的并发特性时，需要注意以下几点：</p>
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
                { id: 'typescript-advanced', title: 'TypeScript高级类型编程：从泛型到条件类型的实战应用', date: '2024-02-10' }
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
                <p>随着企业应用的不断复杂化，单体前端架构已经难以满足快速迭代和团队协作的需求。微前端架构将大型前端应用拆分为多个独立的子应用，每个子应用可以独立开发、测试、部署和运行。</p>
                
                <h3>技术选型：为什么选择乾坤(Qiankun)</h3>
                <p>在众多微前端框架中，我们最终选择了乾坤(Qiankun)，主要原因包括：</p>
                <ul>
                    <li>基于Single-SPA，成熟稳定</li>
                    <li>样式隔离机制完善</li>
                    <li>JavaScript沙箱机制</li>
                    <li>良好的TypeScript支持</li>
                    <li>活跃的社区和丰富的文档</li>
                </ul>
                
                <h3>架构设计</h3>
                <p>我们的微前端架构采用以下设计：</p>
                
                <div class="code-block">
                    <div class="code-language">JavaScript</div>
                    <pre><code>// 主应用配置
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
    {
        name: 'react-app',
        entry: '//localhost:7100',
        container: '#subapp-container',
        activeRule: '/react',
    },
    {
        name: 'vue-app',
        entry: '//localhost:7101',
        container: '#subapp-container',
        activeRule: '/vue',
    },
    {
        name: 'angular-app',
        entry: '//localhost:7102',
        container: '#subapp-container',
        activeRule: '/angular',
    },
]);

// 启动qiankun
start({
    sandbox: { strictStyleIsolation: true }, // 严格的样式隔离
    prefetch: true, // 预加载
});</code></pre>
                </div>
                
                <h3>样式隔离方案</h3>
                <p>样式隔离是微前端架构中的重要挑战，我们采用了以下方案：</p>
                <ul>
                    <li>使用Shadow DOM进行严格的样式隔离</li>
                    <li>建立设计系统和CSS命名规范</li>
                    <li>开发公共样式库供所有子应用使用</li>
                    <li>使用CSS-in-JS方案增强组件样式隔离</li>
                </ul>
                
                <h3>状态管理</h3>
                <p>在微前端架构中，状态管理需要特别注意：</p>
                
                <div class="code-block">
                    <div class="code-language">TypeScript</div>
                    <pre><code>// 全局状态管理接口定义
interface GlobalState {
    user: UserInfo;
    theme: ThemeConfig;
    permissions: string[];
}

// 状态共享机制
class GlobalStore {
    private state: GlobalState;
    private listeners: Function[] = [];
    
    setState(newState: Partial<GlobalState>) {
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(listener => listener(this.state));
    }
    
    subscribe(listener: Function) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    getState() {
        return this.state;
    }
}

// 在所有子应用中共享同一个实例
export const globalStore = new GlobalStore();</code></pre>
                </div>
                
                <h3>部署与运维</h3>
                <p>微前端的部署策略包括：</p>
                <ul>
                    <li>每个子应用独立部署，支持灰度发布</li>
                    <li>主应用作为容器，负责路由和公共资源</li>
                    <li>建立统一的CDN资源管理</li>
                    <li>监控每个子应用的性能和错误</li>
                </ul>
                
                <h3>总结与展望</h3>
                <p>微前端架构在大型企业应用中展现出巨大优势，但也带来了新的挑战。未来我们将继续探索模块联邦、Webpack 5等新技术在微前端架构中的应用。</p>
            `,
            relatedPosts: [
                { id: 'react-18', title: 'React 18新特性深度解析：并发渲染与Suspense的应用实践', date: '2024-03-15' },
                { id: 'architecture', title: '企业级前端架构设计原则', date: '2024-01-10' }
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
            featured: false,
            content: `
                <h2>TypeScript高级类型系统</h2>
                <p>TypeScript的类型系统提供了强大的编程能力，让开发者可以在编译时捕获更多的错误，提高代码的健壮性和可维护性。</p>
                
                <h3>泛型的进阶应用</h3>
                <p>泛型是TypeScript中最强大的特性之一，它允许我们创建可重用的组件。</p>
                
                <div class="code-block">
                    <div class="code-language">TypeScript</div>
                    <pre><code>// 泛型约束示例
interface HasLength {
    length: number;
}

function logLength<T extends HasLength>(arg: T): T {
    console.log(arg.length);
    return arg;
}

// 使用多个类型参数
function mergeObjects<T, U>(obj1: T, obj2: U): T & U {
    return { ...obj1, ...obj2 };
}

// 泛型默认值
function createArray<T = string>(length: number, value: T): T[] {
    return Array(length).fill(value);
}</code></pre>
                </div>
                
                <h3>条件类型</h3>
                <p>条件类型允许我们根据类型关系选择不同的类型，这是构建复杂类型系统的基石。</p>
                
                <div class="code-block">
                    <div class="code-language">TypeScript</div>
                    <pre><code>// 条件类型基础
type IsString<T> = T extends string ? true : false;

type Test1 = IsString<string>; // true
type Test2 = IsString<number>; // false

// 分布式条件类型
type ToArray<T> = T extends any ? T[] : never;

type Test3 = ToArray<string | number>; // string[] | number[]

// 条件类型中的infer关键字
type ElementType<T> = T extends (infer U)[] ? U : never;

type Test4 = ElementType<string[]>; // string
type Test5 = ElementType<number[]>; // number</code></pre>
                </div>
                
                <h3>映射类型</h3>
                <p>映射类型允许我们基于旧类型创建新类型，这是实现类型变换的强大工具。</p>
                
                <div class="code-block">
                    <div class="code-language">TypeScript</div>
                    <pre><code>// 基本映射类型
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

type Partial<T> = {
    [P in keyof T]?: T[P];
};

// 高级映射类型
type Nullable<T> = {
    [P in keyof T]: T[P] | null;
};

type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};

// 重映射
type Getters<T> = {
    [P in keyof T as \`get\${Capitalize<string & P>}\`]: () => T[P];
};

interface User {
    name: string;
    age: number;
}

type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number; }</code></pre>
                </div>
                
                <h3>模板字面量类型</h3>
                <p>TypeScript 4.1引入了模板字面量类型，允许我们在类型级别操作字符串。</p>
                
                <div class="code-block">
                    <div class="code-language">TypeScript</div>
                    <pre><code>// 模板字面量类型
type EventName = 'click' | 'scroll' | 'mousemove';
type HandlerName = \`on\${Capitalize<EventName>}\`;

// onClick | onScroll | onMousemove

// 类型级字符串操作
type Getter<T extends string> = \`get\${Capitalize<T>}\`;
type Setter<T extends string> = \`set\${Capitalize<T>}\`;

type Accessors<T extends string> = Getter<T> | Setter<T>;

// 高级应用：路由参数提取
type RouteParams<Route extends string> = 
    Route extends \`/\${infer Rest}\`
        ? Rest extends \`\${infer Segment}/\${infer RestSegments}\`
            ? Segment extends \`:\${infer Param}\`
                ? { [K in Param]: string } & RouteParams<\`/\${RestSegments}\`>
                : RouteParams<\`/\${RestSegments}\`>
            : Rest extends \`:\${infer Param}\`
                ? { [K in Param]: string }
                : {}
        : {};</code></pre>
                </div>
                
                <h3>实战应用：构建类型安全的API客户端</h3>
                <p>利用TypeScript的高级类型特性，我们可以构建类型安全的API客户端。</p>
                
                <div class="code-block">
                    <div class="code-language">TypeScript</div>
                    <pre><code>// API响应类型定义
interface ApiResponse<T = any> {
    data: T;
    code: number;
    message: string;
}

// API配置类型
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiConfig {
    endpoint: string;
    method: ApiMethod;
    params?: Record<string, any>;
    data?: any;
}

// 类型安全的API客户端
class ApiClient {
    async request<T>(config: ApiConfig): Promise<ApiResponse<T>> {
        const { endpoint, method, params, data } = config;
        
        // 构建URL
        let url = endpoint;
        if (params && method === 'GET') {
            const queryString = new URLSearchParams(params).toString();
            url += \`?\${queryString}\`;
        }
        
        // 发送请求
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: method !== 'GET' && data ? JSON.stringify(data) : undefined,
        });
        
        return response.json();
    }
    
    // 泛型方法
    get<T>(endpoint: string, params?: Record<string, any>) {
        return this.request<T>({ endpoint, method: 'GET', params });
    }
    
    post<T>(endpoint: string, data?: any) {
        return this.request<T>({ endpoint, method: 'POST', data });
    }
}

// 使用示例
interface User {
    id: number;
    name: string;
    email: string;
}

const api = new ApiClient();
const userResponse = await api.get<User[]>('/api/users');
const users = userResponse.data; // User[]类型</code></pre>
                </div>
                
                <h3>总结</h3>
                <p>TypeScript的高级类型系统为构建类型安全的复杂应用提供了强大的工具。通过合理应用泛型、条件类型、映射类型等特性，可以显著提高代码的质量和开发效率。</p>
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
            featured: false,
            content: 'Vue 3 Composition API详细内容...',
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
            featured: false,
            content: 'JavaScript异步编程详细内容...',
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
            featured: false,
            content: '五年编程生涯详细内容...',
            relatedPosts: [
                { id: 'microfrontend', title: '微前端架构落地实践', date: '2024-02-28' },
                { id: 'async-programming', title: 'JavaScript异步编程指南', date: '2023-12-15' }
            ]
        }
    };

    // 当前状态
    let currentPostId = null;

    // 初始化事件监听器
    function initEventListeners() {
        // 阅读全文按钮点击
        readMoreBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const postId = this.dataset.post;
                showBlogDetail(postId);
            });
        });

        // 热门文章点击
        hotPostLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const postId = this.dataset.post;
                showBlogDetail(postId);
            });
        });

        // 返回列表按钮（在详情页面生成）
        document.addEventListener('click', function (e) {
            if (e.target.closest('.back-to-list')) {
                e.preventDefault();
                showBlogList();
            }
        });

        // 标签筛选功能
        tagButtons.forEach(button => {
            button.addEventListener('click', function () {
                tagButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                const selectedTag = this.dataset.tag;
                filterBlogPosts(selectedTag);
            });
        });

        // 热门标签点击
        hotTags.forEach(tag => {
            tag.addEventListener('click', function () {
                const tagName = this.dataset.tag;
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
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // 排序功能
        sortSelect.addEventListener('change', function () {
            sortBlogPosts(this.value);
        });

        // 分页功能
        pageNumbers.forEach(number => {
            number.addEventListener('click', function () {
                pageNumbers.forEach(num => num.classList.remove('active'));
                this.classList.add('active');
                const pageNum = parseInt(this.textContent);
                loadPage(pageNum);
            });
        });

        // 上一页/下一页
        pageBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                if (this.classList.contains('disabled')) return;
                const currentPage = document.querySelector('.page-number.active');
                let currentPageNum = parseInt(currentPage.textContent);

                if (this.textContent.includes('上一页')) {
                    if (currentPageNum > 1) currentPageNum--;
                } else {
                    if (currentPageNum < 5) currentPageNum++;
                }

                pageNumbers.forEach(num => num.classList.remove('active'));
                pageNumbers[currentPageNum - 1].classList.add('active');
                loadPage(currentPageNum);
            });
        });

        // 订阅功能
        subscribeBtn.addEventListener('click', function () {
            const email = subscribeInput.value.trim();
            if (!email) {
                showNotification('请输入邮箱地址', 'error');
                return;
            }
            if (!validateEmail(email)) {
                showNotification('请输入有效的邮箱地址', 'error');
                return;
            }
            showNotification('订阅成功！您将收到最新的博客更新通知', 'success');
            subscribeInput.value = '';
        });

        // 归档点击
        archiveLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const month = this.dataset.month;
                filterByMonth(month);
            });
        });
    }

    // 显示博客详情
    function showBlogDetail(postId) {
        const postData = blogData[postId];
        if (!postData) {
            showNotification('文章不存在', 'error');
            return;
        }

        currentPostId = postId;

        // 清空搜索框
        searchInput.value = '';

        // 隐藏列表和分页，显示详情
        blogList.style.display = 'none';
        blogControls.style.display = 'none';
        blogPagination.style.display = 'none';
        blogDetail.style.display = 'block';

        // 生成详情页面内容
        const detailHTML = generateDetailHTML(postData);
        blogDetail.innerHTML = detailHTML;

        // 初始化详情页面的事件监听器
        initDetailEventListeners(postData);

        // 更新浏览器历史记录
        window.history.pushState({ postId, type: 'blog-detail' }, '', `#blog/${postId}`);

        // 滚动到顶部
        window.scrollTo(0, 0);
    }

    // 生成详情页面HTML
    function generateDetailHTML(postData) {
        const categoriesHTML = postData.categories.map(category => {
            const className = category.toLowerCase().replace(/[^a-z]/g, '');
            return `<span class="category-badge ${className}">${category}</span>`;
        }).join('');

        const tagsHTML = postData.tags.map(tag =>
            `<a href="#" class="detail-tag" data-tag="${tag.toLowerCase()}">${tag}</a>`
        ).join('');

        const relatedPostsHTML = postData.relatedPosts ? postData.relatedPosts.map(related => `
            <div class="related-post" data-post="${related.id}">
                <div class="related-post-title">${related.title}</div>
                <div class="related-post-meta">${related.date}</div>
            </div>
        `).join('') : '';

        return `
            <div class="detail-header">
                <a href="#" class="back-to-list">
                    <i class="fas fa-arrow-left"></i> 返回列表
                </a>
                <h1 class="detail-title">${postData.title}</h1>
                <div class="detail-meta">
                    <span><i class="fas fa-user"></i> ${postData.author}</span>
                    <span><i class="far fa-calendar"></i> ${postData.date}</span>
                    <span><i class="far fa-eye"></i> ${postData.views.toLocaleString()} 阅读</span>
                    <span><i class="far fa-comment"></i> ${postData.comments} 评论</span>
                    <span><i class="far fa-heart"></i> ${postData.likes} 喜欢</span>
                </div>
                <div class="detail-category">
                    ${categoriesHTML}
                </div>
                <div class="detail-stats">
                    <div class="detail-stat">
                        <div class="detail-stat-number">${postData.views.toLocaleString()}</div>
                        <div class="detail-stat-label">阅读</div>
                    </div>
                    <div class="detail-stat">
                        <div class="detail-stat-number">${postData.comments}</div>
                        <div class="detail-stat-label">评论</div>
                    </div>
                    <div class="detail-stat">
                        <div class="detail-stat-number">${postData.likes}</div>
                        <div class="detail-stat-label">喜欢</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-tags">
                ${tagsHTML}
            </div>
            
            <div class="detail-content">
                ${postData.content}
            </div>
            
            <div class="detail-actions">
                <button class="action-btn like-btn" data-post="${postData.id}">
                    <i class="far fa-heart"></i> 喜欢 (${postData.likes})
                </button>
                <button class="action-btn comment-btn">
                    <i class="far fa-comment"></i> 评论 (${postData.comments})
                </button>
                <button class="action-btn share-btn">
                    <i class="fas fa-share"></i> 分享
                </button>
            </div>
            
            ${relatedPostsHTML ? `
            <div class="related-posts">
                <h3>相关文章</h3>
                <div class="related-post-grid">
                    ${relatedPostsHTML}
                </div>
            </div>
            ` : ''}
            
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
                        <div class="comment-content">
                            这篇文章写得太好了，解决了我一直以来的困惑！
                        </div>
                        <div class="comment-actions">
                            <button class="comment-action-btn"><i class="far fa-thumbs-up"></i> 12</button>
                            <button class="comment-action-btn"><i class="fas fa-reply"></i> 回复</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 初始化详情页面事件监听器
    function initDetailEventListeners(postData) {
        // 喜欢按钮
        const likeBtn = document.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', function () {
                const icon = this.querySelector('i');
                const countSpan = this.querySelector('.like-count') ||
                    document.querySelector('.detail-stat-number:nth-child(3)');

                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    this.classList.add('active');

                    // 更新计数
                    const currentLikes = postData.likes + 1;
                    this.innerHTML = `<i class="fas fa-heart"></i> 喜欢 (${currentLikes})`;

                    // 更新统计
                    if (countSpan) {
                        countSpan.textContent = currentLikes.toLocaleString();
                    }

                    showNotification('感谢你的喜欢！', 'success');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    this.classList.remove('active');

                    // 更新计数
                    const currentLikes = postData.likes;
                    this.innerHTML = `<i class="far fa-heart"></i> 喜欢 (${currentLikes})`;

                    // 更新统计
                    if (countSpan) {
                        countSpan.textContent = currentLikes.toLocaleString();
                    }
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

                // 更新评论计数
                const commentCountSpan = document.querySelector('.detail-stat-number:nth-child(2)');
                const commentBtn = document.querySelector('.comment-btn');
                const commentsTitle = document.querySelector('.detail-comments h3');

                if (commentCountSpan && commentBtn && commentsTitle) {
                    const currentComments = parseInt(commentCountSpan.textContent) + 1;
                    commentCountSpan.textContent = currentComments;
                    commentBtn.innerHTML = `<i class="far fa-comment"></i> 评论 (${currentComments})`;
                    commentsTitle.textContent = `评论 (${currentComments})`;
                }
            });

            commentTextarea.addEventListener('keypress', function (e) {
                if (e.key === 'Enter' && e.ctrlKey) {
                    commentSubmit.click();
                }
            });
        }

        // 分享按钮
        const shareBtn = document.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function () {
                if (navigator.share) {
                    navigator.share({
                        title: postData.title,
                        text: postData.title,
                        url: window.location.href,
                    });
                } else {
                    navigator.clipboard.writeText(window.location.href);
                    showNotification('链接已复制到剪贴板', 'success');
                }
            });
        }

        // 标签点击
        const detailTags = document.querySelectorAll('.detail-tag');
        detailTags.forEach(tag => {
            tag.addEventListener('click', function (e) {
                e.preventDefault();
                const tagName = this.dataset.tag;
                showBlogList();

                // 激活对应的标签按钮
                setTimeout(() => {
                    tagButtons.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.tag === tagName) {
                            btn.classList.add('active');
                        }
                    });
                    filterBlogPosts(tagName);
                }, 100);
            });
        });

        // 相关文章点击
        const relatedPosts = document.querySelectorAll('.related-post');
        relatedPosts.forEach(post => {
            post.addEventListener('click', function () {
                const postId = this.dataset.post;
                showBlogDetail(postId);
            });
        });
    }

    // 显示博客列表
    function showBlogList() {
        blogList.style.display = 'block';
        blogControls.style.display = 'block';
        blogPagination.style.display = 'flex';
        blogDetail.style.display = 'none';

        // 更新浏览器历史记录
        window.history.pushState({ type: 'blog-list' }, '', '#blog');

        // 滚动到顶部
        window.scrollTo(0, 0);
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

        showNoResultsMessage(visibleCount === 0);
    }

    // 搜索功能
    function performSearch() {
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
            switch (sortBy) {
                case 'newest':
                    return 0; // 按HTML顺序
                case 'popular':
                    const aLikes = parseInt(a.querySelector('.post-likes').textContent.replace(/,/g, ''));
                    const bLikes = parseInt(b.querySelector('.post-likes').textContent.replace(/,/g, ''));
                    return bLikes - aLikes;
                case 'views':
                    const aViews = parseInt(a.querySelector('.post-views').textContent.replace(/,/g, ''));
                    const bViews = parseInt(b.querySelector('.post-views').textContent.replace(/,/g, ''));
                    return bViews - aViews;
                case 'comments':
                    const aComments = parseInt(a.querySelector('.post-comments').textContent.replace(/,/g, ''));
                    const bComments = parseInt(b.querySelector('.post-comments').textContent.replace(/,/g, ''));
                    return bComments - aComments;
                default:
                    return 0;
            }
        });

        blogPosts.forEach(post => {
            blogContainer.appendChild(post);
        });

        showNotification(`已按${getSortText(sortBy)}排序`, 'success');
    }

    // 按月份筛选
    function filterByMonth(month) {
        showNotification(`筛选${month}的文章`, 'success');
        // 实际应用中这里会调用API
        console.log('筛选月份:', month);
    }

    // 加载分页
    function loadPage(pageNum) {
        showNotification(`加载第${pageNum}页`, 'success');
        console.log('加载页面:', pageNum);

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
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

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

    // 处理浏览器历史记录
    function handleHistoryState() {
        const hash = window.location.hash;

        if (hash.startsWith('#blog/')) {
            const postId = hash.replace('#blog/', '');
            if (blogData[postId]) {
                showBlogDetail(postId);
            } else {
                showBlogList();
            }
        } else if (hash === '#blog') {
            showBlogList();
        }
    }

    // 添加CSS动画样式
    function addBlogStyles() {
        if (!document.querySelector('#blog-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'blog-animation-styles';
            style.textContent = `
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

    // 初始化函数
    function initialize() {
        addBlogStyles();
        initEventListeners();
        initializeBlogAnimations();

        // 处理页面加载时的状态
        handleHistoryState();

        // 监听URL变化
        window.addEventListener('hashchange', handleHistoryState);

        // 监听浏览器前进后退
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.type === 'blog-detail') {
                showBlogDetail(event.state.postId);
            } else {
                showBlogList();
            }
        });

        console.log('博客页面初始化完成');
    }

    function addBlogStyles() {
        if (!document.querySelector('#blog-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'blog-animation-styles';
            style.textContent = `
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
            
            .notification {
                position: fixed;
                top: 1rem;
                right: 1rem;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.2);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            
            .notification.success {
                background-color: #4caf50;
                color: white;
            }
            
            .notification.error {
                background-color: #f44336;
                color: white;
            }
        `;
            document.head.appendChild(style);
        }
    }

    // 开始初始化
    initialize();
}

// 导出函数
window.initBlog = initBlog;