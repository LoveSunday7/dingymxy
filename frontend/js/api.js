// 前端配置文件 - 可根据部署环境修改
const APP_CONFIG = {
    // 后端API地址
    apiBaseUrl: 'http://172.18.217.177:8000/api',
    // 站点信息
    site: {
        name: '黑色小猫咪的GitHub小窝',
        author: '黑色小猫',
    },
    // Token存储键名
    tokenKey: 'blog_access_token',
    userInfoKey: 'blog_user_info',
};

// API请求封装
const api = {
    // 通用请求方法
    async request(url, options = {}) {
        const token = localStorage.getItem(APP_CONFIG.tokenKey);
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${APP_CONFIG.apiBaseUrl}${url}`, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                localStorage.removeItem(APP_CONFIG.tokenKey);
                localStorage.removeItem(APP_CONFIG.userInfoKey);
                // 不自动跳转，只在需要时提示
                return { success: false, message: '登录已过期，请重新验证' };
            }

            const data = await response.json();
            if (!response.ok) {
                return { success: false, message: data.detail || '请求失败' };
            }
            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            return { success: false, message: '网络连接失败，请检查后端服务是否启动' };
        }
    },

    // GET
    get(url, params = {}) {
        const query = new URLSearchParams(params).toString();
        const fullUrl = query ? `${url}?${query}` : url;
        return this.request(fullUrl);
    },

    // POST
    post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // PUT
    put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // DELETE
    delete(url) {
        return this.request(url, { method: 'DELETE' });
    },

    // ====== 认证 ======
    auth: {
        adminLogin(passphrase) {
            return api.post('/auth/admin/login', { passphrase });
        },
        verifyVisitor(accessCode, name) {
            return api.post('/auth/verify', { access_code: accessCode, name });
        },
        getMe() {
            return api.get('/auth/me');
        },
    },

    // ====== 博客 ======
    blog: {
        listPosts(page = 1, perPage = 10, params = {}) {
            return api.get('/blog/posts', { page, per_page: perPage, ...params });
        },
        getPost(id) {
            return api.get(`/blog/posts/${id}`);
        },
        createPost(data) {
            return api.post('/blog/posts', data);
        },
        updatePost(id, data) {
            return api.put(`/blog/posts/${id}`, data);
        },
        deletePost(id) {
            return api.delete(`/blog/posts/${id}`);
        },
        likePost(id) {
            return api.post(`/blog/posts/${id}/like`, {});
        },
        getCategories() {
            return api.get('/blog/categories');
        },
        getTags() {
            return api.get('/blog/tags');
        },
        createComment(postId, data) {
            return api.post(`/blog/posts/${postId}/comments`, data);
        },
        likeComment(commentId) {
            return api.post(`/blog/comments/${commentId}/like`, {});
        },
    },

    // ====== 留言板 ======
    messages: {
        list(page = 1, perPage = 20) {
            return api.get('/messages', { page, per_page: perPage });
        },
        create(data) {
            return api.post('/messages', data);
        },
        like(id) {
            return api.post(`/messages/${id}/like`, {});
        },
        delete(id) {
            return api.delete(`/messages/${id}`);
        },
    },

    // ====== 用户管理（管理员） ======
    users: {
        list(page = 1, perPage = 20, search) {
            const params = { page, per_page: perPage };
            if (search) params.search = search;
            return api.get('/users', params);
        },
        create(data) {
            return api.post('/users', data);
        },
        update(id, data) {
            return api.put(`/users/${id}`, data);
        },
        delete(id) {
            return api.delete(`/users/${id}`);
        },
        getPermissions(userId) {
            return api.get(`/users/${userId}/permissions`);
        },
        addPermission(userId, data) {
            return api.post(`/users/${userId}/permissions`, data);
        },
        deletePermission(userId, permId) {
            return api.delete(`/users/${userId}/permissions/${permId}`);
        },
        batchPermissions(data) {
            return api.post('/users/batch-permissions', data);
        },
        // 公开页面
        listPublicPages() {
            return api.get('/users/public-pages');
        },
        updatePublicPages(pages) {
            return api.put('/users/public-pages', { pages });
        },
        // 页面权限检查
        checkPageAccess(pageId) {
            return api.get(`/users/check-page-access/${pageId}`);
        },
        // 站点统计
        stats() {
            return api.get('/users/stats');
        },
    },

    // ====== 工具 ======
    isLoggedIn() {
        return !!localStorage.getItem(APP_CONFIG.tokenKey);
    },
    getUserInfo() {
        const info = localStorage.getItem(APP_CONFIG.userInfoKey);
        return info ? JSON.parse(info) : null;
    },
    isAdmin() {
        const info = this.getUserInfo();
        return info && info.role === 'admin';
    },
    logout() {
        localStorage.removeItem(APP_CONFIG.tokenKey);
        localStorage.removeItem(APP_CONFIG.userInfoKey);
        window.dispatchEvent(new CustomEvent('auth-change', { detail: { loggedOut: true } }));
    },
};

window.APP_CONFIG = APP_CONFIG;
window.api = api;
