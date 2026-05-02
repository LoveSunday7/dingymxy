// 首页特定的功能
function initHome() {
    // 为兴趣项添加延迟动画
    const interestItems = document.querySelectorAll('.interest-item');
    interestItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'opacity 0.5s, transform 0.5s';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 300 + index * 100);
    });
}

// 导出函数
window.initHome = initHome;