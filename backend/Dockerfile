# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY src ./src

# Build da aplicação
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm install --omit=dev && npm cache clean --force

# Copiar código compilado do builder
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 5000

# Comando para iniciar aplicação
CMD ["node", "dist/main.js"]
