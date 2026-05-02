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
    permUserId: null,
    permUserName: '',
    permCurrentPerms: [],
    panelLoaded: false,
};

function initAdmin() {
    if (!api.isAdmin()) return;

    // 管理员：Logo点击打开管理面板
    const logo = document.querySelector('.logo');
    if (logo) {
        // 保存原始行为
        const originalClick = logo.onclick;
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openAdminPanel();
        });
        // 改变视觉提示
        logo.title = '管理面板';
        logo.classList.add('admin-logo');
    }
}

async function openAdminPanel() {
    if (!adminState.panelLoaded) {
        const html = await (await fetch('./modules/admin-panel.html')).text();
        document.body.insertAdjacentHTML('beforeend', html);
        bindAdminEvents();
        adminState.panelLoaded = true;
    }
    document.getElementById('adminPanel').style.display = 'flex';
    loadStats();
    loadUsers();
    loadPublicPages();
}

function bindAdminEvents() {
    // 关闭
    document.getElementById('adminClose').addEventListener('click', () => {
        document.getElementById('adminPanel').style.display = 'none';
    });
    document.getElementById('adminOverlay').addEventListener('click', () => {
        document.getElementById('adminPanel').style.display = 'none';
    });

    // Tab 切换
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
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

    // 权限弹窗
    document.getElementById('cancelPerm').addEventListener('click', () => {
        document.getElementById('permModal').style.display = 'none';
    });
    document.getElementById('permOverlay').addEventListener('click', () => {
        document.getElementById('permModal').style.display = 'none';
    });
    document.getElementById('savePerm').addEventListener('click', savePermissions);

    // 公开页面保存
    document.getElementById('savePublicPagesBtn').addEventListener('click', savePublicPages);
}

// ====== 统计数据 ======

async function loadStats() {
    const result = await api.users.stats();
    if (!result.users) return;

    document.getElementById('statUsers').textContent = result.users.total;
    document.getElementById('statPosts').textContent = result.posts.total;
    document.getElementById('statViews').textContent = formatNum(result.posts.views);
    document.getElementById('statLikes').textContent = formatNum(result.posts.likes);
    document.getElementById('statComments').textContent = result.comments;
    document.getElementById('statMessages').textContent = result.messages;
}

function formatNum(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n;
}

// ====== 用户列表 ======

async function loadUsers() {
    const result = await api.users.list(adminState.usersPage, 10, adminState.usersSearch || undefined);
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
    }

    renderPagination();
}

function renderUserCard(u) {
    const pagePerms = (u.permissions || []).filter(p => p.resource_type === 'page');
    const permTags = pagePerms.map(p => {
        const pg = PAGE_LIST.find(x => x.id === p.resource_id);
        return `<span class="perm-mini-tag"><i class="fas ${pg ? pg.icon : 'fa-file'}"></i>${pg ? pg.name : p.resource_id}</span>`;
    }).join('');

    const metaItems = [];
    if (u.phone) metaItems.push(`<span><i class="fas fa-phone"></i>${u.phone}</span>`);
    if (u.email) metaItems.push(`<span><i class="fas fa-envelope"></i>${u.email}</span>`);
    if (u.wechat) metaItems.push(`<span><i class="fab fa-weixin"></i>${u.wechat}</span>`);
    if (u.qq) metaItems.push(`<span><i class="fab fa-qq"></i>${u.qq}</span>`);

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
                <button class="admin-btn sm warning" data-action="perm" data-id="${u.id}" data-name="${u.name}" title="权限"><i class="fas fa-key"></i></button>
                <button class="admin-btn sm danger" data-action="delete" data-id="${u.id}" data-name="${u.name}" title="删除"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="user-card-code">
            <span class="user-card-code-label"><i class="fas fa-key"></i> 认证码:</span>
            <span class="access-code">${u.access_code || '-'}</span>
            <button class="admin-btn sm" data-action="reset-code" data-id="${u.id}" title="重新生成"><i class="fas fa-sync-alt"></i> 重置</button>
        </div>
        ${permTags ? `<div class="user-card-perms">${permTags}</div>` : ''}
    </div>`;
}

function handleUserAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id);
    const name = btn.dataset.name || '';

    switch (action) {
        case 'edit': openUserForm(id); break;
        case 'perm': openPermModal(id, name); break;
        case 'delete': confirmDeleteUser(id, name); break;
        case 'reset-code': resetAccessCode(id); break;
    }
}

// ====== 分页 ======

function renderPagination() {
    const container = document.getElementById('usersPagination');
    const totalPages = Math.ceil(adminState.usersTotal / 10);
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

// ====== 权限管理弹窗 ======

async function openPermModal(userId, userName) {
    adminState.permUserId = userId;
    adminState.permUserName = userName;

    document.getElementById('permUserName').textContent = `用户: ${userName}`;

    const result = await api.users.getPermissions(userId);
    adminState.permCurrentPerms = (result.permissions || []).filter(p => p.resource_type === 'page');

    const container = document.getElementById('permCheckList');
    container.innerHTML = PAGE_LIST.map(page => {
        const hasPerm = adminState.permCurrentPerms.some(p => p.resource_id === page.id);
        return `
            <div class="perm-check-item">
                <label for="perm_chk_${page.id}">
                    <i class="fas ${page.icon}"></i>
                    ${page.name}
                </label>
                <label class="perm-checkbox">
                    <input type="checkbox" id="perm_chk_${page.id}" data-page="${page.id}" ${hasPerm ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
            </div>`;
    }).join('');

    document.getElementById('permModal').style.display = 'flex';
}

async function savePermissions() {
    const userId = adminState.permUserId;
    if (!userId) return;

    const checkedPages = [];
    PAGE_LIST.forEach(page => {
        const cb = document.getElementById(`perm_chk_${page.id}`);
        if (cb && cb.checked) checkedPages.push(page.id);
    });

    const currentPages = adminState.permCurrentPerms.map(p => p.resource_id);
    const toAdd = checkedPages.filter(p => !currentPages.includes(p));
    const toDelete = adminState.permCurrentPerms.filter(p => !checkedPages.includes(p.resource_id));

    for (const pageId of toAdd) {
        await api.users.addPermission(userId, { user_id: userId, resource_type: 'page', resource_id: pageId });
    }
    for (const perm of toDelete) {
        await api.users.deletePermission(userId, perm.id);
    }

    showAuthNotification('权限已保存', 'success');
    document.getElementById('permModal').style.display = 'none';
    loadUsers();
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

window.initAdmin = initAdmin;
window.openAdminPanel = openAdminPanel;
