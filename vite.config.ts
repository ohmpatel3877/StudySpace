import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Don't wipe the terminal — it erases cargo's build output and errors
  // during `tauri dev`.
  clearScreen: false,

  server: {
    // Must match `build.devUrl` in src-tauri/tauri.conf.json. strictPort so a
    // port collision fails loudly instead of Tauri silently loading a blank
    // window from the wrong origin.
    port: 5173,
    strictPort: true,

    watch: {
      // REQUIRED for `tauri dev`. Without this, Vite's watcher walks into
      // src-tauri/target/ and tries to watch the output binary. The moment
      // cargo links studyspace.exe the watcher hits a locked file and throws
      // EBUSY, which kills the dev server and takes `tauri dev` with it:
      //
      //   Error: EBUSY: resource busy or locked, watch
      //   '...\src-tauri\target\debug\deps\studyspace.exe'
      //
      // The stock Tauri scaffold ships this; this config was the bare Vite
      // template and never got it, so the desktop app could not start. See
      // AUDIT.md Finding 8.
      ignored: ['**/src-tauri/**'],
    },
  },
})
