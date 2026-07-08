use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// ── Data types ──────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub theme: String,
    pub active_features: Vec<String>,
    pub d2l_feed_url: String,
    pub external_locations: Vec<ExternalLocation>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ExternalLocation {
    pub location_type: String,
    pub path_or_url: String,
}

#[derive(Serialize, Deserialize)]
pub struct VaultFile {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub ext: String,
}

#[derive(Serialize, Deserialize)]
pub struct D2LEvent {
    pub id: String,
    pub title: String,
    pub description: String,
    pub due_date: String,
}

#[derive(Serialize, Deserialize)]
pub struct OfficeConversionResult {
    pub pdf_path: String,
}

// ── Helpers ──────────────────────────────────────────────────────

fn vault_root() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_default();
    home.join("OneDrive/Obsidian/Obsidian-Education")
}

fn settings_path() -> PathBuf {
    let config = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    fs::create_dir_all(config.join("studyspace")).ok();
    config.join("studyspace/settings.json")
}

fn app_settings() -> AppSettings {
    let path = settings_path();
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|d| serde_json::from_str(&d).ok())
            .unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "Dark Mode".to_string(),
            active_features: vec!["d2l_sync".to_string(), "cad_viewer".to_string()],
            d2l_feed_url: "https://d2l.myuniversity.edu/feed.ics".to_string(),
            external_locations: vec![],
        }
    }
}

fn walk_dir(dir: &PathBuf, base: &PathBuf) -> Vec<VaultFile> {
    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
            let rel = path.strip_prefix(base).unwrap_or(&path).to_string_lossy().to_string();
            let name = entry.file_name().to_string_lossy().to_string();
            let ext = path.extension().map(|e| e.to_string_lossy().to_string()).unwrap_or_default();
            if !name.starts_with('.') {
                files.push(VaultFile { name, path: rel, is_dir, ext });
                if is_dir {
                    files.extend(walk_dir(&path, base));
                }
            }
        }
    }
    files
}

// ── Commands ─────────────────────────────────────────────────────

#[tauri::command]
pub fn load_settings() -> AppSettings {
    app_settings()
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    let data = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(settings_path(), data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_vault_files() -> Vec<VaultFile> {
    let root = vault_root();
    if !root.exists() {
        return vec![];
    }
    walk_dir(&root, &root)
}

#[tauri::command]
pub fn read_vault_file(path: String) -> Result<String, String> {
    let full = vault_root().join(&path);
    fs::read_to_string(&full).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_vault_file(path: String, content: String) -> Result<(), String> {
    let full = vault_root().join(&path);
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&full, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fetch_and_parse_d2l(url: String) -> Result<Vec<D2LEvent>, String> {
    let resp = reqwest::blocking::get(&url).map_err(|e| format!("HTTP error: {}", e))?;
    let body = resp.text().map_err(|e| format!("Read error: {}", e))?;

    let reader = ical::IcalParser::new(body.as_bytes());
    let mut events = Vec::new();

    for cal in reader.flatten() {
        for event in cal.events {
            let mut id = String::new();
            let mut title = String::new();
            let mut description = String::new();
            let mut due_date = String::new();
            for prop in event.properties {
                if let Some(ref val) = prop.value {
                    match prop.name.as_str() {
                        "UID" => id = val.clone(),
                        "SUMMARY" => title = val.clone(),
                        "DESCRIPTION" => description = val.clone(),
                        "DTSTART" | "DUE" => due_date = val.clone(),
                        _ => {}
                    }
                }
            }
            if !id.is_empty() {
                events.push(D2LEvent { id, title, description, due_date });
            }
        }
    }
    Ok(events)
}

#[tauri::command]
pub fn import_external_location(location_type: String, path_or_url: String) -> Result<(), String> {
    let mut s = app_settings();
    s.external_locations.push(ExternalLocation { location_type, path_or_url });
    save_settings(s)
}

#[tauri::command]
pub fn remove_external_location(path_or_url: String) -> Result<(), String> {
    let mut s = app_settings();
    s.external_locations.retain(|l| l.path_or_url != path_or_url);
    save_settings(s)
}

#[tauri::command]
pub fn convert_office_doc(file_path: String) -> Result<OfficeConversionResult, String> {
    let full = vault_root().join(&file_path);
    let pdf_name = format!("{}.pdf", full.file_stem().unwrap_or_default().to_string_lossy());
    let out_dir = vault_root().join("temp");
    fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;

    let status = std::process::Command::new("soffice")
        .args(["--headless", "--convert-to", "pdf", "--outdir"])
        .arg(&out_dir)
        .arg(&full)
        .status()
        .map_err(|e| format!("LibreOffice not found: {}", e))?;

    if status.success() {
        Ok(OfficeConversionResult { pdf_path: format!("/temp/{}", pdf_name) })
    } else {
        Err("Conversion failed: File corrupted".to_string())
    }
}

#[tauri::command]
pub fn open_in_default_app(file_path: String) -> Result<(), String> {
    let full = vault_root().join(&file_path);
    open::that(&full).map_err(|e| e.to_string())
}
