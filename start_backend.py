#!/usr/bin/env python3
"""
后台管理系统启动脚本
"""

import os
import sys
import subprocess

def install_requirements():
    """安装依赖包"""
    print("正在安装依赖包...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements_backend.txt"])
        print("✅ 依赖包安装成功")
    except subprocess.CalledProcessError:
        print("❌ 依赖包安装失败，请手动安装：")
        print("pip install -r requirements_backend.txt")
        return False
    return True

def start_server():
    """启动服务器"""
    print("正在启动后台管理系统...")
    try:
        subprocess.run([sys.executable, "server.py"])
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"启动失败: {e}")

def main():
    print("=" * 50)
    print("生命力教育咨询 - 后台管理系统")
    print("=" * 50)
    
    # 检查依赖
    if not install_requirements():
        return
    
    print("\n启动信息:")
    print("🌐 后台管理地址: http://localhost:5002/admin")
    print("👤 用户名: kaiwen")
    print("🔑 密码: 11112222")
    print("📧 邮件接收: kaiwen0151@163.com")
    print("\n按 Ctrl+C 停止服务器")
    print("=" * 50)
    
    # 启动服务器
    start_server()

if __name__ == "__main__":
    main()
 