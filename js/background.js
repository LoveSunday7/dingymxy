// 背景设置功能
function initBackground() {
    console.log('初始化背景设置功能...');
    
    const backgroundToggle = document.getElementById('backgroundToggle');
    const backgroundPanel = document.getElementById('backgroundPanel');
    const backgroundOptions = document.querySelectorAll('.background-option');
    const backgroundLayer = document.querySelector('.background-layer');
    
    if (!backgroundToggle || !backgroundPanel || !backgroundLayer) {
        console.error('背景切换功能初始化失败：缺少必要的DOM元素');
        return;
    }
    
    // 1. 检查本地存储中的背景偏好
    const savedBackground = localStorage.getItem('background') || './images/star.avif';
    console.log('加载保存的背景:', savedBackground);
    
    // 设置默认背景为星空
    if (savedBackground === 'none') {
        backgroundLayer.style.backgroundImage = 'none';
    } else {
        backgroundLayer.style.backgroundImage = `url('${savedBackground}')`;
    }
    
    // 2. 设置对应的选项为激活状态
    backgroundOptions.forEach(option => {
        if (option.dataset.bg === savedBackground) {
            option.classList.add('active');
        }
    });
    
    // 3. 切换背景面板显示/隐藏
    backgroundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('点击背景切换按钮');
        backgroundPanel.classList.toggle('active');
    });
    
    // 4. 点击预设背景选项
    backgroundOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const bgClass = option.dataset.bg;
            console.log('选择背景:', bgClass);
            
            // 移除所有激活状态
            backgroundOptions.forEach(opt => {
                opt.classList.remove('active');
            });
            
            // 设置激活状态
            option.classList.add('active');
            
            // 更新背景
            if (bgClass === 'none') {
                backgroundLayer.style.backgroundImage = 'none';
                localStorage.setItem('background', 'none');
            } else {
                backgroundLayer.style.backgroundImage = `url('${bgClass}')`;
                localStorage.setItem('background', bgClass);
            }
            
            // 隐藏面板
            backgroundPanel.classList.remove('active');
        });
    });
    
    // 5. 点击页面其他地方关闭背景面板
    document.addEventListener('click', (e) => {
        if (!backgroundToggle.contains(e.target) && !backgroundPanel.contains(e.target)) {
            backgroundPanel.classList.remove('active');
        }
    });
    
    console.log('背景设置功能初始化完成');
}

// 导出函数
window.initBackground = initBackground;