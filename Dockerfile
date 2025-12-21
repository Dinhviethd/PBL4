# --- Giai đoạn 1: Build Frontend (Client) ---
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy file package của client để cài library trước (tận dụng cache)
COPY client/package*.json ./
RUN npm install

# Copy toàn bộ code client và build
COPY client/ .
RUN npm run build
# Kết quả build sẽ nằm tại: /app/client/dist


# --- Giai đoạn 2: Build Backend (Server) ---
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Copy file package của server
COPY server/package*.json ./
RUN npm install

# Copy toàn bộ code server
COPY server/ .
RUN npm run build
# Kết quả build sẽ nằm tại: /app/server/dist


# --- Giai đoạn 3: Đóng gói Final Image ---
FROM node:20-alpine
WORKDIR /app

# 1. Copy code Server đã build và các thư viện cần thiết
COPY --from=server-builder /app/server/package*.json ./
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/tsconfig.json ./

RUN sed -i 's|"baseUrl": "./src"|"baseUrl": "./dist"|g' tsconfig.json
# 2. Copy code Frontend đã build vào thư mục 'public'
# Lưu ý: Lúc này cấu trúc trong container sẽ là /app/dist (code server) và /app/public (code frontend)
COPY --from=client-builder /app/client/dist ./public

# Thiết lập biến môi trường
ENV PORT=8080

EXPOSE 8080

# Chạy server
CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]