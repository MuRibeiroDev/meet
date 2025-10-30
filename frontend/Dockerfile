# Dockerfile para Frontend React
FROM node:18-alpine as build

# Definir diretório de trabalho
WORKDIR /app

# Argumentos de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências com cache otimizado
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação com otimizações
RUN npm run build

# Estágio de produção com nginx
FROM nginx:alpine

# Instalar tini para gerenciamento de processos
RUN apk add --no-cache tini

# Copiar build para nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Usar usuário não-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Expor porta
EXPOSE 80

# Usar tini
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
