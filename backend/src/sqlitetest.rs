use axum::{routing::get, Router};
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;

#[tokio::main]
async fn main() {
    // 1. 创建数据库连接池
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect("sqlite://data.db")
        .await
        .expect("Failed to connect to SQLite");

    // 2. 初始化数据库（建表）
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            purchase_date TEXT NOT NULL
        )
        "#,
    )
    .execute(&pool)
    .await
    .expect("Failed to create table");

    // 3. Axum App
    let app = Router::new()
        .route("/ping", get(ping))
        .with_state(pool);

    // 4. 启动服务
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    println!("Listening on http://127.0.0.1:3000");
    axum::serve(listener, app).await.unwrap();
}

async fn ping(
    axum::extract::State(pool): axum::extract::State<SqlitePool>,
) -> String {
    // 测试数据库连通性
    let row: (i64,) = sqlx::query_as("SELECT 1")
        .fetch_one(&pool)
        .await
        .unwrap();

    format!("DB OK: {}", row.0)
}