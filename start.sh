#!/bin/bash
# ============================================
# 黑色小猫咪的GitHub小窝 - 一键启动脚本
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"
PID_DIR="$PROJECT_DIR/.pids"

# 默认端口
BACKEND_PORT=8000
FRONTEND_PORT=5500

# ============================================
# 工具函数
# ============================================

print_banner() {
    echo -e "${CYAN}"
    echo "  ╔══════════════════════════════════════╗"
    echo "  ║   黑色小猫咪的GitHub小窝 - 启动脚本   ║"
    echo "  ╚══════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "未找到 $1，请先安装"
        exit 1
    fi
}

# 等待HTTP服务就绪
wait_for_http() {
    local port=$1
    local max_wait=${2:-30}
    local waited=0
    while ! curl -sf "http://localhost:$port/docs" > /dev/null 2>&1; do
        sleep 1
        waited=$((waited + 1))
        if [ $waited -ge $max_wait ]; then
            return 1
        fi
    done
    return 0
}

# ============================================
# 功能函数
# ============================================

setup_dirs() {
    mkdir -p "$PID_DIR" "$BACKEND_DIR/data/uploads"
}

setup_venv() {
    if [ ! -d "$VENV_DIR" ]; then
        log_info "创建Python虚拟环境..."
        python3 -m venv "$VENV_DIR" || { log_error "创建虚拟环境失败"; exit 1; }
    fi
}

install_deps() {
    log_info "检查并安装后端依赖..."
    "$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt" -q || { log_error "依赖安装失败"; exit 1; }
    log_info "依赖安装完成"
}

start_backend() {
    # 先清理残留进程
    local old_pids=$(lsof -t -i ":$BACKEND_PORT" 2>/dev/null || true)
    if [ -n "$old_pids" ]; then
        log_warn "端口 $BACKEND_PORT 被占用，尝试清理..."
        echo "$old_pids" | xargs kill -9 2>/dev/null
        sleep 1
    fi

    log_info "启动后端服务 (端口: $BACKEND_PORT)..."
    cd "$BACKEND_DIR"
    "$VENV_DIR/bin/python" main.py > "$BACKEND_DIR/data/backend.log" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_DIR/backend.pid"
    cd "$PROJECT_DIR"

    if wait_for_http "$BACKEND_PORT" 30; then
        log_info "后端服务已启动 (PID: $pid)"
        echo -e "       ${BLUE}API文档:${NC} http://localhost:$BACKEND_PORT/docs"
    else
        log_error "后端启动失败，查看日志: $BACKEND_DIR/data/backend.log"
        cat "$BACKEND_DIR/data/backend.log" | tail -10
        exit 1
    fi
}

start_frontend() {
    # 先清理残留进程
    local old_pids=$(lsof -t -i ":$FRONTEND_PORT" 2>/dev/null || true)
    if [ -n "$old_pids" ]; then
        log_warn "端口 $FRONTEND_PORT 被占用，尝试清理..."
        echo "$old_pids" | xargs kill -9 2>/dev/null
        sleep 1
    fi

    log_info "启动前端服务 (端口: $FRONTEND_PORT)..."
    cd "$FRONTEND_DIR"
    python3 -m http.server "$FRONTEND_PORT" --bind 0.0.0.0 > "$PID_DIR/frontend.log" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_DIR/frontend.pid"
    cd "$PROJECT_DIR"

    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
        log_info "前端服务已启动 (PID: $pid)"
        echo -e "       ${BLUE}访问地址:${NC} http://localhost:$FRONTEND_PORT"
    else
        log_error "前端启动失败"
        cat "$PID_DIR/frontend.log" | tail -10
        exit 1
    fi
}

stop_services() {
    log_info "停止所有服务..."

    for svc in backend frontend; do
        if [ -f "$PID_DIR/$svc.pid" ]; then
            local pid=$(cat "$PID_DIR/$svc.pid")
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null
                log_info "$svc 服务已停止 (PID: $pid)"
            else
                log_warn "$svc 进程不存在 (PID: $pid)"
            fi
            rm -f "$PID_DIR/$svc.pid"
        fi
    done

    # 兜底：按端口杀进程
    for port in $BACKEND_PORT $FRONTEND_PORT; do
        local pids=$(lsof -t -i ":$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs kill 2>/dev/null
            log_info "已清理端口 $port"
        fi
    done

    log_info "所有服务已停止"
}

show_status() {
    echo -e "${CYAN}服务状态:${NC}"
    for svc in backend frontend; do
        local port_var="${svc}_PORT"
        local port=${!port_var}
        if [ -f "$PID_DIR/$svc.pid" ]; then
            local pid=$(cat "$PID_DIR/$svc.pid")
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "  $svc: ${GREEN}运行中${NC} (PID: $pid, 端口: $port)"
            else
                echo -e "  $svc: ${RED}已停止${NC} (PID文件过期)"
            fi
        else
            echo -e "  $svc: ${YELLOW}未启动${NC}"
        fi
    done
}

show_logs() {
    local service=$1
    case $service in
        backend|b)
            local logfile="$BACKEND_DIR/data/backend.log"
            [ -f "$logfile" ] && tail -f "$logfile" || log_error "后端日志不存在"
            ;;
        frontend|f)
            local logfile="$PID_DIR/frontend.log"
            [ -f "$logfile" ] && tail -f "$logfile" || log_error "前端日志不存在"
            ;;
        *)
            log_error "用法: $0 logs [backend|frontend]"
            ;;
    esac
}

show_help() {
    print_banner
    cat <<EOF
用法: $0 <命令> [选项]

命令:
  start       启动所有服务（前端+后端）
  stop        停止所有服务
  restart     重启所有服务
  backend     仅启动后端
  frontend    仅启动前端
  status      查看服务状态
  logs <服务>  查看日志 (backend/frontend)
  install     安装依赖
  help        显示此帮助

选项:
  --backend-port <端口>    指定后端端口 (默认: 8000)
  --frontend-port <端口>   指定前端端口 (默认: 5500)

示例:
  $0 start                  # 启动所有服务
  $0 start --backend-port 9000
  $0 logs backend           # 查看后端日志
  $0 restart                # 重启服务
EOF
}

# ============================================
# 主流程
# ============================================

COMMAND=""
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-port)  BACKEND_PORT="$2"; shift 2 ;;
        --frontend-port) FRONTEND_PORT="$2"; shift 2 ;;
        start|stop|restart|backend|frontend|status|logs|install|help) COMMAND="$1"; shift ;;
        *) EXTRA_ARGS+=("$1"); shift ;;
    esac
done

if [ -z "$COMMAND" ]; then
    show_help
    exit 0
fi

case $COMMAND in
    start)
        print_banner
        check_command python3
        setup_dirs
        setup_venv
        install_deps
        start_backend
        start_frontend
        echo ""
        log_info "所有服务已启动！"
        echo -e "  ${GREEN}前端:${NC} http://localhost:$FRONTEND_PORT"
        echo -e "  ${GREEN}后端:${NC} http://localhost:$BACKEND_PORT"
        echo -e "  ${GREEN}API文档:${NC} http://localhost:$BACKEND_PORT/docs"
        echo ""
        echo -e "  使用 ${YELLOW}$0 stop${NC} 停止服务"
        echo -e "  使用 ${YELLOW}$0 logs backend${NC} 查看后端日志"
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        print_banner
        setup_dirs
        setup_venv
        start_backend
        start_frontend
        log_info "服务已重启"
        ;;
    backend)
        print_banner
        check_command python3
        setup_dirs
        setup_venv
        install_deps
        start_backend
        ;;
    frontend)
        print_banner
        check_command python3
        setup_dirs
        start_frontend
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${EXTRA_ARGS[0]}"
        ;;
    install)
        setup_dirs
        setup_venv
        install_deps
        log_info "依赖安装完成"
        ;;
    help)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
