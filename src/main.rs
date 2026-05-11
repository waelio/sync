use actix_web::{get, post, put, delete, web, App, HttpServer, Responder, HttpResponse};
use actix_files::Files;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::env;
use uuid::Uuid;

// The data model we will store and sync
#[derive(Debug, Serialize, Deserialize, Clone)]
struct SyncItem {
    id: String,
    title: String,
    content: String,
}

// Request payload for creating/updating
#[derive(Debug, Deserialize)]
struct SyncItemPayload {
    title: String,
    content: String,
}

// The App State wrapping an in-memory HashMap and the database path
struct AppState {
    store: Mutex<HashMap<String, SyncItem>>,
    db_path: String,
}

// Helper function to save to disk
fn save_to_disk(store: &HashMap<String, SyncItem>, path: &str) {
    if let Ok(data) = serde_json::to_string_pretty(store) {
        let _ = fs::write(path, data);
    }
}

// Helper function to load from disk
fn load_from_disk(path: &str) -> HashMap<String, SyncItem> {
    if Path::new(path).exists() {
        if let Ok(data) = fs::read_to_string(path) {
            if let Ok(store) = serde_json::from_str(&data) {
                return store;
            }
        }
    }
    HashMap::new()
}

// CREATE
#[post("/items")]
async fn create_item(
    data: web::Data<AppState>,
    payload: web::Json<SyncItemPayload>,
) -> impl Responder {
    let mut store = data.store.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    
    let item = SyncItem {
        id: id.clone(),
        title: payload.title.clone(),
        content: payload.content.clone(),
    };
    
    store.insert(id.clone(), item.clone());
    save_to_disk(&store, &data.db_path); // Persist change
    
    HttpResponse::Created().json(item)
}

// READ ALL
#[get("/items")]
async fn get_items(data: web::Data<AppState>) -> impl Responder {
    let store = data.store.lock().unwrap();
    let items: Vec<SyncItem> = store.values().cloned().collect();
    HttpResponse::Ok().json(items)
}

// READ ONE
#[get("/items/{id}")]
async fn get_item(data: web::Data<AppState>, path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    let store = data.store.lock().unwrap();
    
    match store.get(&id) {
        Some(item) => HttpResponse::Ok().json(item),
        None => HttpResponse::NotFound().body("Item not found"),
    }
}

// UPDATE
#[put("/items/{id}")]
async fn update_item(
    data: web::Data<AppState>,
    path: web::Path<String>,
    payload: web::Json<SyncItemPayload>,
) -> impl Responder {
    let id = path.into_inner();
    let mut store = data.store.lock().unwrap();
    
    let updated_item = if let Some(item) = store.get_mut(&id) {
        item.title = payload.title.clone();
        item.content = payload.content.clone();
        Some(item.clone())
    } else {
        None
    };

    if let Some(item) = updated_item {
        save_to_disk(&store, &data.db_path); // Persist change
        HttpResponse::Ok().json(item)
    } else {
        HttpResponse::NotFound().body("Item not found")
    }
}

// DELETE
#[delete("/items/{id}")]
async fn delete_item(data: web::Data<AppState>, path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    let mut store = data.store.lock().unwrap();
    
    if store.remove(&id).is_some() {
        save_to_disk(&store, &data.db_path); // Persist change
        HttpResponse::Ok().body("Item deleted successfully")
    } else {
        HttpResponse::NotFound().body("Item not found")
    }
}

// Health check endpoint
#[get("/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok().body("Waelio Sync Backend is Running!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Determine database path from environment variable, fallback to local file
    let db_path = env::var("DB_FILE_PATH").unwrap_or_else(|_| "sync_data.json".to_string());
    
    // Determine host and port from environment (essential for Docker/Cloud deployments)
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port_str = env::var("PORT").unwrap_or_else(|_| "3070".to_string());
    let port: u16 = port_str.parse().unwrap_or(3070);

    // Load existing data from disk on startup
    let initial_store = load_from_disk(&db_path);
    let state = web::Data::new(AppState {
        store: Mutex::new(initial_store),
        db_path: db_path.clone(),
    });

    println!("Starting server on http://{}:{}", host, port);
    println!("Data is persisting to {}", db_path);

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            // Mount the API under /api
            .service(
                web::scope("/api")
                    .service(health)
                    .service(create_item)
                    .service(get_items)
                    .service(get_item)
                    .service(update_item)
                    .service(delete_item)
            )
            // Serve static UI files from the "static" directory at the root "/"
            .service(Files::new("/", "./static").index_file("index.html"))
    })
    .bind((host.as_str(), port))?
    .run()
    .await
}