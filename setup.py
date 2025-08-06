#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
生命力教育咨询 - 后台系统快速安装脚本
"""

import os
import sys
import subprocess

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 6):
        print("❌ 错误: 需要Python 3.6或更高版本")
        return False
    print(f"✅ Python版本: {sys.version}")
    return True

def install_requirements():
    """安装Python依赖"""
    try:
        print("📦 安装Python依赖...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ 依赖安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖安装失败: {e}")
        return False

def create_config_template():
    """创建配置文件模板"""
    config_content = '''# 邮箱配置
# 请修改以下信息为您的邮箱配置

# 发送邮箱配置（用于发送通知邮件）
SENDER_EMAIL = "your-email@163.com"  # 替换为您的163邮箱
SENDER_PASSWORD = "your-password"     # 替换为您的邮箱密码或授权码

# 接收邮箱（咨询表单通知将发送到此邮箱）
RECIPIENT_EMAIL = "kaiwen0151@163.com"

# SMTP服务器配置
SMTP_SERVER = "smtp.163.com"
SMTP_PORT = 587

# 数据库配置
DATABASE_FILE = "consultations.db"

# 服务器配置
HOST = "0.0.0.0"
PORT = 5000
DEBUG = True
'''
    
    if not os.path.exists('config.py'):
        with open('config.py', 'w', encoding='utf-8') as f:
            f.write(config_content)
        print("✅ 配置文件模板已创建: config.py")
        print("⚠️  请编辑 config.py 文件，配置您的邮箱信息")
    else:
        print("✅ 配置文件已存在: config.py")

def main():
    print("=" * 50)
    print("生命力教育咨询 - 后台系统安装")
    print("=" * 50)
    
    # 检查Python版本
    if not check_python_version():
        return
    
    # 安装依赖
    if not install_requirements():
        return
    
    # 创建配置文件
    create_config_template()
    
    print("\n🎉 安装完成！")
    print("\n📋 下一步操作:")
    print("1. 编辑 config.py 文件，配置您的邮箱信息")
    print("2. 运行 'python start_backend.py' 启动后台系统")
    print("3. 运行 'python3 -m http.server 3000' 启动前端网站")
    print("\n📧 邮箱配置说明:")
    print("- 对于163邮箱，需要使用'授权码'而不是登录密码")
    print("- 获取授权码: 登录163邮箱 → 设置 → POP3/SMTP/IMAP → 开启SMTP服务")
    print("\n🌐 访问地址:")
    print("- 前端网站: http://localhost:3000")
    print("- 后台管理: http://localhost:5000/admin")
    print("=" * 50)

if __name__ == '__main__':
    main() 
 