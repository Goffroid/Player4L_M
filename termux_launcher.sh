#!/bin/bash

# Скрипт для автоматического запуска в Termux

REPO_URL="https://github.com/ваш-username/ваш-репозиторий.git"
PROJECT_DIR="music_player"

echo "Установка и запуск музыкального плеера в Termux..."

# Обновляем пакеты и устанавливаем зависимости
pkg update -y && pkg upgrade -y
pkg install -y python git tkinter

# Клонируем репозиторий
if [ ! -d "$PROJECT_DIR" ]; then
    git clone "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Устанавливаем зависимости Python
pip install pygame

# Создаем папку для музыки, если её нет
mkdir -p music

echo "Запуск приложения..."
python main.py

echo "Если приложение не запустилось, попробуйте:"
echo "1. Установить X-сервер: pkg install x11-repo tigervnc"
echo "2. Запустить VNC сервер: vncserver"
echo "3. Подключиться клиентом VNC к localhost:5901"
echo "4. Повторить запуск: python main.py"