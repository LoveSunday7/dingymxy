// 前端部署配置
// 复制此文件为 config.local.js 并修改为你的本地配置
// config.local.js 会被 .gitignore 忽略

const DEPLOY_CONFIG = {
    // 后端API地址（根据部署环境修改）
    production: {
        apiBaseUrl: 'https://your-domain.com/api',
    },
    development: {
        apiBaseUrl: 'http://172.18.217.177:8000/api',
    },
    // 当前环境
    current: 'development',
};

// 自动应用配置
if (typeof APP_CONFIG !== 'undefined' && DEPLOY_CONFIG.current) {
    APP_CONFIG.apiBaseUrl = DEPLOY_CONFIG[DEPLOY_CONFIG.current].apiBaseUrl;
}
