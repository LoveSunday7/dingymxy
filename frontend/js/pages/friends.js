// 朋友圈页面功能 - 从后端 API 动态加载
let friendsPage = 1;
let friendsTotalPages = 1;
let friendsLoaded = false;

async function initFriends() {
    console.log('朋友圈页面初始化');

    if (friendsLoaded) return;
    friendsPage = 1;

    try {
        const result = await api.friends.listMoments(1);
        if (result.success) {
            friendsTotalPages = result.total_pages || 1;
            renderMoments(result.moments, true);
            friendsLoaded = true;
            updateLoadMoreBtn();
        }
    } catch (error) {
        console.error('朋友圈数据加载失败:', error);
    }
}

// ====== 加载更多 ======
async function loadMoreMoments() {
    if (friendsPage >= friendsTotalPages) return;

    friendsPage++;
    try {
        const result = await api.friends.listMoments(friendsPage);
        if (result.success) {
            friendsTotalPages = result.total_pages || 1;
            renderMoments(result.moments, false);
            updateLoadMoreBtn();
        }
    } catch (error) {
        console.error('加载更多失败:', error);
        friendsPage--;
    }
}

function updateLoadMoreBtn() {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) {
        btn.style.display = friendsPage >= friendsTotalPages ? 'none' : '';
    }
}

// ====== 渲染动态列表 ======
function renderMoments(moments, clear) {
    const container = document.getElementById('momentsContainer');
    if (!container) return;

    if (clear) container.innerHTML = '';

    if (!moments || moments.length === 0) {
        if (clear) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:3rem;">暂无朋友圈动态</p>';
        }
        return;
    }

    for (const m of moments) {
        const momentEl = createMomentElement(m);
        container.appendChild(momentEl);
    }
}

// ====== 创建单条动态元素 ======
function createMomentElement(m) {
    const div = document.createElement('div');
    div.className = 'friend-moment';
    div.dataset.momentId = m.id;

    const images = Array.isArray(m.images) ? m.images : [];
    const imgCount = images.length;

    div.innerHTML = `
        <div class="moment-header">
            <img src="./images/girlhead.jpg" alt="头像" class="moment-avatar">
            <div class="moment-user-info">
                <h3 class="moment-username">${m.author_name}</h3>
                <span class="moment-time">${formatRelativeTime(m.created_at)}</span>
            </div>
        </div>

        <div class="moment-content">
            <p>${escapeHtml(m.content)}</p>
            ${imgCount > 0 ? renderMomentImages(images) : ''}
        </div>

        <div class="moment-actions">
            <button class="moment-action like-btn" data-action="like">
                <i class="fas fa-thumbs-up"></i>
                <span>${m.likes > 0 ? `点赞 ${m.likes}` : '点赞'}</span>
            </button>
            <button class="moment-action comment-btn" data-action="comment">
                <i class="fas fa-comment"></i>
                <span>${m.comments_count > 0 ? `评论 ${m.comments_count}` : '评论'}</span>
            </button>
        </div>

        <div class="moment-comments" id="comments-${m.id}">
            <!-- 已有评论在展开时加载 -->
        </div>

        <div class="comment-input-area" style="display:none;">
            <input type="text" class="comment-input-field" placeholder="写下你的评论..." maxlength="2000">
            <button class="comment-submit-btn">发送</button>
        </div>
    `;

    // 绑定事件
    bindMomentEvents(div, m);

    return div;
}

// ====== 渲染图片网格 ======
function renderMomentImages(images) {
    const maxShow = 9;
    const count = images.length;

    let html = `<div class="moment-images" data-count="${count}"><div class="image-grid">`;

    const showCount = Math.min(count, maxShow);
    for (let i = 0; i < showCount; i++) {
        const isLast = (i === maxShow - 1 && count > maxShow);
        html += `
            <div class="image-item${count === 1 ? ' single' : ''}">
                <img src="${images[i]}" alt="图片${i + 1}" loading="lazy">
                ${isLast ? `<div class="moment-more-images"><span class="more-count">+${count - maxShow}</span></div>` : ''}
            </div>
        `;
    }
    html += '</div></div>';
    return html;
}

// ====== 绑定动态交互事件 ======
function bindMomentEvents(el, m) {
    // 点赞按钮
    const likeBtn = el.querySelector('[data-action="like"]');
    if (likeBtn) {
        likeBtn.addEventListener('click', async function () {
            const result = await api.friends.likeMoment(m.id);
            if (result.success && result.data) {
                m.likes = result.data.likes;
                const span = this.querySelector('span');
                if (span) span.textContent = `点赞 ${m.likes}`;
            }
        });
    }

    // 评论按钮
    const commentBtn = el.querySelector('[data-action="comment"]');
    const inputArea = el.querySelector('.comment-input-area');
    if (commentBtn && inputArea) {
        commentBtn.addEventListener('click', async () => {
            // 切换评论输入框
            if (inputArea.style.display === 'none' || !inputArea.style.display) {
                inputArea.style.display = 'flex';
                inputArea.querySelector('input').focus();

                // 同时加载已有评论
                await loadComments(el, m.id);
            } else {
                inputArea.style.display = 'none';
            }
        });
    }

    // 评论提交
    const inputField = el.querySelector('.comment-input-field');
    const submitBtn = el.querySelector('.comment-submit-btn');
    const submitComment = async () => {
        const content = inputField.value.trim();
        if (!content) return;

        const result = await api.friends.createComment(m.id, {
            author_name: '访客',
            content: content,
        });
        if (result.success) {
            inputField.value = '';
            inputArea.style.display = 'none';
            m.comments_count = (m.comments_count || 0) + 1;
            const span = commentBtn.querySelector('span');
            if (span) span.textContent = `评论 ${m.comments_count}`;
            // 刷新评论列表
            await loadComments(el, m.id);
        }
    };

    if (submitBtn) submitBtn.addEventListener('click', submitComment);
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitComment();
        });
    }

    // 图片点击预览
    const imageItems = el.querySelectorAll('.image-item img');
    imageItems.forEach(img => {
        img.closest('.image-item').addEventListener('click', (e) => {
            e.stopPropagation();
            showImagePreview(img.src);
        });
    });
}

// ====== 加载评论 ======
async function loadComments(el, momentId) {
    const commentContainer = el.querySelector(`#comments-${momentId}`);
    if (!commentContainer) return;

    // 避免重复加载
    if (commentContainer.dataset.loaded === 'true') return;
    commentContainer.dataset.loaded = 'true';

    try {
        const result = await api.friends.getMoment(momentId);
        const comments = result.comments || [];
        commentContainer.innerHTML = comments.length > 0
            ? comments.map(c => `
                <div class="comment-item" style="padding:0.5rem 0;border-bottom:1px solid var(--border-color);">
                    <strong>${escapeHtml(c.author_name)}</strong>：
                    <span>${escapeHtml(c.content)}</span>
                    <span style="font-size:0.75rem;color:var(--text-secondary);margin-left:0.5rem;">${formatRelativeTime(c.created_at)}</span>
                </div>
            `).join('')
            : '<p style="color:var(--text-secondary);font-size:0.85rem;padding:0.5rem 0;">暂无评论，来说两句吧</p>';
    } catch (e) {
        console.error('加载评论失败:', e);
    }
}

// ====== 相对时间 ======
function formatRelativeTime(isoStr) {
    if (!isoStr) return '';
    const now = Date.now();
    const then = new Date(isoStr + (isoStr.endsWith('Z') ? '' : 'Z')).getTime();
    const diff = now - then;

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return '刚刚';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;

    const days = Math.floor(hours / 24);
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;

    // 返回格式化日期
    const d = new Date(isoStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ====== HTML 转义 ======
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ====== 图片预览 ======
function showImagePreview(imgSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'image-preview-overlay';
    overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background-color:rgba(0,0,0,0.9);z-index:9999;
        display:flex;align-items:center;justify-content:center;
    `;

    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = 'max-width:90%;max-height:90%;position:relative;';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.cssText = 'width:100%;height:auto;border-radius:0.5rem;box-shadow:0 0 20px rgba(0,0,0,0.5);';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.cssText = 'position:absolute;top:-2.5rem;right:0;background:none;border:none;color:white;font-size:1.5rem;cursor:pointer;padding:0.5rem;';

    imgContainer.appendChild(img);
    imgContainer.appendChild(closeBtn);
    overlay.appendChild(imgContainer);
    document.body.appendChild(overlay);

    const close = () => {
        if (overlay.parentNode) document.body.removeChild(overlay);
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

window.initFriends = initFriends;
window.loadMoreMoments = loadMoreMoments;
