# --- 阶段 1: 构建 React 应用 ---
FROM node:18-alpine as builder

WORKDIR /app

# 拷贝依赖文件并安装
COPY package.json package-lock.json ./
RUN npm install

# 拷贝源代码并构建
COPY . .
# 假设你的构建命令是 npm run build，Vite 默认输出到 dist 目录
RUN npm run build

# --- 阶段 2: Nginx 托管 ---
FROM nginx:alpine

# 拷贝构建好的静态文件到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 拷贝我们自定义的 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]