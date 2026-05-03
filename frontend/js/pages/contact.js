// 联系我页面 - 对接后端API版
function initContact() {
    // 外链点击
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.contact-item').innerText.includes('bilibili')) {
                window.open('https://space.bilibili.com/3494360106666242', '_blank');
            } else if (e.target.closest('.contact-item').innerText.includes('GitHub')) {
                window.open('https://github.com/LoveSunday7', '_blank');
            }
        });
    });

    // 留言板
    initMessageBoard();
}

function initMessageBoard() {
    const messageSubmit = document.getElementById('messageSubmit');
    const messageClear = document.getElementById('messageClear');
    const messageName = document.getElementById('messageName');
    const messageEmail = document.getElementById('messageEmail');
    const messageContent = document.getElementById('messageContent');
    const messagesContainer = document.getElementById('messagesContainer');

    let currentPage = 1;
    // 回复状态
    let replyState = { parentId: null, replyToName: null };
    const replyBar = document.getElementById('replyBar');
    const replyToText = document.getElementById('replyToText');
    const cancelReply = document.getElementById('cancelReply');

    loadMessages();

    messageSubmit.addEventListener('click', submitMessage);
    messageClear.addEventListener('click', clearForm);
    messageContent.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && e.ctrlKey) submitMessage();
    });

    if (cancelReply) {
        cancelReply.addEventListener('click', () => {
            replyState = { parentId: null, replyToName: null };
            replyBar.style.display = 'none';
            messageContent.placeholder = '请写下您的留言...';
        });
    }

    async function loadMessages() {
        const result = await api.messages.list(currentPage, 20);

        if (!result.messages) {
            messagesContainer.innerHTML = '<div class="empty-message"><i class="far fa-comment-dots"></i><p>' + (result.message || '加载留言失败') + '</p></div>';
            return;
        }

        if (result.messages.length === 0) {
            messagesContainer.innerHTML = '<div class="empty-message"><i class="far fa-comment-dots"></i><p>还没有留言，快来发表第一条吧！</p></div>';
            return;
        }

        renderMessages(result.messages);
    }

    async function submitMessage() {
        const name = messageName.value.trim();
        const email = messageEmail.value.trim();
        const content = messageContent.value.trim();

        if (!name) { showNotification('请输入您的姓名', 'error'); messageName.focus(); return; }
        if (!content) { showNotification('请输入留言内容', 'error'); messageContent.focus(); return; }
        if (content.length < 2) { showNotification('留言内容至少2个字符', 'error'); messageContent.focus(); return; }
        if (email && !validateEmail(email)) { showNotification('请输入有效的邮箱地址', 'error'); messageEmail.focus(); return; }

        const data = { name, email: email || null, content };
        if (replyState.parentId) {
            data.parent_id = replyState.parentId;
            data.reply_to_name = replyState.replyToName;
        }

        const result = await api.messages.create(data);

        if (result.success) {
            clearForm();
            // 取消回复状态
            replyState = { parentId: null, replyToName: null };
            if (replyBar) replyBar.style.display = 'none';
            messageContent.placeholder = '请写下您的留言...';
            showNotification('留言提交成功！', 'success');
            loadMessages();
            messagesContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            showNotification(result.message || '留言提交失败', 'error');
        }
    }

    function clearForm() {
        messageContent.value = '';
        messageContent.focus();
    }

    function startReply(parentId, replyToName) {
        replyState = { parentId, replyToName };
        if (replyBar && replyToText) {
            replyToText.textContent = replyToName;
            replyBar.style.display = 'flex';
        }
        messageContent.placeholder = `回复 ${replyToName}...`;
        messageContent.focus();
        messageContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function renderMessages(messages) {
        const html = messages.map(m => createMessageHTML(m)).join('');
        messagesContainer.innerHTML = html;
        attachMessageEvents();
    }

    function createMessageHTML(message) {
        const isAdmin = api.isAdmin();
        const isLoggedIn = api.isLoggedIn();

        const avatarText = message.name.charAt(0).toUpperCase();
        const colors = ['#4a90e2', '#f5a623', '#7ed321', '#ff4444', '#9c27b0', '#00bcd4'];
        const colorIndex = message.is_admin ? -1 : message.name.length % colors.length;
        const avatarBg = message.is_admin ? 'linear-gradient(135deg, #667eea, #764ba2)' : colors[colorIndex >= 0 ? colorIndex : 0];
        const adminBadge = message.is_admin ? '<span class="msg-admin-badge"><i class="fas fa-shield-alt"></i> 站长</span>' : '';
        const dateStr = message.created_at ? new Date(message.created_at).toLocaleString('zh-CN') : '';
        const emailHTML = (isLoggedIn && message.email) ? `<div class="message-email">${escapeHtml(message.email)}</div>` : '';

        const repliesHTML = (message.replies || []).map(r => {
            const rAvatar = r.name.charAt(0).toUpperCase();
            const rColorIndex = r.is_admin ? -1 : r.name.length % colors.length;
            const rAvatarBg = r.is_admin ? 'linear-gradient(135deg, #667eea, #764ba2)' : colors[rColorIndex >= 0 ? rColorIndex : 0];
            const rAdminBadge = r.is_admin ? '<span class="msg-admin-badge"><i class="fas fa-shield-alt"></i> 站长</span>' : '';
            const rDate = r.created_at ? new Date(r.created_at).toLocaleString('zh-CN') : '';
            const replyBadge = r.reply_to_name ? `<span class="reply-badge">@${escapeHtml(r.reply_to_name)}</span> ` : '';

            return `
                <div class="message-item reply-item" data-id="${r.id}">
                    <div class="message-header">
                        <div class="message-author">
                            <div class="message-avatar small" style="background: ${rAvatarBg}">${rAvatar}</div>
                            <div class="message-info">
                                <h5>${escapeHtml(r.name)} ${rAdminBadge}</h5>
                            </div>
                        </div>
                        <div class="message-time">${rDate}</div>
                    </div>
                    <div class="message-content">${replyBadge}${escapeHtml(r.content).replace(/\n/g, '<br>')}</div>
                    <div class="message-actions">
                        <button class="like-btn" data-id="${r.id}"><i class="far fa-thumbs-up"></i> <span class="like-count">${r.likes}</span></button>
                        ${isLoggedIn ? `<button class="reply-btn" data-id="${r.id}" data-name="${escapeHtml(r.name)}"><i class="far fa-comment"></i> 回复</button>` : ''}
                        ${isAdmin ? `<button class="delete-btn" data-id="${r.id}"><i class="far fa-trash-alt"></i> 删除</button>` : ''}
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="message-item" data-id="${message.id}">
                <div class="message-header">
                    <div class="message-author">
                        <div class="message-avatar" style="background: ${avatarBg}">${avatarText}</div>
                        <div class="message-info">
                            <h5>${escapeHtml(message.name)} ${adminBadge}</h5>
                            ${emailHTML}
                        </div>
                    </div>
                    <div class="message-time">${dateStr}</div>
                </div>
                <div class="message-content">
                    ${escapeHtml(message.content).replace(/\n/g, '<br>')}
                </div>
                <div class="message-actions">
                    <button class="like-btn" data-id="${message.id}">
                        <i class="far fa-thumbs-up"></i> <span class="like-count">${message.likes}</span>
                    </button>
                    ${isLoggedIn ? `<button class="reply-btn" data-id="${message.id}" data-name="${escapeHtml(message.name)}"><i class="far fa-comment"></i> 回复</button>` : ''}
                    ${isAdmin ? `<button class="delete-btn" data-id="${message.id}"><i class="far fa-trash-alt"></i> 删除</button>` : ''}
                </div>
                ${repliesHTML ? `<div class="message-replies">${repliesHTML}</div>` : ''}
            </div>`;
    }

    function attachMessageEvents() {
        // 点赞
        messagesContainer.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = parseInt(this.dataset.id);
                const result = await api.messages.like(id);
                if (result.success) {
                    const icon = this.querySelector('i');
                    icon.classList.replace('far', 'fas');
                    this.querySelector('.like-count').textContent = result.data.likes;
                    this.style.color = 'var(--primary-color)';
                    setTimeout(() => { this.style.color = ''; }, 1000);
                }
            });
        });

        // 回复
        messagesContainer.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = parseInt(this.dataset.id);
                const name = this.dataset.name;
                startReply(id, name);
            });
        });

        // 管理员删除
        messagesContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = parseInt(this.dataset.id);
                if (!confirm('确定删除该留言？')) return;
                const result = await api.messages.delete(id);
                if (result.success) {
                    showNotification('留言已删除', 'success');
                    loadMessages();
                } else {
                    showNotification(result.message || '删除失败', 'error');
                }
            });
        });
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 1rem; right: 1rem;
            background-color: ${type === 'success' ? '#4caf50' : '#f44336'};
            color: white; padding: 1rem 1.5rem;
            border-radius: 0.5rem; box-shadow: 0 0.25rem 0.75rem rgba(0,0,0,0.2);
            z-index: 99999; animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => { if (notification.parentNode) notification.remove(); }, 300);
        }, 3000);
    }

    // 动画样式
    if (!document.querySelector('#message-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'message-animation-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
            .message-item { animation: fadeIn 0.5s ease; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }
}

window.initContact = initContact;
