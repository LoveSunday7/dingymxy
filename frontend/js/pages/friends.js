// 朋友圈页面特定的功能
function initFriends() {
    console.log('朋友圈页面初始化');
    
    // 限制图片显示最多9张
    const momentImages = document.querySelectorAll('.moment-images');
    
    momentImages.forEach(imagesContainer => {
        const imageGrid = imagesContainer.querySelector('.image-grid');
        const imageItems = imageGrid.querySelectorAll('.image-item');
        const count = parseInt(imagesContainer.dataset.count || '0');
        
        // 如果图片数量超过9张，隐藏多余的图片
        if (count > 9) {
            for (let i = 9; i < imageItems.length; i++) {
                imageItems[i].style.display = 'none';
            }
            
            // 在第九张图片上显示更多提示
            if (imageItems.length >= 9) {
                const ninthItem = imageItems[8];
                ninthItem.innerHTML += `
                    <div class="moment-more-images">
                        <span class="more-count">+${count - 9}</span>
                    </div>
                `;
            }
        }
        
        // 为所有图片（不超过9张）添加点击事件
        imageItems.forEach((item, index) => {
            if (index < 9 && item.style.display !== 'none') {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const imgSrc = item.querySelector('img').src;
                    showImagePreview(imgSrc);
                });
            }
        });
    });
    
    // 点赞功能
    const likeBtns = document.querySelectorAll('.like-btn');
    likeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (icon.classList.contains('fa-thumbs-up')) {
                icon.classList.remove('fa-thumbs-up');
                icon.classList.add('fa-heart');
                this.style.color = 'var(--primary-color)';
                this.innerHTML = '<i class="fas fa-heart"></i> 已赞';
            } else {
                icon.classList.remove('fa-heart');
                icon.classList.add('fa-thumbs-up');
                this.style.color = '';
                this.innerHTML = '<i class="fas fa-thumbs-up"></i> 点赞';
            }
        });
    });
    
    // 评论功能
    const commentBtns = document.querySelectorAll('.comment-btn');
    commentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const moment = this.closest('.friend-moment');
            const commentInput = moment.querySelector('.comment-input') || createCommentInput(moment);
            
            if (commentInput.style.display === 'none' || !commentInput.style.display) {
                commentInput.style.display = 'block';
                commentInput.querySelector('input').focus();
            } else {
                commentInput.style.display = 'none';
            }
        });
    });
}

// 创建评论输入框
function createCommentInput(moment) {
    const commentInput = document.createElement('div');
    commentInput.className = 'comment-input';
    commentInput.innerHTML = `
        <div style="margin-top: 1rem; display: none;">
            <input type="text" placeholder="写下你的评论..." style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <button class="comment-submit-btn" style="background-color: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">发送</button>
        </div>
    `;
    
    moment.appendChild(commentInput);
    
    const submitBtn = commentInput.querySelector('.comment-submit-btn');
    const input = commentInput.querySelector('input');
    
    submitBtn.addEventListener('click', function() {
        if (input.value.trim()) {
            alert('评论已发送: ' + input.value);
            input.value = '';
            commentInput.style.display = 'none';
        }
    });
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            alert('评论已发送: ' + this.value);
            this.value = '';
            commentInput.style.display = 'none';
        }
    });
    
    return commentInput;
}

// 图片预览功能
function showImagePreview(imgSrc) {
    // 创建预览层
    const previewOverlay = document.createElement('div');
    previewOverlay.className = 'image-preview-overlay';
    previewOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // 创建图片容器
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        position: relative;
    `;
    
    // 创建图片
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.cssText = `
        width: 100%;
        height: auto;
        border-radius: 0.5rem;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    `;
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.cssText = `
        position: absolute;
        top: -2.5rem;
        right: 0;
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
    `;
    
    // 组装
    imgContainer.appendChild(img);
    imgContainer.appendChild(closeBtn);
    previewOverlay.appendChild(imgContainer);
    document.body.appendChild(previewOverlay);
    
    // 点击关闭
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(previewOverlay);
    });
    
    previewOverlay.addEventListener('click', (e) => {
        if (e.target === previewOverlay) {
            document.body.removeChild(previewOverlay);
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(previewOverlay);
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// 导出函数
window.initFriends = initFriends;