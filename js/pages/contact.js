// 联系我页面特定的功能
function initContact() {
    // 为联系项目添加点击事件
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
    
    // 留言板功能
    initMessageBoard();
}

// 留言板初始化
function initMessageBoard() {
    console.log('初始化留言板功能');
    
    // DOM元素
    const messageSubmit = document.getElementById('messageSubmit');
    const messageClear = document.getElementById('messageClear');
    const messageName = document.getElementById('messageName');
    const messageEmail = document.getElementById('messageEmail');
    const messageContent = document.getElementById('messageContent');
    const messagesContainer = document.getElementById('messagesContainer');
    
    // 存储留言的键名
    const MESSAGES_KEY = 'contact_messages';
    
    // 加载已有的留言
    loadMessages();
    
    // 提交留言事件
    messageSubmit.addEventListener('click', submitMessage);
    
    // 清空表单事件
    messageClear.addEventListener('click', clearForm);
    
    // 按回车键提交（在留言内容框）
    messageContent.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            submitMessage();
        }
    });
    
    // 加载留言
    function loadMessages() {
        const messages = getMessages();
        
        if (messages.length === 0) {
            showEmptyMessage();
            return;
        }
        
        renderMessages(messages);
    }
    
    // 获取留言列表
    function getMessages() {
        try {
            const messagesJson = localStorage.getItem(MESSAGES_KEY);
            return messagesJson ? JSON.parse(messagesJson) : [];
        } catch (error) {
            console.error('读取留言失败:', error);
            return [];
        }
    }
    
    // 保存留言
    function saveMessages(messages) {
        try {
            localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error('保存留言失败:', error);
        }
    }
    
    // 提交留言
    function submitMessage() {
        const name = messageName.value.trim();
        const email = messageEmail.value.trim();
        const content = messageContent.value.trim();
        
        // 验证表单
        if (!name) {
            showNotification('请输入您的姓名', 'error');
            messageName.focus();
            return;
        }
        
        if (!content) {
            showNotification('请输入留言内容', 'error');
            messageContent.focus();
            return;
        }
        
        if (content.length < 5) {
            showNotification('留言内容至少5个字符', 'error');
            messageContent.focus();
            return;
        }
        
        // 如果有邮箱，验证邮箱格式
        if (email && !validateEmail(email)) {
            showNotification('请输入有效的邮箱地址', 'error');
            messageEmail.focus();
            return;
        }
        
        // 创建新留言
        const newMessage = {
            id: Date.now(),
            name: name,
            email: email || '未提供邮箱',
            content: content,
            time: new Date().toLocaleString('zh-CN'),
            likes: 0,
            replies: []
        };
        
        // 获取现有留言并添加新留言
        const messages = getMessages();
        messages.unshift(newMessage); // 新留言放在最前面
        
        // 保存到本地存储
        saveMessages(messages);
        
        // 重新渲染留言列表
        renderMessages(messages);
        
        // 清空表单
        clearForm();
        
        // 显示成功消息
        showNotification('留言提交成功！', 'success');
        
        // 滚动到留言列表顶部
        messagesContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 清空表单
    function clearForm() {
        messageName.value = '';
        messageEmail.value = '';
        messageContent.value = '';
        messageName.focus();
    }
    
    // 渲染留言列表
    function renderMessages(messages) {
        if (messages.length === 0) {
            showEmptyMessage();
            return;
        }
        
        const messagesHTML = messages.map(message => createMessageHTML(message)).join('');
        messagesContainer.innerHTML = messagesHTML;
        
        // 为每个留言的操作按钮添加事件监听
        attachMessageEvents(messages);
    }
    
    // 创建留言HTML
    function createMessageHTML(message) {
        // 获取姓名的首字母作为头像
        const avatarText = message.name.charAt(0).toUpperCase();
        
        // 随机颜色（基于姓名生成）
        const colors = ['#4a90e2', '#f5a623', '#7ed321', '#ff4444', '#9c27b0', '#00bcd4'];
        const colorIndex = message.name.length % colors.length;
        const avatarColor = colors[colorIndex];
        
        return `
            <div class="message-item" data-id="${message.id}">
                <div class="message-header">
                    <div class="message-author">
                        <div class="message-avatar" style="background-color: ${avatarColor}">
                            ${avatarText}
                        </div>
                        <div class="message-info">
                            <h5>${escapeHtml(message.name)}</h5>
                            <div class="message-email">${escapeHtml(message.email)}</div>
                        </div>
                    </div>
                    <div class="message-time">${message.time}</div>
                </div>
                <div class="message-content">
                    ${escapeHtml(message.content).replace(/\n/g, '<br>')}
                </div>
                <div class="message-actions">
                    <button class="like-btn" data-id="${message.id}">
                        <i class="far fa-thumbs-up"></i> 喜欢 <span class="like-count">${message.likes}</span>
                    </button>
                    <button class="delete-btn" data-id="${message.id}">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                </div>
            </div>
        `;
    }
    
    // 显示空状态
    function showEmptyMessage() {
        messagesContainer.innerHTML = `
            <div class="empty-message">
                <i class="far fa-comment-dots"></i>
                <p>还没有留言，快来发表第一条吧！</p>
            </div>
        `;
    }
    
    // 为留言操作按钮添加事件监听
    function attachMessageEvents(messages) {
        // 点赞按钮
        const likeButtons = messagesContainer.querySelectorAll('.like-btn');
        likeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const messageId = parseInt(this.dataset.id);
                likeMessage(messageId);
            });
        });
        
        // 删除按钮
        const deleteButtons = messagesContainer.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const messageId = parseInt(this.dataset.id);
                deleteMessage(messageId);
            });
        });
    }
    
    // 点赞留言
    function likeMessage(messageId) {
        const messages = getMessages();
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        
        if (messageIndex !== -1) {
            messages[messageIndex].likes += 1;
            saveMessages(messages);
            renderMessages(messages);
            
            // 显示点赞成功消息
            const likeBtn = document.querySelector(`.like-btn[data-id="${messageId}"]`);
            if (likeBtn) {
                const icon = likeBtn.querySelector('i');
                icon.classList.remove('far');
                icon.classList.add('fas');
                likeBtn.style.color = 'var(--primary-color)';
                
                setTimeout(() => {
                    likeBtn.style.color = '';
                }, 1000);
            }
        }
    }
    
    // 删除留言
    function deleteMessage(messageId) {
        if (!confirm('确定要删除这条留言吗？')) {
            return;
        }
        
        const messages = getMessages();
        const filteredMessages = messages.filter(msg => msg.id !== messageId);
        saveMessages(filteredMessages);
        renderMessages(filteredMessages);
        
        showNotification('留言已删除', 'success');
    }
    
    // 验证邮箱格式
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // 转义HTML，防止XSS攻击
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 显示通知
    function showNotification(message, type) {
        // 移除已有的通知
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
        
        // 3秒后移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    // 添加CSS动画样式
    if (!document.querySelector('#message-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'message-animation-styles';
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
            
            .message-item {
                animation: fadeIn 0.5s ease;
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 导出函数
window.initContact = initContact;