from flask import Flask, request, jsonify, render_template_string, Response, send_from_directory
from flask_cors import CORS
import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import pytz

# 设置北京时间时区
beijing_tz = pytz.timezone('Asia/Shanghai')
import os

app = Flask(__name__, static_folder='.', static_url_path='/static')
CORS(app)

# 静态文件路由
@app.route('/<path:filename>')
def serve_static(filename):
    # 特别处理视频文件
    if filename.endswith(('.mov', '.mp4', '.gif')):
        response = send_from_directory('.', filename)
        response.headers['Content-Type'] = 'video/quicktime' if filename.endswith('.mov') else 'video/mp4' if filename.endswith('.mp4') else 'image/gif'
        return response
    return send_from_directory('.', filename)

# 数据库配置
DATABASE = 'consultations.db'

def init_db():
    """初始化数据库"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # 检查表是否存在
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='consultations'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        # 创建新表
        cursor.execute('''
            CREATE TABLE consultations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                contact TEXT NOT NULL,
                email TEXT,
                consultation_type TEXT NOT NULL,
                message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT '新提交',
                device_model TEXT,
                ip_address TEXT,
                location TEXT,
                browser TEXT,
                fill_duration INTEGER
            )
        ''')
    else:
        # 检查是否需要更新表结构
        cursor.execute("PRAGMA table_info(consultations)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # 重命名phone列为contact
        if 'phone' in columns and 'contact' not in columns:
            cursor.execute('ALTER TABLE consultations RENAME COLUMN phone TO contact')
            columns.remove('phone')
            columns.append('contact')

        # 添加缺少的列
        required_columns = [
            ('device_model', 'TEXT'),
            ('ip_address', 'TEXT'),
            ('location', 'TEXT'),
            ('browser', 'TEXT'),
            ('fill_duration', 'INTEGER')
        ]
        
        for column_name, column_type in required_columns:
            if column_name not in columns:
                cursor.execute(f'ALTER TABLE consultations ADD COLUMN {column_name} {column_type}')
    
    conn.commit()
    conn.close()

def send_email(consultation_data):
    """发送邮件到指定邮箱"""
    try:
        # 邮件配置
        sender_email = "kaiwen0151@163.com"  # 163邮箱
        sender_password = "DTWUdNmQnLvNPYJC"   # 163邮箱授权码
        receiver_email = "kaiwen0151@163.com"
        
        # 创建邮件内容
        subject = f"新的咨询表单 - {consultation_data['name']}"
        
        body = f"""
        新的咨询表单提交：
        
        姓名: {consultation_data['name']}
        联系方式: {consultation_data['text']}
        邮箱: {consultation_data.get('email', '未提供')}
        咨询类型: {consultation_data['consultation_type']}
        咨询内容: {consultation_data.get('description', '无')}
        提交时间: {datetime.now(beijing_tz).strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        # 创建邮件对象
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # 发送邮件 - 使用163邮箱SMTP服务器
        server = smtplib.SMTP('smtp.163.com', 25)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"发送邮件失败: {e}")
        return False

@app.route('/submit_consultation', methods=['POST'])
def submit_consultation():
    """处理咨询表单提交"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['name', 'text', 'consultation_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'缺少必填字段: {field}'}), 400
        
        # 保存到数据库
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        # 获取客户端信息
        ip_address = request.remote_addr
        browser = request.user_agent.string
        device_model = data.get('device_model', '')
        location = data.get('location', '')
        fill_duration = data.get('fill_duration', 0)

        cursor.execute('''
            INSERT INTO consultations (
                name, contact, email, consultation_type, message, timestamp, 
                device_model, ip_address, location, browser, fill_duration
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data['text'],  # 使用text字段作为联系方式
            data.get('email', ''),
            data['consultation_type'],
            data.get('description', ''),  # 使用description字段作为咨询内容
            datetime.now(beijing_tz).strftime('%Y-%m-%d %H:%M:%S'),
            device_model,
            ip_address,
            location,
            browser,
            fill_duration
        ))
        conn.commit()
        conn.close()
        
        # 发送邮件通知
        send_email(data)
        
        return jsonify({'success': True, 'message': '咨询表单提交成功！'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'提交失败: {str(e)}'}), 500

@app.route('/api/consultations', methods=['GET'])
def get_consultations():
    """获取所有咨询数据"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # 获取所有咨询
        cursor.execute('SELECT * FROM consultations ORDER BY timestamp DESC')
        consultations = cursor.fetchall()
        
        # 获取统计数据
        cursor.execute('SELECT COUNT(*) FROM consultations')
        total = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM consultations WHERE DATE(timestamp) = DATE(datetime("now", "+8 hours"))')
        today = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM consultations WHERE status = "新提交"')
        pending = cursor.fetchone()[0]
        
        # 获取本周咨询数
        cursor.execute('SELECT COUNT(*) FROM consultations WHERE strftime("%W", timestamp) = strftime("%W", datetime("now", "+8 hours"))')
        this_week = cursor.fetchone()[0]
        
        # 获取本月咨询数
        cursor.execute('SELECT COUNT(*) FROM consultations WHERE strftime("%Y-%m", timestamp) = strftime("%Y-%m", datetime("now", "+8 hours"))')
        this_month = cursor.fetchone()[0]
        
        # 获取咨询类型统计
        cursor.execute('SELECT consultation_type, COUNT(*) FROM consultations GROUP BY consultation_type')
        type_stats = dict(cursor.fetchall())
        
        conn.close()
        
        # 格式化数据
        consultations_data = []
        for consultation in consultations:
            consultations_data.append({
                'id': consultation[0],
                'name': consultation[1],
                'contact': consultation[2],
                'email': consultation[3],
                'consultation_type': consultation[4],
                'message': consultation[5],
                'timestamp': consultation[6],
                'status': consultation[7]
            })
        
        return jsonify({
            'success': True,
            'consultations': consultations_data,
            'total': total,
            'today': today,
            'pending': pending,
            'this_week': this_week,
            'this_month': this_month,
            'type_stats': type_stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取数据失败: {str(e)}'}), 500

@app.route('/api/consultations/<int:consultation_id>', methods=['PUT'])
def update_consultation_status(consultation_id):
    """更新咨询状态"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'message': '缺少状态参数'}), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('UPDATE consultations SET status = ? WHERE id = ?', (new_status, consultation_id))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': '状态更新成功'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'更新失败: {str(e)}'}), 500

@app.route('/api/consultations/<int:consultation_id>', methods=['DELETE'])
def delete_consultation(consultation_id):
    """删除咨询记录"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM consultations WHERE id = ?', (consultation_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': '删除成功'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'删除失败: {str(e)}'}), 500

@app.route('/api/export', methods=['GET'])
def export_consultations():
    """导出咨询数据"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM consultations ORDER BY timestamp DESC')
        consultations = cursor.fetchall()
        conn.close()
        
        # 生成CSV格式数据
        csv_data = "ID,姓名,联系方式,邮箱,咨询类型,咨询内容,提交时间,状态\n"
        for consultation in consultations:
            csv_data += f"{consultation[0]},{consultation[1]},{consultation[2]},{consultation[3]},{consultation[4]},{consultation[5]},{consultation[6]},{consultation[7]}\n"
        
        return Response(
            csv_data,
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=consultations.csv'}
        )
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'导出失败: {str(e)}'}), 500

@app.route('/admin')
def admin():
    """后台管理页面"""
    return render_template_string('''
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>后台管理系统 - 生命力教育咨询</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Arial', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .login-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
            }

            .login-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .login-header h1 {
                color: #333;
                font-size: 24px;
                margin-bottom: 10px;
            }

            .login-header p {
                color: #666;
                font-size: 14px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 600;
            }

            .form-group input {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s ease;
            }

            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }

            .login-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease;
            }

            .login-btn:hover {
                transform: translateY(-2px);
            }

            .error-message {
                color: #e74c3c;
                text-align: center;
                margin-top: 15px;
                font-size: 14px;
                display: none;
            }

            .dashboard {
                display: none;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 1200px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e1e5e9;
            }

            .dashboard-header h1 {
                color: #333;
                font-size: 28px;
            }

            .logout-btn {
                padding: 10px 20px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .stat-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }

            .stat-card h3 {
                font-size: 24px;
                margin-bottom: 10px;
            }

            .stat-card p {
                font-size: 14px;
                opacity: 0.9;
            }

            .consultations-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            .consultations-table th,
            .consultations-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e1e5e9;
            }

            .consultations-table th {
                background: #f8f9fa;
                font-weight: 600;
                color: #333;
            }

            .consultations-table tr:hover {
                background: #f8f9fa;
            }

            .refresh-btn {
                padding: 10px 20px;
                background: #27ae60;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                margin-bottom: 20px;
            }

            .no-data {
                text-align: center;
                color: #666;
                padding: 40px;
                font-size: 16px;
            }
            
            .action-buttons {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .action-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .export-btn {
                background: #27ae60;
                color: white;
            }
            
            .refresh-btn {
                background: #3498db;
                color: white;
            }
            
            .filter-btn {
                background: #f39c12;
                color: white;
            }
            
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .filters-panel {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                border: 1px solid #e1e5e9;
            }
            
            .filter-group {
                display: inline-block;
                margin-right: 20px;
                margin-bottom: 10px;
            }
            
            .filter-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #333;
            }
            
            .filter-group select,
            .filter-group input {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .status-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
            }
            
            .status-new {
                background: #e74c3c;
                color: white;
            }
            
            .status-contacted {
                background: #f39c12;
                color: white;
            }
            
            .status-processed {
                background: #27ae60;
                color: white;
            }
            
            .status-closed {
                background: #95a5a6;
                color: white;
            }
            
            .action-cell {
                display: flex;
                gap: 5px;
            }
            
            .action-cell button {
                padding: 4px 8px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .btn-edit {
                background: #3498db;
                color: white;
            }
            
            .btn-delete {
                background: #e74c3c;
                color: white;
            }
            
            .btn-edit:hover,
            .btn-delete:hover {
                opacity: 0.8;
            }
        </style>
    </head>
    <body>
        <div class="login-container" id="loginForm">
            <div class="login-header">
                <h1>后台管理系统</h1>
                <p>生命力教育咨询工作室</p>
            </div>
            <form id="loginFormElement">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="login-btn">登录</button>
            </form>
            <div class="error-message" id="errorMessage"></div>
        </div>

        <div class="dashboard" id="dashboard">
            <div class="dashboard-header">
                <h1>咨询表单管理</h1>
                <button class="logout-btn" onclick="logout()">退出登录</button>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h3 id="totalConsultations">0</h3>
                    <p>总咨询数</p>
                </div>
                <div class="stat-card">
                    <h3 id="todayConsultations">0</h3>
                    <p>今日咨询</p>
                </div>
                <div class="stat-card">
                    <h3 id="pendingConsultations">0</h3>
                    <p>待处理</p>
                </div>
                <div class="stat-card">
                    <h3 id="thisWeekConsultations">0</h3>
                    <p>本周咨询</p>
                </div>
                <div class="stat-card">
                    <h3 id="thisMonthConsultations">0</h3>
                    <p>本月咨询</p>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="action-btn export-btn" onclick="exportData()">导出数据</button>
                <button class="action-btn refresh-btn" onclick="loadConsultations()">刷新数据</button>
                <button class="action-btn filter-btn" onclick="toggleFilters()">筛选</button>
            </div>
            
            <div class="filters-panel" id="filtersPanel" style="display: none;">
                <div class="filter-group">
                    <label>状态筛选:</label>
                    <select id="statusFilter" onchange="filterConsultations()">
                        <option value="">全部状态</option>
                        <option value="新提交">新提交</option>
                        <option value="已联系">已联系</option>
                        <option value="已处理">已处理</option>
                        <option value="已关闭">已关闭</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>类型筛选:</label>
                    <select id="typeFilter" onchange="filterConsultations()">
                        <option value="">全部类型</option>
                        <option value="学生咨询">学生咨询</option>
                        <option value="家长咨询">家长咨询</option>
                        <option value="职业咨询">职业咨询</option>
                        <option value="其他咨询">其他咨询</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>时间范围:</label>
                    <input type="date" id="startDate" onchange="filterConsultations()">
                    <input type="date" id="endDate" onchange="filterConsultations()">
                </div>
            </div>

            <button class="refresh-btn" onclick="loadConsultations()">刷新数据</button>
            
            <div id="consultationsContainer">
                <table class="consultations-table" id="consultationsTable" style="display: none;">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>姓名</th>
                            <th>联系方式</th>
                            <th>邮箱</th>
                            <th>咨询类型</th>
                            <th>咨询内容</th>
                            <th>来源设备型号</th>
                            <th>来自IP</th>
                            <th>来自地点</th>
                            <th>来自浏览器</th>
                            <th>填写时长</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="consultationsTableBody">
                    </tbody>
                </table>
                <div class="no-data" id="noData">暂无咨询数据</div>
            </div>
        </div>

        <script>
            // 登录验证
            document.getElementById('loginFormElement').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                if (username === 'kaiwen' && password === '11112222') {
                    // 登录成功
                    localStorage.setItem('adminLoggedIn', 'true');
                    showDashboard();
                    loadConsultations();
                } else {
                    // 登录失败
                    showError('用户名或密码错误');
                }
            });

            // 显示错误信息
            function showError(message) {
                const errorElement = document.getElementById('errorMessage');
                errorElement.textContent = message;
                errorElement.style.display = 'block';
                
                setTimeout(() => {
                    errorElement.style.display = 'none';
                }, 3000);
            }

            // 显示仪表板
            function showDashboard() {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
            }

            // 退出登录
            function logout() {
                localStorage.removeItem('adminLoggedIn');
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('dashboard').style.display = 'none';
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
            }

            // 加载咨询数据
            async function loadConsultations() {
                try {
                    const response = await fetch('/api/consultations');
                    const data = await response.json();
                    
                    updateStats(data);
                    updateConsultationsTable(data.consultations);
                } catch (error) {
                    console.error('加载数据失败:', error);
                    showError('加载数据失败，请检查网络连接');
                }
            }

            // 更新统计信息
            function updateStats(data) {
                document.getElementById('totalConsultations').textContent = data.total || 0;
                document.getElementById('todayConsultations').textContent = data.today || 0;
                document.getElementById('pendingConsultations').textContent = data.pending || 0;
                document.getElementById('thisWeekConsultations').textContent = data.this_week || 0;
                document.getElementById('thisMonthConsultations').textContent = data.this_month || 0;
            }

            // 更新咨询表格
            function updateConsultationsTable(consultations) {
                const table = document.getElementById('consultationsTable');
                const tableBody = document.getElementById('consultationsTableBody');
                const noData = document.getElementById('noData');
                
                if (consultations && consultations.length > 0) {
                    table.style.display = 'table';
                    noData.style.display = 'none';
                    
                    tableBody.innerHTML = '';
                    consultations.forEach(consultation => {
                        const statusClass = getStatusClass(consultation.status);
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${new Date(consultation.timestamp).toLocaleString()}</td>
                            <td>${consultation.name}</td>
                            <td>${consultation.contact}</td>
                            <td>${consultation.email}</td>
                            <td>${consultation.consultation_type}</td>
                            <td>${consultation.message}</td>
                            <td>${consultation.device_model || '-'}</td>
                            <td>${consultation.ip_address || '-'}</td>
                            <td>${consultation.location || '-'}</td>
                            <td>${consultation.browser || '-'}</td>
                            <td>${consultation.fill_duration ? consultation.fill_duration + '秒' : '-'}</td>
                            <td><span class="status-badge ${statusClass}">${consultation.status || '新提交'}</span></td>
                            <td class="action-cell">
                                <button class="btn-edit" onclick="editStatus(${consultation.id})">编辑</button>
                                <button class="btn-delete" onclick="deleteConsultation(${consultation.id})">删除</button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                } else {
                    table.style.display = 'none';
                    noData.style.display = 'block';
                }
            }
            
            // 获取状态样式类
            function getStatusClass(status) {
                switch(status) {
                    case '新提交': return 'status-new';
                    case '已联系': return 'status-contacted';
                    case '已处理': return 'status-processed';
                    case '已关闭': return 'status-closed';
                    default: return 'status-new';
                }
            }
            
            // 编辑状态
            function editStatus(id) {
                const newStatus = prompt('请输入新状态 (新提交/已联系/已处理/已关闭):');
                if (newStatus) {
                    fetch(`/api/consultations/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({status: newStatus})
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            alert('状态更新成功！');
                            loadConsultations();
                        } else {
                            alert('更新失败: ' + result.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('更新失败，请检查网络连接');
                    });
                }
            }
            
            // 删除咨询
            function deleteConsultation(id) {
                if (confirm('确定要删除这条咨询记录吗？')) {
                    fetch(`/api/consultations/${id}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            alert('删除成功！');
                            loadConsultations();
                        } else {
                            alert('删除失败: ' + result.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('删除失败，请检查网络连接');
                    });
                }
            }
            
            // 导出数据
            function exportData() {
                window.open('/api/export', '_blank');
            }
            
            // 切换筛选面板
            function toggleFilters() {
                const panel = document.getElementById('filtersPanel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
            
            // 筛选咨询
            function filterConsultations() {
                const statusFilter = document.getElementById('statusFilter').value;
                const typeFilter = document.getElementById('typeFilter').value;
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                
                // 这里可以实现更复杂的筛选逻辑
                loadConsultations(); // 暂时重新加载所有数据
            }

            // 检查登录状态
            function checkLoginStatus() {
                if (localStorage.getItem('adminLoggedIn') === 'true') {
                    showDashboard();
                    loadConsultations();
                }
            }

            // 页面加载时检查登录状态
            checkLoginStatus();
        </script>
    </body>
    </html>
    ''')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    # 初始化数据库
    init_db()
    
    # 启动服务器
    print("后台管理系统启动中...")
    print("访问地址: http://localhost:5001/admin")
    print("用户名: kaiwen")
    print("密码: 11112222")
    
    app.run(host='0.0.0.0', port=5001, debug=True)