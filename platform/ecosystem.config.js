module.exports = {
  apps: [{
    name: 'ai-tool-portal',
    // 1. 修正启动路径，指向 standalone 的入口
    script: './.next/standalone/server.js', 
    args: '',
    cwd: '/home/ecs-user/ai-tool-portal',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
      // 配置外部可访问的 URL，解决重定向端口号问题
      NEXT_PUBLIC_APP_URL: 'https://ichenghub.cn',
      NEXTAUTH_URL: 'https://ichenghub.cn',
      // DATABASE_URL、OAuth 凭证和后台密码等敏感配置统一由服务器 .env 提供，禁止写入版本库
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    restart_delay: 5000
  }]
};
