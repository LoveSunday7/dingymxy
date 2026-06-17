// 经历页面功能 - 从后端 API 动态加载时间线
async function initExperience() {
    console.log('经历页面初始化');

    try {
        const result = await api.experience.list();
        if (result.success) {
            renderTimeline(result.events);
        }

        // 触发滚动动画重新检测
        setTimeout(() => {
            if (typeof initScrollAnimation === 'function') initScrollAnimation();
        }, 200);

    } catch (error) {
        console.error('经历数据加载失败:', error);
    }
}

// ====== 事件类型配置 ======
const EVENT_TYPE_CONFIG = {
    work: {
        icon: 'fa-briefcase',
        label: '工作经历',
        color: 'var(--primary-color)',
    },
    education: {
        icon: 'fa-graduation-cap',
        label: '教育背景',
        color: '#4caf50',
    },
    life: {
        icon: 'fa-heart',
        label: '生活点滴',
        color: '#e91e63',
    },
};

// ====== 渲染时间线 ======
function renderTimeline(events) {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!events || events.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:3rem;">暂无经历记录</p>';
        return;
    }

    for (const event of events) {
        const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.work;
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="timeline-type-badge" style="background-color:${config.color};color:#fff;padding:0.15rem 0.6rem;border-radius:1rem;font-size:0.75rem;margin-right:0.5rem;">
                        <i class="fas ${config.icon}"></i> ${config.label}
                    </span>
                    ${event.start_date} - ${event.end_date}
                </div>
                <h3>${event.title}</h3>
                ${event.organization ? `<p>${event.organization}${event.location ? ' · ' + event.location : ''}</p>` : ''}
                ${event.summary ? `<p>${event.summary}</p>` : ''}
                ${event.highlights && event.highlights.length ? `
                <p><span class="highlight">关键成就：</span>${event.highlights.join('；')}</p>
                ` : ''}
            </div>
        `;
        container.appendChild(item);
    }
}

window.initExperience = initExperience;
