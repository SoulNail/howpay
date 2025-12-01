use axum::{
    extract::{Path, State},
    http::Method,
    routing::{delete, get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, FromRow, SqlitePool};
use std::net::SocketAddr;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
};
use uuid::Uuid;

// --- 数据模型 ---
// FromRow: 允许 sqlx 把数据库查询结果直接转换成结构体
// Serialize/Deserialize: 允许和 JSON 互相转换
#[derive(Debug, Serialize, Deserialize, FromRow)]
struct Device {
    id: String,
    name: String,
    price: f64,
    // 数据库里叫 purchase_date (下划线)，前端 JSON 叫 purchaseDate (驼峰)
    // 我们使用 rename 属性来自动映射
    #[serde(rename = "purchaseDate")]
    #[sqlx(rename = "purchase_date")]
    purchase_date: String,
    #[serde(rename = "iconType")]
    #[sqlx(rename = "icon_type")]
    icon_type: String,
}

// 用于接收前端创建请求的结构体（不需要 ID，ID 由后端生成）
#[derive(Debug, Deserialize)]
struct CreateDevicePayload {
    name: String,
    price: f64,
    #[serde(rename = "purchaseDate")]
    purchase_date: String,
    #[serde(rename = "iconType")]
    icon_type: String,
}

// --- 数据库初始化 ---
async fn init_db() -> SqlitePool {
    // 连接字符串：会在当前目录下寻找或创建 assets.db
    let db_url = "sqlite://assets.db?mode=rwc";
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_url)
        .await
        .expect("无法连接数据库");

    // 创建表结构
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            purchase_date TEXT NOT NULL,
            icon_type TEXT NOT NULL
        );
        "#,
    )
    .execute(&pool)
    .await
    .expect("建表失败");

    pool
}

// --- API 处理函数 ---

// GET /api/devices
async fn get_devices(State(pool): State<SqlitePool>) -> Json<Vec<Device>> {
    let devices = sqlx::query_as::<_, Device>("SELECT * FROM devices ORDER BY purchase_date DESC")
        .fetch_all(&pool)
        .await
        .unwrap_or_else(|_| vec![]); // 如果出错返回空数组

    Json(devices)
}

// POST /api/devices
async fn add_device(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateDevicePayload>,
) -> Json<Device> {
    let new_id = Uuid::new_v4().to_string();
    
    // 插入数据库
    sqlx::query(
        "INSERT INTO devices (id, name, price, purchase_date, icon_type) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&new_id)
    .bind(&payload.name)
    .bind(payload.price)
    .bind(&payload.purchase_date)
    .bind(&payload.icon_type)
    .execute(&pool)
    .await
    .expect("插入数据失败");

    // 返回完整的对象给前端
    let new_device = Device {
        id: new_id,
        name: payload.name,
        price: payload.price,
        purchase_date: payload.purchase_date,
        icon_type: payload.icon_type,
    };

    Json(new_device)
}

// DELETE /api/devices/:id
async fn delete_device(
    State(pool): State<SqlitePool>,
    Path(id): Path<String>,
) -> Json<serde_json::Value> {
    sqlx::query("DELETE FROM devices WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .expect("删除数据失败");

    Json(serde_json::json!({ "status": "ok" }))
}

#[tokio::main]
async fn main() {
    // 1. 初始化数据库
    let pool = init_db().await;
    println!("Database connected.");

    // 2. 配置 CORS (允许前端跨域访问)
    let cors = CorsLayer::new()
        .allow_origin(Any) // 生产环境建议指定具体域名，开发环境用 Any
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        .allow_headers(Any);

    // 3. 构建路由
    let app = Router::new()
        // API 路由
        .route("/api/devices", get(get_devices).post(add_device))
        .route("/api/devices/:id", delete(delete_device))
        // 静态文件路由 (前端打包后的文件)
        // .fallback_service(ServeDir::new("../dist")) 
        // 注入数据库连接池
        .with_state(pool)
        // 注入 CORS 中间件
        .layer(cors);

    // 4. 启动服务器
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}