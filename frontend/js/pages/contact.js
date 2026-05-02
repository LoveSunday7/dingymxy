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
    console.log('初始化留言板功能');

    const messageSubmit = document.getElementById('messageSubmit');
    const messageClear = document.getElementById('messageClear');
    const messageName = document.getElementById('messageName');
    const messageEmail = document.getElementById('messageEmail');
    const messageContent = document.getElementById('messageContent');
    const messagesContainer = document.getElementById('messagesContainer');

    let currentPage = 1;

    loadMessages();

    messageSubmit.addEventListener('click', submitMessage);
    messageClear.addEventListener('click', clearForm);
    messageContent.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && e.ctrlKey) submitMessage();
    });

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
        if (content.length < 5) { showNotification('留言内容至少5个字符', 'error'); messageContent.focus(); return; }
        if (email && !validateEmail(email)) { showNotification('请输入有效的邮箱地址', 'error'); messageEmail.focus(); return; }

        const result = await api.messages.create({ name, email: email || null, content });

        if (result.success) {
            clearForm();
            showNotification('留言提交成功！', 'success');
            loadMessages();
            messagesContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            showNotification(result.message || '留言提交失败', 'error');
        }
    }

    function clearForm() {
        messageName.value = '';
        messageEmail.value = '';
        messageContent.value = '';
        messageName.focus();
    }

    function renderMessages(messages) {
        const html = messages.map(m => createMessageHTML(m)).join('');
        messagesContainer.innerHTML = html;
        attachMessageEvents();
    }

    function createMessageHTML(message) {
        const avatarText = message.name.charAt(0).toUpperCase();
        const colors = ['#4a90e2', '#f5a623', '#7ed321', '#ff4444', '#9c27b0', '#00bcd4'];
        const colorIndex = message.name.length % colors.length;
        const dateStr = message.created_at ? new Date(message.created_at).toLocaleString('zh-CN') : '';

        return `
            <div class="message-item" data-id="${message.id}">
                <div class="message-header">
                    <div class="message-author">
                        <div class="message-avatar" style="background-color: ${colors[colorIndex]}">
                            ${avatarText}
                        </div>
                        <div class="message-info">
                            <h5>${escapeHtml(message.name)}</h5>
                            <div class="message-email">${escapeHtml(message.email || '')}</div>
                        </div>
                    </div>
                    <div class="message-time">${dateStr}</div>
                </div>
                <div class="message-content">
                    ${escapeHtml(message.content).replace(/\n/g, '<br>')}
                </div>
                <div class="message-actions">
                    <button class="like-btn" data-id="${message.id}">
                        <i class="far fa-thumbs-up"></i> 喜欢 <span class="like-count">${message.likes}</span>
                    </button>
                </div>
            </div>
        `;
    }

    function attachMessageEvents() {
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
            z-index: 10000; animation: slideIn 0.3s ease;
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
