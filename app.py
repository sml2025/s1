from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import os
from datetime import datetime
import sqlite3

# 导入配置
try:
    from config import *
except ImportError:
    print("警告: 找不到config.py文件，使用默认配置")
    SENDER_EMAIL = "your-email@163.com"
    SENDER_PASSWORD = "your-password"
    RECIPIENT_EMAIL = "kaiwen0151@163.com"
    SMTP_SERVER = "smtp.163.com"
    SMTP_PORT = 587
    DATABASE_FILE = "consultations.db"
    HOST = "0.0.0.0"
    PORT = 5000
    DEBUG = True

app = Flask(__name__)
CORS(app)

# 数据库初始化
def init_db():
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS consultations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            contact TEXT NOT NULL,
            consultation_type TEXT NOT NULL,
            age_group TEXT NOT NULL,
            description TEXT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def send_email_notification(form_data):
    """发送邮件通知"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f"新的快速咨询表单 - {form_data['name']}"
        
        # 邮件内容
        body = f"""
        <html>
        <body>
            <h2>新的快速咨询表单</h2>
            <p><strong>提交时间：</strong>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>姓名：</strong>{form_data['name']}</p>
            <p><strong>城市：</strong>{form_data['city']}</p>
            <p><strong>联系方式：</strong>{form_data['contact']}</p>
            <p><strong>咨询类型：</strong>{form_data['consultation_type']}</p>
            <p><strong>年龄段：</strong>{form_data['age_group']}</p>
            <p><strong>具体需求：</strong></p>
            <p>{form_data['description']}</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # 发送邮件
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"邮件发送失败: {e}")
        return False

@app.route('/submit_consultation', methods=['POST'])
def submit_consultation():
    """处理表单提交"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['name', 'city', 'contact', 'consultation_type', 'age_group', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'请填写{field}字段'}), 400
        
        # 保存到数据库
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO consultations (name, city, contact, consultation_type, age_group, description)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['name'], data['city'], data['contact'], data['consultation_type'], 
              data['age_group'], data['description']))
        conn.commit()
        conn.close()
        
        # 发送邮件通知
        send_email_notification(data)
        
        return jsonify({'success': True, 'message': '咨询表单提交成功！我们会尽快联系您。'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'提交失败: {str(e)}'}), 500

@app.route('/admin')
def admin_panel():
    """后台管理面板"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM consultations ORDER BY submitted_at DESC')
    consultations = cursor.fetchall()
    conn.close()
    
    # 后台管理页面HTML
    admin_html = '''
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>生命力教育咨询 - 后台管理</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 20px; border-radius: 10px; margin-bottom: 20px; }
            .header h1 { color: white; text-align: center; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 20px; border-radius: 10px; text-align: center; color: white; }
            .stat-number { font-size: 2rem; font-weight: bold; margin-bottom: 10px; }
            .consultations { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 10px; padding: 20px; }
            .consultation-item { background: rgba(255,255,255,0.05); margin: 10px 0; padding: 15px; border-radius: 8px; color: white; }
            .consultation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .consultation-name { font-weight: bold; font-size: 1.1rem; }
            .consultation-time { font-size: 0.9rem; opacity: 0.8; }
            .consultation-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
            .detail-item { background: rgba(255,255,255,0.1); padding: 8px; border-radius: 5px; }
            .detail-label { font-weight: bold; margin-bottom: 5px; }
            .refresh-btn { background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
            .refresh-btn:hover { transform: translateY(-2px); }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>生命力教育咨询 - 后台管理</h1>
            </div>
            
            <button class="refresh-btn" onclick="location.reload()">刷新数据</button>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">{{ total_count }}</div>
                    <div>总咨询数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{{ today_count }}</div>
                    <div>今日咨询</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{{ this_week_count }}</div>
                    <div>本周咨询</div>
                </div>
            </div>
            
            <div class="consultations">
                <h2 style="color: white; margin-bottom: 20px;">咨询记录</h2>
                {% for consultation in consultations %}
                <div class="consultation-item">
                    <div class="consultation-header">
                        <div class="consultation-name">{{ consultation[1] }}</div>
                        <div class="consultation-time">{{ consultation[7] }}</div>
                    </div>
                    <div class="consultation-details">
                        <div class="detail-item">
                            <div class="detail-label">城市</div>
                            <div>{{ consultation[2] }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">联系方式</div>
                            <div>{{ consultation[3] }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">咨询类型</div>
                            <div>{{ consultation[4] }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">年龄段</div>
                            <div>{{ consultation[5] }}</div>
                        </div>
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <div class="detail-label">具体需求</div>
                            <div>{{ consultation[6] }}</div>
                        </div>
                    </div>
                </div>
                {% endfor %}
            </div>
        </div>
    </body>
    </html>
    '''
    
    # 计算统计数据
    total_count = len(consultations)
    today_count = len([c for c in consultations if c[7].startswith(datetime.now().strftime('%Y-%m-%d'))])
    this_week_count = len([c for c in consultations if (datetime.now() - datetime.strptime(c[7], '%Y-%m-%d %H:%M:%S')).days <= 7])
    
    return render_template_string(admin_html, 
                                consultations=consultations,
                                total_count=total_count,
                                today_count=today_count,
                                this_week_count=this_week_count)

if __name__ == '__main__':
    init_db()
    print("后台管理系统启动中...")
    print("访问地址: http://localhost:5000/admin")
    print("请确保已配置正确的邮箱信息")
    app.run(debug=DEBUG, host=HOST, port=PORT) 
    app.run(debug=True, host='0.0.0.0', port=5000) 