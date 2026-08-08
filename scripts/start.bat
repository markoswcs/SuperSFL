@echo off
echo Iniciando o Servidor Web e o Proxy do Sunflower Super App...

:: Inicia o proxy local em uma nova janela
start "Sunflower Proxy (CORS)" cmd /k "node proxy.js"

:: Inicia o servidor web local em uma nova janela
start "Sunflower Web App" cmd /k "npx serve"

echo.
echo Tudo iniciado! 
echo O aplicativo deve abrir no seu navegador. 
echo Nao feche as duas telas pretas enquanto estiver usando o app!
echo.
pause
