# 前端部署配置说明

## 快速部署

### 开发环境
前端使用 Live Server 或任意静态文件服务器即可运行：

```bash
cd frontend
# 方式1：Python
python3 -m http.server 5500 --bind 0.0.0.0

# 方式2：Node.js (npx)
npx serve -l 5500

# 方式3：VS Code Live Server 插件
```

### API地址配置
编辑 `js/api.js` 中的 `APP_CONFIG.apiBaseUrl`：

```javascript
const APP_CONFIG = {
    apiBaseUrl: 'http://你的后端地址:8000/api',
    // ...
};
```

或复制 `config.example.js` 为 `config.local.js` 修改后引入。

### 生产部署
1. 修改 `js/api.js` 中的 API 地址为生产环境地址
2. 使用 Nginx 反向代理：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # 前端
       location / {
           root /path/to/dingymxy/frontend;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # 后端API代理
       location /api {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 环境要求
- 现代浏览器（Chrome / Firefox / Edge / Safari）
- 后端 API 服务需独立启动
