# Asset Manager (Rust + Vue + Docker)

这是一个基于 **Rust (Axum)** 和 **Vue 3** 的轻量级资产管理应用。项目采用前后端分离架构，使用 Docker Compose 进行一键部署。

## 技术栈

- **后端**: Rust, Axum, SQLite
- **前端**: React, TypeScript
- **部署**: Docker, Docker Compose, Nginx

## 项目目录结构

为了配合 Docker Compose 部署，建议您的项目目录结构如下：

```text
project-root/
├── backend/                # Rust 后端代码
│   ├── src/
│   │   └── main.rs         # 您提供的 Rust 代码
│   ├── Cargo.toml
│   └── Dockerfile          # 后端构建文件
├── frontend/               # Vue 前端代码
│   ├── dist/               # 前端打包后的静态文件 (npm run build 生成)
│   ├── src/
│   └── ...
├── docker-compose.yml      # 容器编排文件
├── nginx.conf              # Nginx 配置文件
└── README.md
```


---

## 部署步骤

### 使用 Docker Compose 启动

在项目根目录下运行：

```bash
docker-compose up -d --build
```

- `-d`: 后台运行
- `--build`: 强制重新构建镜像（确保 Rust 代码更新生效）

### 访问应用

打开浏览器访问：
**http://localhost:8080**

---

## 数据持久化警告

根据目前的配置，**数据库文件 `assets.db` 存储在 `backend` 容器内部**。

- **重启容器** (`docker-compose restart`)：数据**保留**。
- **停止容器** (`docker-compose stop`)：数据**保留**。
- **删除容器** (`docker-compose down`)：数据**丢失**。

如果您后续需要持久化数据，请修改 `docker-compose.yml`，取消注释并添加 volume 映射：

```yaml
  backend:
    # ...
    volumes:
      - ./data:/app # 将宿主机的 data 目录映射到容器内的 /app
```

---

## API 接口说明

| 方法 | 路径 | 描述 |
| :--- | :--- | :--- |
| `GET` | `/api/devices` | 获取所有资产列表 |
| `POST` | `/api/devices` | 添加新资产 |
| `DELETE` | `/api/devices/:id` | 删除指定资产 |
