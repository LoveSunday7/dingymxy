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
    
    const savedBackground = localStorage.getItem('background') || './images/star.avif';
    console.log('加载保存的背景:', savedBackground);
  
    if (savedBackground === 'none') {
        backgroundLayer.style.backgroundImage = 'none';
    } else {
        backgroundLayer.style.backgroundImage = `url('${savedBackground}')`;
    }
    
    backgroundOptions.forEach(option => {
        if (option.dataset.bg === savedBackground) {
            option.classList.add('active');
        }
    });
    backgroundToggle.addEventListener('click', (e) => {
        e.stopPropagation(); 
        console.log('点击背景切换按钮');
        backgroundPanel.classList.toggle('active');
    });
    
    backgroundOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const bgClass = option.dataset.bg;
            console.log('选择背景:', bgClass);
            
            backgroundOptions.forEach(opt => {
                opt.classList.remove('active');
            });
            
            option.classList.add('active');
            
            if (bgClass === 'none') {
                backgroundLayer.style.backgroundImage = 'none';
                localStorage.setItem('background', 'none');
            } else {
                backgroundLayer.style.backgroundImage = `url('${bgClass}')`;
                localStorage.setItem('background', bgClass);
            }
            backgroundPanel.classList.remove('active');
        });
    });
   
    document.addEventListener('click', (e) => {
        if (!backgroundToggle.contains(e.target) && !backgroundPanel.contains(e.target)) {
            backgroundPanel.classList.remove('active');
        }
    });
    
    console.log('背景设置功能初始化完成');
}

window.initBackground = initBackground;