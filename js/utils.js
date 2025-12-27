// 工具函数
function initUtils() {
    console.log('Utils initialized');
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 滚动动画
function initScrollAnimation() {
    const elements = document.querySelectorAll('.card, .timeline-item, .project-card, .skill-item');
    
    const handleScroll = () => {
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.8) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };
    
    // 初始化动画状态
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s, transform 0.5s';
    });
    
    window.addEventListener('scroll', throttle(handleScroll, 100));
    handleScroll(); // 初始检查
}

// 导出函数
window.initUtils = initUtils;
window.debounce = debounce;
window.throttle = throttle;
window.initScrollAnimation = initScrollAnimation;

// 检查背景面板功能
function checkBackgroundPanel() {
    console.log('=== 检查背景面板 ===');
    console.log('1. 背景切换按钮:', document.getElementById('backgroundToggle'));
    console.log('2. 背景面板:', document.getElementById('backgroundPanel'));
    console.log('3. 背景面板位置:', document.getElementById('backgroundPanel')?.getBoundingClientRect());
    console.log('4. 背景选项数量:', document.querySelectorAll('.background-option').length);
    console.log('5. 背景层:', document.querySelector('.background-layer'));
    console.log('6. 当前背景图片:', document.querySelector('.background-layer')?.style.backgroundImage);
}

window.checkBackgroundPanel = checkBackgroundPanel;