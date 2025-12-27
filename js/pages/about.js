// 关于我页面特定的功能
function initAbout() {
    // 为个人特质卡片添加动画
    const traitCards = document.querySelectorAll('.trait-card');
    traitCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s, transform 0.5s';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 500 + index * 100);
    });
}

// 导出函数
window.initAbout = initAbout;