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
}

// 导出函数
window.initContact = initContact;