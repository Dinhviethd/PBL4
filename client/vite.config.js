import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
 const __dirname = path.resolve(path.dirname(''))
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})