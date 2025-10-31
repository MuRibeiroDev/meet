# Script para limpar e reiniciar o ambiente Docker
# Sistema de Agendamento de Reuniões

Write-Host "🔄 Parando containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "`n🗑️  Removendo volumes..." -ForegroundColor Yellow
docker-compose down -v

Write-Host "`n🧹 Limpando cache do Docker..." -ForegroundColor Yellow
docker system prune -f

Write-Host "`n🏗️  Reconstruindo imagens..." -ForegroundColor Yellow
docker-compose build --no-cache

Write-Host "`n🚀 Iniciando containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "`n📊 Verificando status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose ps

Write-Host "`n📝 Logs do backend (Ctrl+C para sair):" -ForegroundColor Cyan
docker-compose logs -f backend
