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
    expSubTab: 'timeline',
    friendsPage: 1,
    friendsTotal: 0,
    friendsTotalPages: 1,
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
            // 按需加载各Tab数据
            if (tab.dataset.tab === 'system') loadSystemStatus();
            if (tab.dataset.tab === 'resume-admin') loadResumeAdmin();
            if (tab.dataset.tab === 'experience-admin') loadExperienceAdmin();
            if (tab.dataset.tab === 'friends-admin') loadFriendsAdmin();
            if (tab.dataset.tab === 'messages') loadMsgConfig();
        });
    });

    // 经历管理子Tab切换
    document.getElementById('expSubTabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.admin-sub-tab');
        if (!btn) return;
        document.querySelectorAll('#expSubTabs .admin-sub-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        adminState.expSubTab = btn.dataset.sub;
        document.getElementById('addExpItemLabel').textContent = btn.dataset.sub === 'timeline' ? '添加事件' : '添加项目';
        loadExperienceAdmin();
    });

    // 通用表单弹窗
    document.getElementById('cancelAdminForm')?.addEventListener('click', closeAdminForm);
    document.getElementById('adminFormOverlay')?.addEventListener('click', closeAdminForm);
    document.getElementById('confirmAdminForm')?.addEventListener('click', submitAdminForm);

    // 简历保存按钮
    document.getElementById('saveResumeBtn')?.addEventListener('click', saveResumeFields);

    // 经历添加按钮
    document.getElementById('addExpItemBtn')?.addEventListener('click', () => {
        if (adminState.expSubTab === 'timeline') openEventForm();
        else openProjectForm();
    });

    // 朋友圈发布按钮
    document.getElementById('addMomentBtn')?.addEventListener('click', () => openMomentForm());

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

// ====== 通用表单弹窗 ======

let adminFormCallback = null;

function openAdminForm(title, bodyHtml, onConfirm) {
    document.getElementById('adminFormTitle').innerHTML = `<i class="fas fa-edit"></i> ${title}`;
    document.getElementById('adminFormBody').innerHTML = bodyHtml;
    document.getElementById('adminFormModal').style.display = 'flex';
    adminFormCallback = onConfirm;
}

function closeAdminForm() {
    document.getElementById('adminFormModal').style.display = 'none';
    adminFormCallback = null;
}

function submitAdminForm() {
    if (adminFormCallback) {
        adminFormCallback();
    }
}

// ====== 简历管理 ======

async function loadResumeAdmin() {
    const container = document.getElementById('adminResumeEditor');
    if (!container) return;
    container.innerHTML = '<div class="admin-empty"><i class="fas fa-spinner fa-pulse"></i>加载中...</div>';

    try {
        const result = await api.resume.getAll();
        if (result.success) {
            renderResumeAdmin(result.sections);
        } else {
            container.innerHTML = '<div class="admin-empty"><i class="fas fa-exclamation-circle"></i>加载失败</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="admin-empty"><i class="fas fa-exclamation-circle"></i>加载失败：' + e.message + '</div>';
    }
}

function renderResumeAdmin(sections) {
    const container = document.getElementById('adminResumeEditor');
    if (!container) return;

    let html = '';
    for (const s of sections) {
        html += `<div class="admin-section-card">
            <div class="admin-section-card-header">
                <span><i class="fas fa-folder"></i> <strong>${s.section}</strong></span>
                <button class="admin-btn sm primary add-field-btn" data-section="${s.section}">
                    <i class="fas fa-plus"></i> 添加字段
                </button>
            </div>`;
        for (const f of s.fields) {
            const isLong = f.field_type === 'longtext';
            html += `<div class="resume-field-row" data-id="${f.id}" data-section="${f.section}">
                <input class="admin-input resume-label" value="${escapeAdminHtml(f.field_label)}" placeholder="显示名">
                <input class="admin-input resume-key" value="${escapeAdminHtml(f.field_key)}" placeholder="键名">
                ${isLong
                    ? `<textarea class="admin-input resume-value" rows="2">${escapeAdminHtml(f.field_value)}</textarea>`
                    : `<input class="admin-input resume-value" value="${escapeAdminHtml(f.field_value)}" placeholder="值">`
                }
                <select class="admin-select resume-type">
                    <option value="text" ${f.field_type === 'text' ? 'selected' : ''}>文本</option>
                    <option value="longtext" ${f.field_type === 'longtext' ? 'selected' : ''}>长文本</option>
                    <option value="list" ${f.field_type === 'list' ? 'selected' : ''}>列表</option>
                </select>
                <input class="admin-input resume-order" type="number" value="${f.sort_order}" style="width:55px;" min="0">
                <button class="admin-btn sm danger del-field-btn" data-id="${f.id}"><i class="fas fa-trash"></i></button>
            </div>`;
        }
        html += '</div>';
    }

    container.innerHTML = html;

    // 绑定添加字段按钮
    container.querySelectorAll('.add-field-btn').forEach(btn => {
        btn.addEventListener('click', () => addResumeFieldRow(btn.dataset.section));
    });

    // 绑定删除字段按钮
    container.querySelectorAll('.del-field-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteResumeField(parseInt(btn.dataset.id)));
    });
}

function addResumeFieldRow(section) {
    const container = document.getElementById('adminResumeEditor');
    const sectionCard = [...container.querySelectorAll('.admin-section-card')]
        .find(c => c.querySelector('.add-field-btn')?.dataset.section === section);
    if (!sectionCard) return;

    const row = document.createElement('div');
    row.className = 'resume-field-row new-field';
    row.dataset.section = section;
    row.innerHTML = `
        <input class="admin-input resume-label" placeholder="显示名">
        <input class="admin-input resume-key" placeholder="键名">
        <input class="admin-input resume-value" placeholder="值">
        <select class="admin-select resume-type">
            <option value="text">文本</option>
            <option value="longtext">长文本</option>
            <option value="list">列表</option>
        </select>
        <input class="admin-input resume-order" type="number" value="99" style="width:55px;" min="0">
        <button class="admin-btn sm danger remove-row-btn"><i class="fas fa-times"></i></button>
    `;
    row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
    sectionCard.appendChild(row);
}

async function deleteResumeField(fieldId) {
    if (!confirm('确定删除该字段？')) return;
    const result = await api.resume.delete(fieldId);
    if (result.success) {
        showAuthNotification('字段已删除', 'success');
        loadResumeAdmin();
    } else {
        showAuthNotification(result.message || '删除失败', 'error');
    }
}

async function saveResumeFields() {
    const statusEl = document.getElementById('resumeSaveStatus');
    const rows = document.querySelectorAll('.resume-field-row');
    const fields = [];

    for (const row of rows) {
        const label = row.querySelector('.resume-label')?.value.trim();
        const key = row.querySelector('.resume-key')?.value.trim();
        const value = row.querySelector('.resume-value')?.value;
        const type = row.querySelector('.resume-type')?.value || 'text';
        const order = parseInt(row.querySelector('.resume-order')?.value) || 0;
        const section = row.dataset.section || '';

        if (!key || !label || !section) continue;

        fields.push({
            section: section,
            field_key: key,
            field_label: label,
            field_value: value || '',
            field_type: type,
            sort_order: order,
        });
    }

    if (fields.length === 0) {
        if (statusEl) { statusEl.textContent = '没有可保存的字段'; statusEl.style.color = '#ff9800'; }
        return;
    }

    const result = await api.resume.update(fields);
    if (result.success) {
        if (statusEl) { statusEl.textContent = result.message; statusEl.style.color = '#4caf50'; }
        setTimeout(() => loadResumeAdmin(), 500);
    } else {
        if (statusEl) { statusEl.textContent = result.message || '保存失败'; statusEl.style.color = '#e53935'; }
    }
}

// ====== 经历管理 ======

async function loadExperienceAdmin() {
    const container = document.getElementById('adminExpList');
    if (!container) return;
    container.innerHTML = '<div class="admin-empty"><i class="fas fa-spinner fa-pulse"></i>加载中...</div>';

    try {
        if (adminState.expSubTab === 'timeline') {
            const result = await api.experience.list();
            if (result.success) renderTimelineAdmin(result.events);
            else container.innerHTML = '<div class="admin-empty">加载失败</div>';
        } else {
            const result = await api.experience.listProjects();
            if (result.success) renderProjectsAdmin(result.projects);
            else container.innerHTML = '<div class="admin-empty">加载失败</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="admin-empty">加载失败：' + e.message + '</div>';
    }
}

function renderTimelineAdmin(events) {
    const container = document.getElementById('adminExpList');
    if (!events || events.length === 0) {
        container.innerHTML = '<div class="admin-empty"><i class="fas fa-clock"></i>暂无时间线事件</div>';
        return;
    }

    const typeLabels = { work: '工作', education: '教育', life: '生活' };
    container.innerHTML = events.map(e => `
        <div class="admin-list-card">
            <div class="admin-list-card-info">
                <span class="admin-list-badge">${typeLabels[e.event_type] || e.event_type}</span>
                <strong>${escapeAdminHtml(e.title)}</strong>
                <span style="opacity:0.6;font-size:0.78rem;">${e.organization || ''} · ${e.start_date}-${e.end_date}</span>
                <span style="font-size:0.7rem;opacity:0.4;">排序:${e.sort_order} ${e.is_visible ? '' : '[隐藏]'}</span>
            </div>
            <div class="admin-list-card-actions">
                <button class="admin-btn sm" data-action="edit-event" data-id="${e.id}"><i class="fas fa-pen"></i></button>
                <button class="admin-btn sm danger" data-action="del-event" data-id="${e.id}" data-title="${escapeAdminHtml(e.title)}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    bindExpListEvents();
}

function renderProjectsAdmin(projects) {
    const container = document.getElementById('adminExpList');
    if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="admin-empty"><i class="fas fa-project-diagram"></i>暂无项目经历</div>';
        return;
    }

    container.innerHTML = projects.map(p => `
        <div class="admin-list-card">
            <div class="admin-list-card-info">
                <strong>${escapeAdminHtml(p.title)}</strong>
                <span style="opacity:0.6;font-size:0.78rem;">${p.period || ''} · ${p.role || ''}</span>
                <span style="font-size:0.7rem;opacity:0.4;">排序:${p.sort_order} ${p.is_visible ? '' : '[隐藏]'}</span>
            </div>
            <div class="admin-list-card-actions">
                <button class="admin-btn sm" data-action="edit-project" data-id="${p.id}"><i class="fas fa-pen"></i></button>
                <button class="admin-btn sm danger" data-action="del-project" data-id="${p.id}" data-title="${escapeAdminHtml(p.title)}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    bindExpListEvents();
}

function bindExpListEvents() {
    const container = document.getElementById('adminExpList');
    container.querySelectorAll('[data-action="edit-event"]').forEach(btn => {
        btn.addEventListener('click', () => openEventForm(parseInt(btn.dataset.id)));
    });
    container.querySelectorAll('[data-action="del-event"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const title = btn.dataset.title;
            if (!confirm(`确定删除事件「${title}」？`)) return;
            api.experience.delete(id).then(r => {
                showAuthNotification(r.success ? '已删除' : (r.message || '失败'), r.success ? 'success' : 'error');
                if (r.success) loadExperienceAdmin();
            });
        });
    });
    container.querySelectorAll('[data-action="edit-project"]').forEach(btn => {
        btn.addEventListener('click', () => openProjectForm(parseInt(btn.dataset.id)));
    });
    container.querySelectorAll('[data-action="del-project"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const title = btn.dataset.title;
            if (!confirm(`确定删除项目「${title}」？`)) return;
            api.experience.deleteProject(id).then(r => {
                showAuthNotification(r.success ? '已删除' : (r.message || '失败'), r.success ? 'success' : 'error');
                if (r.success) loadExperienceAdmin();
            });
        });
    });
}

async function openEventForm(eventId) {
    let data = { event_type: 'work', title: '', organization: '', location: '', start_date: '', end_date: '',
        summary: '', highlights: '', sort_order: 99, is_visible: true };

    if (eventId) {
        const result = await api.experience.list();
        const event = (result.events || []).find(e => e.id === eventId);
        if (event) {
            data = {
                event_type: event.event_type || 'work',
                title: event.title || '',
                organization: event.organization || '',
                location: event.location || '',
                start_date: event.start_date || '',
                end_date: event.end_date || '',
                summary: event.summary || '',
                highlights: (event.highlights || []).join('\n'),
                sort_order: event.sort_order ?? 99,
                is_visible: event.is_visible !== false,
            };
        }
    }

    const formHtml = `
        <div class="admin-form-grid" style="grid-template-columns:1fr 1fr;">
            <div class="admin-form-group"><label>类型</label>
                <select id="fEventType" class="admin-select">
                    <option value="work" ${data.event_type === 'work' ? 'selected' : ''}>工作</option>
                    <option value="education" ${data.event_type === 'education' ? 'selected' : ''}>教育</option>
                    <option value="life" ${data.event_type === 'life' ? 'selected' : ''}>生活</option>
                </select></div>
            <div class="admin-form-group"><label>显示</label>
                <select id="fEventVisible" class="admin-select">
                    <option value="1" ${data.is_visible ? 'selected' : ''}>可见</option>
                    <option value="0" ${!data.is_visible ? 'selected' : ''}>隐藏</option>
                </select></div>
            <div class="admin-form-group" style="grid-column:1/-1;"><label>标题 *</label>
                <input id="fEventTitle" class="admin-input" value="${escapeAdminHtml(data.title)}"></div>
            <div class="admin-form-group"><label>组织/学校</label>
                <input id="fEventOrg" class="admin-input" value="${escapeAdminHtml(data.organization)}"></div>
            <div class="admin-form-group"><label>地点</label>
                <input id="fEventLoc" class="admin-input" value="${escapeAdminHtml(data.location)}"></div>
            <div class="admin-form-group"><label>开始日期</label>
                <input id="fEventStart" class="admin-input" value="${escapeAdminHtml(data.start_date)}"></div>
            <div class="admin-form-group"><label>结束日期</label>
                <input id="fEventEnd" class="admin-input" value="${escapeAdminHtml(data.end_date)}"></div>
            <div class="admin-form-group"><label>排序</label>
                <input id="fEventOrder" class="admin-input" type="number" value="${data.sort_order}" min="0"></div>
            <div class="admin-form-group" style="grid-column:1/-1;"><label>摘要</label>
                <textarea id="fEventSummary" class="admin-input" rows="2">${escapeAdminHtml(data.summary)}</textarea></div>
            <div class="admin-form-group" style="grid-column:1/-1;"><label>亮点（每行一条）</label>
                <textarea id="fEventHighlights" class="admin-input" rows="3">${escapeAdminHtml(data.highlights)}</textarea></div>
        </div>`;

    openAdminForm(eventId ? '编辑时间线事件' : '添加时间线事件', formHtml, async () => {
        const title = document.getElementById('fEventTitle')?.value.trim();
        if (!title) { showAuthNotification('请输入标题', 'error'); return; }

        const payload = {
            event_type: document.getElementById('fEventType')?.value || 'work',
            title: title,
            organization: document.getElementById('fEventOrg')?.value.trim() || null,
            location: document.getElementById('fEventLoc')?.value.trim() || null,
            start_date: document.getElementById('fEventStart')?.value.trim() || null,
            end_date: document.getElementById('fEventEnd')?.value.trim() || null,
            summary: document.getElementById('fEventSummary')?.value.trim() || null,
            highlights: (document.getElementById('fEventHighlights')?.value || '').split('\n').map(s => s.trim()).filter(Boolean),
            sort_order: parseInt(document.getElementById('fEventOrder')?.value) || 99,
            is_visible: document.getElementById('fEventVisible')?.value === '1',
        };

        const result = eventId
            ? await api.experience.update(eventId, payload)
            : await api.experience.create(payload);

        if (result.success) {
            closeAdminForm();
            showAuthNotification(eventId ? '事件已更新' : '事件已创建', 'success');
            loadExperienceAdmin();
        } else {
            showAuthNotification(result.message || '操作失败', 'error');
        }
    });
}

async function openProjectForm(projectId) {
    let data = { title: '', period: '', role: '', tech_stack: '', description: '', highlights: '', sort_order: 99, is_visible: true };

    if (projectId) {
        const result = await api.experience.listProjects();
        const proj = (result.projects || []).find(p => p.id === projectId);
        if (proj) {
            data = {
                title: proj.title || '',
                period: proj.period || '',
                role: proj.role || '',
                tech_stack: (proj.tech_stack || []).join(', '),
                description: proj.description || '',
                highlights: (proj.highlights || []).join('\n'),
                sort_order: proj.sort_order ?? 99,
                is_visible: proj.is_visible !== false,
            };
        }
    }

    const formHtml = `
        <div class="admin-form-grid" style="grid-template-columns:1fr 1fr;">
            <div class="admin-form-group" style="grid-column:1/-1;"><label>项目名称 *</label>
                <input id="fProjTitle" class="admin-input" value="${escapeAdminHtml(data.title)}"></div>
            <div class="admin-form-group"><label>时间</label>
                <input id="fProjPeriod" class="admin-input" value="${escapeAdminHtml(data.period)}" placeholder="如 2022.03 - 2023.01"></div>
            <div class="admin-form-group"><label>角色</label>
                <input id="fProjRole" class="admin-input" value="${escapeAdminHtml(data.role)}"></div>
            <div class="admin-form-group"><label>排序</label>
                <input id="fProjOrder" class="admin-input" type="number" value="${data.sort_order}" min="0"></div>
            <div class="admin-form-group"><label>显示</label>
                <select id="fProjVisible" class="admin-select">
                    <option value="1" ${data.is_visible ? 'selected' : ''}>可见</option>
                    <option value="0" ${!data.is_visible ? 'selected' : ''}>隐藏</option>
                </select></div>
            <div class="admin-form-group" style="grid-column:1/-1;"><label>技术栈（逗号分隔）</label>
                <input id="fProjTech" class="admin-input" value="${escapeAdminHtml(data.tech_stack)}"></div>
            <div class="admin-form-group" style="grid-column:1/-1;"><label>描述</label>
                <textarea id="fProjDesc" class="admin-input" rows="2">${escapeAdminHtml(data.description)}</textarea></div>
            <div class="admin-form-group" style="grid-column:1/-1;"><label>亮点（每行一条）</label>
                <textarea id="fProjHighlights" class="admin-input" rows="3">${escapeAdminHtml(data.highlights)}</textarea></div>
        </div>`;

    openAdminForm(projectId ? '编辑项目经历' : '添加项目经历', formHtml, async () => {
        const title = document.getElementById('fProjTitle')?.value.trim();
        if (!title) { showAuthNotification('请输入项目名称', 'error'); return; }

        const techStr = document.getElementById('fProjTech')?.value || '';
        const payload = {
            title: title,
            period: document.getElementById('fProjPeriod')?.value.trim() || null,
            role: document.getElementById('fProjRole')?.value.trim() || null,
            tech_stack: techStr.split(',').map(s => s.trim()).filter(Boolean),
            description: document.getElementById('fProjDesc')?.value.trim() || null,
            highlights: (document.getElementById('fProjHighlights')?.value || '').split('\n').map(s => s.trim()).filter(Boolean),
            sort_order: parseInt(document.getElementById('fProjOrder')?.value) || 99,
            is_visible: document.getElementById('fProjVisible')?.value === '1',
        };

        const result = projectId
            ? await api.experience.updateProject(projectId, payload)
            : await api.experience.createProject(payload);

        if (result.success) {
            closeAdminForm();
            showAuthNotification(projectId ? '项目已更新' : '项目已创建', 'success');
            loadExperienceAdmin();
        } else {
            showAuthNotification(result.message || '操作失败', 'error');
        }
    });
}

// ====== 朋友圈管理 ======

async function loadFriendsAdmin(page = 1) {
    const container = document.getElementById('adminMomentsList');
    if (!container) return;
    if (page === 1) container.innerHTML = '<div class="admin-empty"><i class="fas fa-spinner fa-pulse"></i>加载中...</div>';

    try {
        const result = await api.friends.listMoments(page, 10);
        if (result.success) {
            adminState.friendsPage = result.page;
            adminState.friendsTotal = result.total;
            adminState.friendsTotalPages = result.total_pages;
            renderMomentsAdmin(result.moments, page === 1);
        } else {
            if (page === 1) container.innerHTML = '<div class="admin-empty">加载失败</div>';
        }
    } catch (e) {
        if (page === 1) container.innerHTML = '<div class="admin-empty">加载失败：' + e.message + '</div>';
    }
}

function renderMomentsAdmin(moments, clear) {
    const container = document.getElementById('adminMomentsList');
    if (clear) container.innerHTML = '';

    if (!moments || moments.length === 0) {
        if (clear) container.innerHTML = '<div class="admin-empty"><i class="fas fa-users"></i>暂无朋友圈动态</div>';
        return;
    }

    for (const m of moments) {
        const images = Array.isArray(m.images) ? m.images : [];
        const div = document.createElement('div');
        div.className = 'admin-list-card';
        div.style.cssText = 'flex-direction:column;align-items:stretch;';
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div class="admin-list-card-info" style="flex-direction:column;align-items:flex-start;gap:0.25rem;">
                    <div><strong>${escapeAdminHtml(m.author_name)}</strong>
                        <span style="font-size:0.7rem;opacity:0.5;"> · ${m.created_at ? new Date(m.created_at).toLocaleString('zh-CN') : ''}</span>
                        <span style="font-size:0.7rem;opacity:0.4;"> · <i class="far fa-thumbs-up"></i>${m.likes} · <i class="far fa-comment"></i>${m.comments_count}</span>
                    </div>
                    <div style="font-size:0.82rem;opacity:0.8;">${escapeAdminHtml(m.content).substring(0, 120)}${m.content && m.content.length > 120 ? '...' : ''}</div>
                    ${images.length ? `<div style="font-size:0.7rem;opacity:0.5;"><i class="fas fa-images"></i> ${images.length}张图片</div>` : ''}
                </div>
                <div class="admin-list-card-actions" style="flex-shrink:0;">
                    <button class="admin-btn sm" data-action="edit-moment" data-id="${m.id}"><i class="fas fa-pen"></i></button>
                    <button class="admin-btn sm danger" data-action="del-moment" data-id="${m.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="admin-comments-section" id="admin-moment-comments-${m.id}" style="display:none;margin-top:0.4rem;border-top:1px solid rgba(74,144,226,0.08);padding-top:0.4rem;">
            </div>
            <button class="admin-btn sm" data-action="toggle-comments" data-id="${m.id}" style="align-self:flex-start;margin-top:0.3rem;">
                <i class="fas fa-comments"></i> 查看评论
            </button>
        `;
        container.appendChild(div);
    }

    // 绑定事件
    container.querySelectorAll('[data-action="edit-moment"]').forEach(btn => {
        btn.addEventListener('click', () => openMomentForm(parseInt(btn.dataset.id)));
    });
    container.querySelectorAll('[data-action="del-moment"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('确定删除该动态？')) return;
            api.friends.deleteMoment(parseInt(btn.dataset.id)).then(r => {
                showAuthNotification(r.success ? '已删除' : (r.message || '失败'), r.success ? 'success' : 'error');
                if (r.success) loadFriendsAdmin();
            });
        });
    });
    container.querySelectorAll('[data-action="toggle-comments"]').forEach(btn => {
        btn.addEventListener('click', () => toggleMomentComments(parseInt(btn.dataset.id)));
    });

    // 加载更多按钮
    if (adminState.friendsPage < adminState.friendsTotalPages) {
        const moreBtn = document.createElement('button');
        moreBtn.className = 'admin-btn';
        moreBtn.style.cssText = 'width:100%;margin-top:0.4rem;';
        moreBtn.textContent = `加载更多 (${adminState.friendsPage}/${adminState.friendsTotalPages})`;
        moreBtn.addEventListener('click', () => loadFriendsAdmin(adminState.friendsPage + 1));
        container.appendChild(moreBtn);
    }
}

async function toggleMomentComments(momentId) {
    const section = document.getElementById(`admin-moment-comments-${momentId}`);
    if (!section) return;

    if (section.style.display === 'none') {
        section.style.display = 'block';
        section.innerHTML = '<div style="font-size:0.75rem;opacity:0.5;">加载中...</div>';
        try {
            const result = await api.friends.getMoment(momentId);
            const comments = result.comments || [];
            if (comments.length === 0) {
                section.innerHTML = '<div style="font-size:0.75rem;opacity:0.5;">暂无评论</div>';
            } else {
                section.innerHTML = comments.map(c => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.25rem 0;font-size:0.78rem;">
                        <span><strong>${escapeAdminHtml(c.author_name)}</strong>：${escapeAdminHtml(c.content)}</span>
                        <button class="admin-btn sm danger" data-action="del-comment" data-id="${c.id}"><i class="fas fa-times"></i></button>
                    </div>
                `).join('');
                section.querySelectorAll('[data-action="del-comment"]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!confirm('确定删除该评论？')) return;
                        api.friends.deleteComment(parseInt(btn.dataset.id)).then(r => {
                            if (r.success) toggleMomentComments(momentId);
                            showAuthNotification(r.success ? '已删除' : (r.message || '失败'), r.success ? 'success' : 'error');
                        });
                    });
                });
            }
        } catch (e) {
            section.innerHTML = '<div style="font-size:0.75rem;color:#e53935;">加载失败</div>';
        }
    } else {
        section.style.display = 'none';
    }
}

async function openMomentForm(momentId) {
    let data = { content: '', images: '' };

    if (momentId) {
        const result = await api.friends.getMoment(momentId);
        data = {
            content: result.content || '',
            images: (result.images || []).join('\n'),
        };
    }

    const formHtml = `
        <div class="admin-form-grid" style="grid-template-columns:1fr;">
            <div class="admin-form-group"><label>内容 *</label>
                <textarea id="fMomentContent" class="admin-input" rows="4" maxlength="5000">${escapeAdminHtml(data.content)}</textarea></div>
            <div class="admin-form-group"><label>图片URL（每行一个，最多9张）</label>
                <textarea id="fMomentImages" class="admin-input" rows="3">${escapeAdminHtml(data.images)}</textarea></div>
        </div>`;

    openAdminForm(momentId ? '编辑朋友圈动态' : '发布朋友圈动态', formHtml, async () => {
        const content = document.getElementById('fMomentContent')?.value.trim();
        if (!content) { showAuthNotification('请输入内容', 'error'); return; }

        const imgStr = document.getElementById('fMomentImages')?.value || '';
        const images = imgStr.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 9);

        const payload = { content, images };

        let result;
        if (momentId) {
            result = await api.friends.updateMoment(momentId, payload);
        } else {
            result = await api.friends.createMoment(payload);
        }

        if (result.success) {
            closeAdminForm();
            showAuthNotification(momentId ? '动态已更新' : '动态已发布', 'success');
            loadFriendsAdmin();
        } else {
            showAuthNotification(result.message || '操作失败', 'error');
        }
    });
}

// ====== 留言配置 (T5.4) ======

async function loadMsgConfig() {
    const container = document.getElementById('msgConfigDisplay');
    if (!container) return;

    try {
        const result = await api.get('/admin/config');
        if (result.messages) {
            const adminNames = (result.messages.admin_names || []).join('、');
            const sensitiveWords = result.messages.sensitive_words || [];
            container.innerHTML = `
                <div class="system-db-item"><span class="name"><i class="fas fa-user-shield"></i> 管理员名称</span>
                    <span class="count" style="font-size:0.75rem;">${adminNames || '无'}</span></div>
                <div class="system-db-item"><span class="name"><i class="fas fa-filter"></i> 敏感词列表</span>
                    <span class="count" style="font-size:0.75rem;">${sensitiveWords.length > 0 ? sensitiveWords.join(', ') : '(空)'}</span></div>
            `;
        }
    } catch (e) {
        container.innerHTML = '<div class="admin-empty" style="font-size:0.75rem;">配置加载失败</div>';
    }
}

window.initAdmin = initAdmin;
window.openAdminPanel = openAdminPanel;
