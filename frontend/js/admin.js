// 管理员面板模块
const PAGE_LIST = [
    { id: 'home', name: '首页', icon: 'fa-home' },
    { id: 'resume', name: '简历', icon: 'fa-file-alt' },
    { id: 'experience', name: '经历', icon: 'fa-pencil-alt' },
    { id: 'blog', name: '博客', icon: 'fa-blog' },
    { id: 'friends', name: '朋友圈', icon: 'fa-users' },
    { id: 'contact', name: '联系我', icon: 'fa-envelope' },
];

let adminState = {
    usersPage: 1,
    usersTotal: 0,
    usersSearch: '',
    publicPages: [],
    panelLoaded: false,
    msgPage: 1,
    msgTotal: 0,
    sysTimer: null,
};

function initAdmin() {
    function updateLogoBehavior() {
        const logo = document.querySelector('.logo');
        if (!logo) return;

        // 移除旧的事件：通过克隆节点替换
        const newLogo = logo.cloneNode(true);
        logo.parentNode.replaceChild(newLogo, logo);

        // 清理视觉状态
        newLogo.classList.remove('admin-logo');
        newLogo.title = '';
        newLogo.style.cursor = '';
        newLogo.style.opacity = '';

        if (api.isAdmin()) {
            // 管理员：Logo点击打开管理面板
            newLogo.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openAdminPanel();
            });
            newLogo.title = '管理面板';
            newLogo.classList.add('admin-logo');
        } else {
            // 非管理员：Logo不可点击
            newLogo.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            newLogo.style.cursor = 'default';
            newLogo.style.opacity = '0.7';
        }
    }

    // 初始设置
    updateLogoBehavior();

    // 登录/登出时更新logo行为
    window.addEventListener('auth-change', () => {
        setTimeout(updateLogoBehavior, 100);
    });
}

async function openAdminPanel() {
    if (!adminState.panelLoaded) {
        const html = await (await fetch('./modules/admin-panel.html')).text();
        document.body.insertAdjacentHTML('beforeend', html);
        bindAdminEvents();
        adminState.panelLoaded = true;
    }
    document.getElementById('adminPanel').style.display = 'flex';
    document.body.classList.add('panel-open');
    loadUsers();
    loadAdminMessages();
    loadPublicPages();
    loadSystemStatus();
    // 自动刷新系统状态
    clearInterval(adminState.sysTimer);
    adminState.sysTimer = setInterval(loadSystemStatus, 30000);
}

function bindAdminEvents() {
    // 关闭（仅关闭按钮，全屏模式点击空白不关闭）
    document.getElementById('adminClose').addEventListener('click', () => {
        document.getElementById('adminPanel').style.display = 'none';
        document.body.classList.remove('panel-open');
        clearInterval(adminState.sysTimer);
        adminState.sysTimer = null;
    });

    // Tab 切换
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            // 切换到系统状态tab时刷新
            if (tab.dataset.tab === 'system') loadSystemStatus();
        });
    });

    // 搜索用户
    let searchTimer = null;
    document.getElementById('userSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            adminState.usersSearch = e.target.value.trim();
            adminState.usersPage = 1;
            loadUsers();
        }, 300);
    });

    // 添加用户
    document.getElementById('addUserBtn').addEventListener('click', () => openUserForm());

    // 用户表单弹窗
    document.getElementById('cancelUserForm').addEventListener('click', () => {
        document.getElementById('userFormModal').style.display = 'none';
    });
    document.getElementById('userFormOverlay').addEventListener('click', () => {
        document.getElementById('userFormModal').style.display = 'none';
    });
    document.getElementById('confirmUserForm').addEventListener('click', submitUserForm);

    // 公开页面保存
    document.getElementById('savePublicPagesBtn').addEventListener('click', savePublicPages);
}

// ====== 工具 ======

function formatNum(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n;
}

// ====== 用户列表 ======

async function loadUsers() {
    const result = await api.users.list(adminState.usersPage, 6, adminState.usersSearch || undefined);
    if (!result.users) return;

    adminState.usersTotal = result.total;
    const container = document.getElementById('userCards');

    if (result.users.length === 0) {
        container.innerHTML = '<div class="admin-empty"><i class="fas fa-user-slash"></i>暂无访客记录</div>';
    } else {
        container.innerHTML = result.users.map(u => renderUserCard(u)).join('');
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', handleUserAction);
        });
        // 绑定权限开关事件
        container.querySelectorAll('.perm-toggle input').forEach(toggle => {
            toggle.addEventListener('change', handlePermToggle);
        });
    }

    renderPagination();
}

function renderUserCard(u) {
    const pagePerms = (u.permissions || []).filter(p => p.resource_type === 'page');
    const permMap = {};
    pagePerms.forEach(p => { permMap[p.resource_id] = p.id; });

    const metaItems = [];
    if (u.phone) metaItems.push(`<span><i class="fas fa-phone"></i>${u.phone}</span>`);
    if (u.email) metaItems.push(`<span><i class="fas fa-envelope"></i>${u.email}</span>`);
    if (u.wechat) metaItems.push(`<span><i class="fab fa-weixin"></i>${u.wechat}</span>`);
    if (u.qq) metaItems.push(`<span><i class="fab fa-qq"></i>${u.qq}</span>`);

    const permToggles = PAGE_LIST.map(page => {
        const hasPerm = page.id in permMap;
        return `
            <div class="user-perm-toggle">
                <span class="user-perm-label"><i class="fas ${page.icon}"></i>${page.name}</span>
                <label class="toggle-switch perm-toggle" data-user-id="${u.id}" data-page-id="${page.id}" data-perm-id="${hasPerm ? permMap[page.id] : ''}">
                    <input type="checkbox" ${hasPerm ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>`;
    }).join('');

    return `
    <div class="user-card" data-user-id="${u.id}">
        <div class="user-card-top">
            <div class="user-card-info">
                <div class="user-card-name">
                    ${u.name}
                    <span class="badge ${u.is_verified ? 'badge-yes' : 'badge-no'}">${u.is_verified ? '已验证' : '未验证'}</span>
                </div>
                ${metaItems.length ? `<div class="user-card-meta">${metaItems.join('')}</div>` : ''}
            </div>
            <div class="user-card-actions">
                <button class="admin-btn sm" data-action="edit" data-id="${u.id}" title="编辑"><i class="fas fa-pen"></i></button>
                <button class="admin-btn sm danger" data-action="delete" data-id="${u.id}" data-name="${u.name}" title="删除"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="user-card-code">
            <span class="user-card-code-label"><i class="fas fa-key"></i> 认证码:</span>
            <input type="text" class="access-code-input" value="${u.access_code || ''}" data-user-id="${u.id}" placeholder="输入认证码" maxlength="20">
            <button class="admin-btn sm" data-action="save-code" data-id="${u.id}" title="保存"><i class="fas fa-check"></i></button>
            <button class="admin-btn sm" data-action="reset-code" data-id="${u.id}" title="随机重置"><i class="fas fa-sync-alt"></i></button>
        </div>
        <div class="user-card-perm-section">
            <div class="user-perm-header">
                <i class="fas fa-shield-alt"></i> 页面访问权限
            </div>
            <div class="user-perm-grid">${permToggles}</div>
        </div>
    </div>`;
}

function handleUserAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id);
    const name = btn.dataset.name || '';

    switch (action) {
        case 'edit': openUserForm(id); break;
        case 'delete': confirmDeleteUser(id, name); break;
        case 'save-code': saveAccessCode(id); break;
        case 'reset-code': resetAccessCode(id); break;
    }
}

// ====== 分页 ======

function renderPagination() {
    const container = document.getElementById('usersPagination');
    const totalPages = Math.ceil(adminState.usersTotal / 6);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="admin-page-btn" data-page="${adminState.usersPage - 1}" ${adminState.usersPage <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    const start = Math.max(1, adminState.usersPage - 2);
    const end = Math.min(totalPages, adminState.usersPage + 2);
    for (let i = start; i <= end; i++) {
        html += `<button class="admin-page-btn ${i === adminState.usersPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="admin-page-btn" data-page="${adminState.usersPage + 1}" ${adminState.usersPage >= totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;
    container.querySelectorAll('.admin-page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page >= 1 && page <= totalPages) {
                adminState.usersPage = page;
                loadUsers();
            }
        });
    });
}

// ====== 添加/编辑用户 ======

async function openUserForm(userId) {
    const modal = document.getElementById('userFormModal');
    const title = document.getElementById('userFormTitle');

    document.getElementById('editUserId').value = '';
    document.getElementById('formName').value = '';
    document.getElementById('formPhone').value = '';
    document.getElementById('formEmail').value = '';
    document.getElementById('formWechat').value = '';
    document.getElementById('formQQ').value = '';

    if (userId) {
        title.textContent = '编辑访客';
        document.getElementById('editUserId').value = userId;
        const result = await api.users.list(1, 100);
        if (result.users) {
            const user = result.users.find(u => u.id === userId);
            if (user) {
                document.getElementById('formName').value = user.name || '';
                document.getElementById('formPhone').value = user.phone || '';
                document.getElementById('formEmail').value = user.email || '';
                document.getElementById('formWechat').value = user.wechat || '';
                document.getElementById('formQQ').value = user.qq || '';
            }
        }
    } else {
        title.textContent = '添加访客';
    }

    modal.style.display = 'flex';
    document.getElementById('formName').focus();
}

async function submitUserForm() {
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('formName').value.trim();
    const phone = document.getElementById('formPhone').value.trim() || null;
    const email = document.getElementById('formEmail').value.trim() || null;
    const wechat = document.getElementById('formWechat').value.trim() || null;
    const qq = document.getElementById('formQQ').value.trim() || null;

    if (!name) { showAuthNotification('请输入姓名', 'error'); return; }

    let result;
    if (userId) {
        result = await api.users.update(parseInt(userId), { name, phone, email, wechat, qq });
    } else {
        result = await api.users.create({ name, phone, email, wechat, qq });
    }

    if (result.success) {
        document.getElementById('userFormModal').style.display = 'none';
        showAuthNotification(userId ? '用户信息已更新' : '访客添加成功', 'success');
        loadUsers();
        loadStats();
    } else {
        showAuthNotification(result.message || '操作失败', 'error');
    }
}

// ====== 删除用户 ======

function confirmDeleteUser(id, name) {
    if (!confirm(`确定删除用户「${name}」？此操作不可恢复。`)) return;
    api.users.delete(id).then(result => {
        if (result.success) {
            showAuthNotification(`用户「${name}」已删除`, 'success');
            loadUsers();
            loadStats();
        } else {
            showAuthNotification(result.message || '删除失败', 'error');
        }
    });
}

// ====== 保存/重置认证码 ======

async function saveAccessCode(userId) {
    const input = document.querySelector(`.access-code-input[data-user-id="${userId}"]`);
    if (!input) return;
    const code = input.value.trim();
    if (!code) { showAuthNotification('认证码不能为空', 'error'); return; }

    const result = await api.users.update(userId, { access_code: code });
    if (result.success) {
        showAuthNotification('认证码已保存', 'success');
    } else {
        showAuthNotification(result.message || '保存失败', 'error');
        loadUsers();
    }
}

// ====== 重置认证码 ======

async function resetAccessCode(userId) {
    if (!confirm('确定要重新生成该用户的认证码？旧认证码将失效。')) return;
    const result = await api.users.update(userId, { reset_access_code: true });
    if (result.success) {
        showAuthNotification('认证码已重置', 'success');
        loadUsers();
    } else {
        showAuthNotification(result.message || '重置失败', 'error');
    }
}

// ====== 权限开关切换 ======

async function handlePermToggle(e) {
    const checkbox = e.target;
    const toggleLabel = checkbox.closest('.perm-toggle');
    const userId = parseInt(toggleLabel.dataset.userId);
    const pageId = toggleLabel.dataset.pageId;
    const permId = toggleLabel.dataset.permId;
    const isChecked = checkbox.checked;

    if (isChecked) {
        // 添加权限
        const result = await api.users.addPermission(userId, { user_id: userId, resource_type: 'page', resource_id: pageId });
        if (result.success) {
            showAuthNotification(`已授权访问「${PAGE_LIST.find(p => p.id === pageId)?.name || pageId}」`, 'success');
            // 更新 permId 以便后续删除
            const permResult = await api.users.getPermissions(userId);
            const newPerm = (permResult.permissions || []).find(p => p.resource_type === 'page' && p.resource_id === pageId);
            if (newPerm) toggleLabel.dataset.permId = newPerm.id;
        } else {
            checkbox.checked = false;
            showAuthNotification(result.message || '授权失败', 'error');
        }
    } else {
        // 删除权限
        if (permId) {
            const result = await api.users.deletePermission(userId, parseInt(permId));
            if (result.success) {
                showAuthNotification(`已取消「${PAGE_LIST.find(p => p.id === pageId)?.name || pageId}」访问权限`, 'success');
                toggleLabel.dataset.permId = '';
            } else {
                checkbox.checked = true;
                showAuthNotification(result.message || '取消权限失败', 'error');
            }
        }
    }
}

// ====== 公开页面管理 ======

async function loadPublicPages() {
    const result = await api.users.listPublicPages();
    adminState.publicPages = result.public_pages || [];

    const container = document.getElementById('publicPageList');
    container.innerHTML = PAGE_LIST.map(page => {
        const isPublic = adminState.publicPages.includes(page.id);
        return `
            <div class="public-page-item">
                <label for="pub_${page.id}">
                    <i class="fas ${page.icon}"></i>
                    ${page.name}
                </label>
                <label class="toggle-switch">
                    <input type="checkbox" id="pub_${page.id}" data-page="${page.id}" ${isPublic ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>`;
    }).join('');
}

async function savePublicPages() {
    const pages = {};
    PAGE_LIST.forEach(page => {
        const cb = document.getElementById(`pub_${page.id}`);
        pages[page.id] = cb ? cb.checked : false;
    });

    const result = await api.users.updatePublicPages(pages);
    if (result.success) {
        showAuthNotification('公开页面设置已保存', 'success');
        if (typeof refreshPageAccess === 'function') refreshPageAccess();
    } else {
        showAuthNotification(result.message || '保存失败', 'error');
    }
}

// ====== 留言管理 ======

async function loadAdminMessages() {
    const result = await api.messages.adminList(adminState.msgPage, 6);
    if (!result.messages) return;

    adminState.msgTotal = result.total;
    const totalBadge = document.getElementById('msgTotalBadge');
    if (totalBadge) totalBadge.textContent = result.total;
    const container = document.getElementById('adminMessagesList');

    if (result.messages.length === 0) {
        container.innerHTML = '<div class="admin-empty"><i class="fas fa-comment-slash"></i>暂无留言</div>';
    } else {
        container.innerHTML = result.messages.map(m => renderAdminMsgCard(m)).join('');
        container.querySelectorAll('[data-msg-action]').forEach(btn => {
            btn.addEventListener('click', handleMsgAction);
        });
    }

    renderMsgPagination();
}

function renderAdminMsgCard(m) {
    const dateStr = m.created_at ? new Date(m.created_at).toLocaleString('zh-CN') : '';
    const unreadBadge = !m.is_read ? '<span class="badge badge-no" style="background:#ff9800;color:white;">未读</span>' : '';
    const replyBadge = m.parent_id ? `<span class="perm-mini-tag" style="background:#ff9800;opacity:1;"><i class="fas fa-reply"></i>回复</span>` : '';
    const replyInfo = m.reply_to_name ? `<span style="color:var(--primary-color);font-size:0.75rem;">@${m.reply_to_name}</span>` : '';

    return `
    <div class="user-card" style="padding:0.7rem 1rem;">
        <div class="user-card-top" style="margin-bottom:0.3rem;">
            <div class="user-card-info">
                <div class="user-card-name" style="font-size:0.85rem;">
                    ${m.name} ${unreadBadge} ${replyBadge}
                </div>
                <div style="font-size:0.72rem;color:rgba(255,255,255,0.35);">${dateStr} ${m.email ? '· ' + m.email : ''}</div>
            </div>
            <div class="user-card-actions">
                ${!m.is_read ? `<button class="admin-btn sm" data-msg-action="read" data-id="${m.id}" title="标为已读"><i class="fas fa-check"></i></button>` : ''}
                <button class="admin-btn sm danger" data-msg-action="delete" data-id="${m.id}" title="删除"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div style="font-size:0.82rem;color:rgba(255,255,255,0.75);line-height:1.5;">${replyInfo}${escapeAdminHtml(m.content)}</div>
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.3);margin-top:0.3rem;"><i class="far fa-thumbs-up"></i> ${m.likes}</div>
    </div>`;
}

function escapeAdminHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

async function handleMsgAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.msgAction;
    const id = parseInt(btn.dataset.id);

    if (action === 'delete') {
        if (!confirm('确定删除该留言？')) return;
        const result = await api.messages.delete(id);
        if (result.success) {
            showAuthNotification('留言已删除', 'success');
            loadAdminMessages();
            loadStats();
        } else {
            showAuthNotification(result.message || '删除失败', 'error');
        }
    } else if (action === 'read') {
        const result = await api.messages.markRead(id);
        if (result.success) {
            loadAdminMessages();
        }
    }
}

function renderMsgPagination() {
    const container = document.getElementById('messagesPagination');
    const totalPages = Math.ceil(adminState.msgTotal / 6);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="admin-page-btn" data-page="${adminState.msgPage - 1}" ${adminState.msgPage <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    const start = Math.max(1, adminState.msgPage - 2);
    const end = Math.min(totalPages, adminState.msgPage + 2);
    for (let i = start; i <= end; i++) {
        html += `<button class="admin-page-btn ${i === adminState.msgPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="admin-page-btn" data-page="${adminState.msgPage + 1}" ${adminState.msgPage >= totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;
    container.querySelectorAll('.admin-page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page >= 1 && page <= totalPages) {
                adminState.msgPage = page;
                loadAdminMessages();
            }
        });
    });
}

// ====== 系统状态 ======

async function loadSystemStatus() {
    const startTime = performance.now();
    const result = await api.health();
    const latency = performance.now() - startTime;

    const statusEl = document.getElementById('sysStatus');
    const latencyEl = document.getElementById('sysLatency');
    const uptimeEl = document.getElementById('sysUptime');
    const timeEl = document.getElementById('sysTime');
    if (!statusEl) return;

    if (result && result.status === 'ok') {
        statusEl.textContent = '● 在线';
        statusEl.className = 'value online';
        latencyEl.textContent = latency < 1 ? '<1 ms' : `${Math.round(latency)} ms`;
        if (result.uptime) uptimeEl.textContent = result.uptime;
        if (result.server_time) {
            const t = new Date(result.server_time);
            timeEl.textContent = t.toLocaleString('zh-CN', { hour12: false });
        }
    } else {
        statusEl.textContent = '○ 离线';
        statusEl.className = 'value offline';
        latencyEl.textContent = '-';
    }

    renderSysDbStats();
}

async function renderSysDbStats() {
    const container = document.getElementById('sysDbStats');
    if (!container) return;

    const result = await api.users.stats();
    if (!result.users) return;

    const items = [
        { icon: 'fa-users', name: '注册访客', count: result.users.total },
        { icon: 'fa-file-alt', name: '文章数量', count: result.posts.total },
        { icon: 'fa-eye', name: '总浏览量', count: formatNum(result.posts.views) },
        { icon: 'fa-heart', name: '总点赞数', count: formatNum(result.posts.likes) },
        { icon: 'fa-comments', name: '评论总数', count: result.comments },
        { icon: 'fa-envelope', name: '留言总数', count: result.messages },
    ];

    container.innerHTML = items.map(item => `
        <div class="system-db-item">
            <span class="name"><i class="fas ${item.icon}"></i> ${item.name}</span>
            <span class="count">${item.count}</span>
        </div>
    `).join('');
}

window.initAdmin = initAdmin;
window.openAdminPanel = openAdminPanel;
