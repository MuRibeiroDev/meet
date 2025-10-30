# Dockerfile para Backend Node.js
FROM node:18-alpine

# Instalar dependências do sistema para melhor performance
RUN apk add --no-cache tini

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências com cache otimizado
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Usar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expor porta
EXPOSE 5000

# Usar tini para gerenciamento de processos
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
