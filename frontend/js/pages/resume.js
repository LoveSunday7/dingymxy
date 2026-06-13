// 简历页面功能 - 从后端 API 动态加载
async function initResume() {
    console.log('简历页面初始化');

    try {
        // 并行加载所有数据
        const [resumeResult, eventsResult, projectsResult] = await Promise.all([
            api.resume.getAll(),
            api.experience.list(),
            api.experience.listProjects(),
        ]);

        if (resumeResult.success) {
            renderResumeSections(resumeResult.sections);
        }

        if (eventsResult.success) {
            const workEvents = eventsResult.events.filter(e => e.event_type === 'work');
            const eduEvents = eventsResult.events.filter(e => e.event_type === 'education');
            renderWorkExperience(workEvents);
            renderEducation(eduEvents);
        }

        if (projectsResult.success && projectsResult.projects.length > 0) {
            renderProjects(projectsResult.projects);
        } else {
            const card = document.getElementById('resumeProjectsCard');
            if (card) card.style.display = 'none';
        }

        // 初始化入场动画
        initResumeAnimations();

        // 触发滚动动画重新检测
        setTimeout(() => {
            if (typeof initScrollAnimation === 'function') initScrollAnimation();
        }, 200);

    } catch (error) {
        console.error('简历数据加载失败:', error);
    }
}

// ====== 渲染各 section ======

function renderResumeSections(sections) {
    const sectionMap = {};
    for (const s of sections) {
        sectionMap[s.section] = s.fields;
    }

    if (sectionMap.basic_info) renderBasicInfo(sectionMap.basic_info);
    if (sectionMap.bio) renderBio(sectionMap.bio);
    if (sectionMap.skills) renderSkills(sectionMap.skills);
    if (sectionMap.traits) renderTraits(sectionMap.traits);
    if (sectionMap.certs) renderCerts(sectionMap.certs);
}

// ====== 基本信息 ======
function renderBasicInfo(fields) {
    const grid = document.getElementById('resumeInfoGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const field of fields) {
        const item = document.createElement('div');
        item.className = 'info-item';
        item.innerHTML = `
            <span class="info-label">${field.field_label}：</span>
            <span class="info-content">${formatBasicInfoValue(field)}</span>
        `;
        grid.appendChild(item);
    }
}

function formatBasicInfoValue(field) {
    const val = field.field_value;
    if (field.field_key === 'email') {
        return `<a href="mailto:${val}">${val}</a>`;
    }
    if (field.field_key === 'github') {
        return `<a href="https://${val}" target="_blank" rel="noopener">${val}</a>`;
    }
    return val;
}

// ====== 个人简介 ======
function renderBio(fields) {
    const container = document.getElementById('resumeBio');
    if (!container || !fields.length) return;
    container.innerHTML = '';

    // bio section 单字段，按段落分割
    const bioText = fields[0].field_value;
    const paragraphs = bioText.split('\n').filter(p => p.trim());
    for (const p of paragraphs) {
        const el = document.createElement('p');
        el.textContent = p.trim();
        container.appendChild(el);
    }
}

// ====== 专业技能 ======
const SKILL_ICONS = {
    frontend: 'fa-laptop-code',
    backend: 'fa-server',
    tools: 'fa-tools',
    soft: 'fa-users',
};

function renderSkills(fields) {
    const container = document.getElementById('resumeSkills');
    if (!container) return;
    container.innerHTML = '';

    for (const field of fields) {
        const icon = SKILL_ICONS[field.field_key] || 'fa-code';
        const items = field.field_value.split(',').filter(i => i.trim());

        const category = document.createElement('div');
        category.className = 'skill-category';
        category.innerHTML = `
            <div class="skill-header">
                <i class="fas ${icon}"></i>
                <h4>${field.field_label}</h4>
            </div>
            <ul>
                ${items.map(item => `<li>${item.trim()}</li>`).join('')}
            </ul>
        `;

        // 悬停效果
        category.addEventListener('mouseenter', () => {
            category.style.transform = 'translateY(-5px)';
        });
        category.addEventListener('mouseleave', () => {
            category.style.transform = 'translateY(0)';
        });

        container.appendChild(category);
    }
}

// ====== 工作经历 (从 timeline_events) ======
function renderWorkExperience(events) {
    const container = document.getElementById('resumeWorkExp');
    const card = document.getElementById('resumeWorkExpCard');
    if (!container || !events.length) {
        if (card) card.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    for (const event of events) {
        const item = document.createElement('div');
        item.className = 'experience-item';
        item.innerHTML = `
            <div class="experience-header">
                <h4>${event.title}</h4>
                <span class="experience-period">${event.start_date} - ${event.end_date}</span>
            </div>
            <div class="experience-company">${event.organization}${event.location ? ' · ' + event.location : ''}</div>
            <div class="experience-details">
                ${event.summary ? `<p>${event.summary}</p>` : ''}
                ${event.highlights && event.highlights.length ? `
                <ul>
                    ${event.highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>` : ''}
            </div>
        `;
        container.appendChild(item);
    }
}

// ====== 项目经历 ======
function renderProjects(projects) {
    const container = document.getElementById('resumeProjects');
    const card = document.getElementById('resumeProjectsCard');
    if (!container || !projects.length) {
        if (card) card.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    for (const proj of projects) {
        const item = document.createElement('div');
        item.className = 'project-item';
        item.innerHTML = `
            <div class="project-header">
                <h4>${proj.title}</h4>
                ${proj.period ? `<span class="project-period">${proj.period}</span>` : ''}
            </div>
            ${proj.role ? `<div class="project-role">${proj.role}</div>` : ''}
            <div class="project-details">
                ${proj.description ? `<p><strong>项目描述：</strong>${proj.description}</p>` : ''}
                ${proj.tech_stack && proj.tech_stack.length ? `<p><strong>技术栈：</strong>${proj.tech_stack.join(', ')}</p>` : ''}
                ${proj.highlights && proj.highlights.length ? `
                <ul>
                    ${proj.highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>` : ''}
                ${proj.post_id ? `<p><a href="#blog/${proj.post_id}" onclick="if(typeof switchPage==='function'){event.preventDefault();switchPage('blog');setTimeout(()=>location.hash='blog/${proj.post_id}',200);}" style="color:var(--primary-color);"><i class="fas fa-external-link-alt"></i> 查看博客详情</a></p>` : ''}
            </div>
        `;

        // 点击展开/收起
        const header = item.querySelector('.project-header');
        const details = item.querySelector('.project-details');
        if (header && details) {
            details.style.maxHeight = 'none';
            details.style.overflow = 'visible';
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                if (details.style.maxHeight === 'none' || !details.style.maxHeight) {
                    details.style.maxHeight = '150px';
                    details.style.overflow = 'hidden';
                } else {
                    details.style.maxHeight = 'none';
                    details.style.overflow = 'visible';
                }
            });
        }

        container.appendChild(item);
    }
}

// ====== 教育背景 ======
function renderEducation(events) {
    const container = document.getElementById('resumeEducation');
    const card = document.getElementById('resumeEducationCard');
    if (!container || !events.length) {
        if (card) card.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    for (const event of events) {
        const item = document.createElement('div');
        item.className = 'education-item';
        item.innerHTML = `
            <div class="education-header">
                <h4>${event.organization || event.title}</h4>
                <span class="education-period">${event.start_date} - ${event.end_date}</span>
            </div>
            <div class="education-details">
                ${event.title ? `<p><strong>学位：</strong>${event.title}</p>` : ''}
                ${event.summary ? `<p>${event.summary}</p>` : ''}
                ${event.highlights && event.highlights.length ? `
                <ul>
                    ${event.highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>` : ''}
            </div>
        `;
        container.appendChild(item);
    }
}

// ====== 荣誉证书 ======
function renderCerts(fields) {
    const container = document.getElementById('resumeCerts');
    const card = document.getElementById('resumeCertsCard');
    if (!container || !fields.length) {
        if (card) card.style.display = 'none';
        return;
    }

    card.style.display = '';
    container.innerHTML = '';
    for (const field of fields) {
        const item = document.createElement('div');
        item.className = 'award-item';
        item.innerHTML = `
            <div class="award-icon">
                <i class="fas fa-certificate"></i>
            </div>
            <div class="award-content">
                <h4>${field.field_label}</h4>
                <p>${field.field_value}</p>
            </div>
        `;
        container.appendChild(item);
    }
}

// ====== 个人特质 ======
const TRAIT_ICONS = {
    creativity: 'fa-lightbulb',
    teamwork: 'fa-users',
    learning: 'fa-rocket',
    responsibility: 'fa-handshake',
};

function renderTraits(fields) {
    const container = document.getElementById('resumeTraits');
    const card = document.getElementById('resumeTraitsCard');
    if (!container || !fields.length) {
        if (card) card.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    for (const field of fields) {
        const icon = TRAIT_ICONS[field.field_key] || 'fa-star';
        const item = document.createElement('div');
        item.className = 'trait-item';
        item.innerHTML = `
            <div class="trait-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="trait-content">
                <h4>${field.field_label}</h4>
                <p>${field.field_value}</p>
            </div>
        `;
        container.appendChild(item);
    }
}

// ====== 入场动画 ======
function initResumeAnimations() {
    const cards = document.querySelectorAll('#resume .card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s, transform 0.5s';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + index * 100);
    });
}

window.initResume = initResume;
