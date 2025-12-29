// 简历页面特定的功能
function initResume() {
    console.log('简历页面初始化');
    
    // 为简历卡片添加动画
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s, transform 0.5s';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + index * 100);
    });
    
    // 为技能类别卡片添加悬停效果
    const skillCategories = document.querySelectorAll('.skill-category');
    skillCategories.forEach(category => {
        category.addEventListener('mouseenter', () => {
            category.style.transform = 'translateY(-5px)';
        });
        
        category.addEventListener('mouseleave', () => {
            category.style.transform = 'translateY(0)';
        });
    });
    
    // 为项目经历卡片添加点击展开/收起功能
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(item => {
        const details = item.querySelector('.project-details');
        const header = item.querySelector('.project-header');
        
        // 初始状态：展开
        details.style.maxHeight = 'none';
        details.style.overflow = 'visible';
        
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            if (details.style.maxHeight === 'none' || !details.style.maxHeight) {
                details.style.maxHeight = '150px';
                details.style.overflow = 'hidden';
                item.style.transition = 'max-height 0.3s ease';
            } else {
                details.style.maxHeight = 'none';
                details.style.overflow = 'visible';
            }
        });
    });
}

// 导出函数
window.initResume = initResume;