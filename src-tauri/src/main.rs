#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::load_settings,
            commands::save_settings,
            commands::get_vault_files,
            commands::read_vault_file,
            commands::write_vault_file,
            commands::fetch_and_parse_d2l,
            commands::import_external_location,
            commands::remove_external_location,
            commands::convert_office_doc,
            commands::open_in_default_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
