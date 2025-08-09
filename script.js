// 记录页面加载时间，用于计算浏览时长
let pageLoadTime = Date.now();

document.addEventListener('DOMContentLoaded', function() {
    console.log('生命力教育网站脚本加载成功');
    // 重置页面加载时间，确保在DOM加载完成后开始计时
    pageLoadTime = Date.now();
    console.log('页面加载完成，开始计时浏览时长');

    // 确保DOM元素存在再操作
    const painPointsSection = document.getElementById('pain-points');
    if (painPointsSection) {
        setTimeout(() => {
            painPointsSection.style.display = 'block';
            painPointsSection.style.opacity = '1';
            painPointsSection.style.visibility = 'visible';
        }, 1000);
    }

    // 导航元素 - 安全获取
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navbar = document.querySelector('.navbar');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // 滚动效果
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 平滑滚动
    // 平滑滚动到锚点 - 使用现代浏览器支持的scroll-margin-top
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const target = document.querySelector(targetId);
                if (target) {
                    // 使用scrollIntoView实现平滑滚动
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // 关闭移动端菜单
                    if (navMenu && navToggle) {
                        navMenu.classList.remove('active');
                        navToggle.classList.remove('active');
                    }
                }
            }
        });
    });

    // 数字动画
    function animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(number => {
            const target = parseInt(number.textContent.replace(/\D/g, '')) || 0;
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                number.textContent = Math.floor(current) + (number.textContent.includes('%') ? '%' : '');
            }, 50);
        });
    }

    // 观察者API
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                if (entry.target.classList.contains('stat-number')) {
                    animateNumbers();
                }
            }
        });
    }, observerOptions);

    // 观察动画元素
    const animatedElements = document.querySelectorAll('.service-card, .team-card, .achievement-card, .timeline-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // 表单处理
    const contactForm = document.querySelector('.contact-form form');
    const consultationForm = document.getElementById('consultationForm');
    
    // 记录表单开始填写时间
    let formStartTime = {};
    
    // 为表单添加焦点事件，记录开始填写时间
    function trackFormFocus(form, formId) {
        if (!form) return;
        
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (!formStartTime[formId]) {
                    formStartTime[formId] = Date.now();
                }
            });
        });
    }
    
    // 获取设备信息
    function getDeviceInfo() {
        return new Promise(async (resolve) => {
            const deviceInfo = {
                device_model: '未知设备',
                browser: navigator.userAgent,
                location: '未知地点',
                ip_address: ''
            };
            
            // 提取设备型号
            try {
                const ua = navigator.userAgent;
                let deviceModel = '';
                let browserInfo = '未知浏览器';
                
                // 检测Trae应用
                if (ua.includes('Trae')) {
                    const traeMatch = ua.match(/Trae\/(\d+\.\d+\.\d+)/i);
                    const traeVersion = traeMatch ? traeMatch[1] : '';
                    
                    // 检测操作系统
                    if (ua.includes('Macintosh') || ua.includes('Mac OS')) {
                        const macMatch = ua.match(/Mac\s*OS\s*X\s*([^;)]+)/i);
                        const macVersion = macMatch ? macMatch[1].replace(/_/g, '.') : '';
                        deviceModel = `Mac OS ${macVersion} (Trae应用${traeVersion ? ' ' + traeVersion : ''})`;
                    } else if (ua.includes('Windows')) {
                        const windowsMatch = ua.match(/Windows\s*(?:NT\s*)?([^;)]+)/i);
                        const windowsVersion = windowsMatch ? windowsMatch[1] : '';
                        deviceModel = `Windows ${windowsVersion} (Trae应用${traeVersion ? ' ' + traeVersion : ''})`;
                    } else if (ua.includes('Linux')) {
                        deviceModel = `Linux (Trae应用${traeVersion ? ' ' + traeVersion : ''})`;
                    } else {
                        deviceModel = `${navigator.platform} (Trae应用${traeVersion ? ' ' + traeVersion : ''})`;
                    }
                    
                    // 提取Chrome版本
                    const chromeMatch = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/i);
                    const chromeVersion = chromeMatch ? chromeMatch[1] : '';
                    
                    // 提取Electron版本
                    const electronMatch = ua.match(/Electron\/(\d+\.\d+\.\d+)/i);
                    const electronVersion = electronMatch ? electronMatch[1] : '';
                    
                    browserInfo = `Trae${traeVersion ? ' ' + traeVersion : ''} (Chrome ${chromeVersion}, Electron ${electronVersion})`;
                } 
                // 检测移动设备
                else if (/(iPhone|iPad|iPod|Android|BlackBerry|Windows Phone)/i.test(ua)) {
                    // 提取移动设备型号
                    if (ua.includes('iPhone')) {
                        // 尝试提取iPhone型号
                        const iPhoneMatch = ua.match(/iPhone\s*(?:OS\s*)?([^\s;]+)/i);
                        deviceModel = iPhoneMatch ? `iPhone ${iPhoneMatch[1]}` : 'iPhone';
                    } else if (ua.includes('iPad')) {
                        deviceModel = 'iPad';
                    } else if (ua.includes('Android')) {
                        // 尝试提取Android设备型号
                        const androidMatch = ua.match(/Android\s*([^;]+).*?;\s*([^;]+)/i);
                        if (androidMatch) {
                            const androidVersion = androidMatch[1];
                            const deviceName = androidMatch[2].trim();
                            deviceModel = `${deviceName} (Android ${androidVersion})`;
                        } else {
                            deviceModel = 'Android设备';
                        }
                    } else {
                        const mobileMatch = ua.match(/(iPhone|iPad|iPod|Android|BlackBerry|Windows Phone)/i);
                        deviceModel = mobileMatch ? mobileMatch[0] : '移动设备';
                    }
                    
                    // 提取移动浏览器信息
                    if (ua.includes('Firefox')) {
                        const version = ua.match(/Firefox\/([\d.]+)/i);
                        browserInfo = version ? `Firefox ${version[1]}` : 'Firefox';
                    } else if (ua.includes('Edg')) {
                        const version = ua.match(/Edg\/([\d.]+)/i);
                        browserInfo = version ? `Edge ${version[1]}` : 'Edge';
                    } else if (ua.includes('Chrome')) {
                        const version = ua.match(/Chrome\/([\d.]+)/i);
                        browserInfo = version ? `Chrome ${version[1]}` : 'Chrome';
                    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
                        const version = ua.match(/Safari\/([\d.]+)/i);
                        browserInfo = version ? `Safari ${version[1]}` : 'Safari';
                    }
                } 
                // 桌面设备
                else {
                    if (ua.includes('Windows')) {
                        const windowsMatch = ua.match(/Windows\s*(?:NT\s*)?([^;)]+)/i);
                        const windowsVersion = windowsMatch ? windowsMatch[1] : '';
                        deviceModel = `Windows ${windowsVersion}`;
                    } else if (ua.includes('Macintosh') || ua.includes('Mac OS')) {
                        const macMatch = ua.match(/Mac\s*OS\s*X\s*([^;)]+)/i);
                        const macVersion = macMatch ? macMatch[1].replace(/_/g, '.') : '';
                        deviceModel = `Mac OS ${macVersion}`;
                    } else if (ua.includes('Linux')) {
                        deviceModel = 'Linux';
                    } else {
                        deviceModel = navigator.platform || '桌面设备';
                    }
                    
                    // 提取桌面浏览器信息
                    if (ua.includes('Firefox')) {
                        const version = ua.match(/Firefox\/([\d.]+)/i);
                        browserInfo = version ? `Firefox ${version[1]}` : 'Firefox';
                    } else if (ua.includes('Edg')) {
                        const version = ua.match(/Edg\/([\d.]+)/i);
                        browserInfo = version ? `Edge ${version[1]}` : 'Edge';
                    } else if (ua.includes('Chrome')) {
                        const version = ua.match(/Chrome\/([\d.]+)/i);
                        browserInfo = version ? `Chrome ${version[1]}` : 'Chrome';
                    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
                        const version = ua.match(/Safari\/([\d.]+)/i);
                        browserInfo = version ? `Safari ${version[1]}` : 'Safari';
                    } else if (ua.includes('MSIE') || ua.includes('Trident')) {
                        const version = ua.match(/(?:MSIE|rv:)\s*([\d.]+)/i);
                        browserInfo = version ? `Internet Explorer ${version[1]}` : 'Internet Explorer';
                    }
                }
                
                deviceInfo.device_model = deviceModel || navigator.platform || '未知设备';
                deviceInfo.browser = browserInfo;
                
                console.log('设备信息:', deviceInfo.device_model);
                console.log('浏览器信息:', deviceInfo.browser);
                
            } catch (error) {
                console.error('获取设备信息失败:', error);
            }
            
            // 尝试获取地理位置（设置超时为5秒）
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            resolve, 
                            reject, 
                            {timeout: 5000, maximumAge: 60000, enableHighAccuracy: true}
                        );
                    });
                    
                    const { latitude, longitude } = position.coords;
                    deviceInfo.location = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
                    console.log('获取到地理坐标:', deviceInfo.location);
                    
                    // 尝试将坐标转换为可读地址
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                        const data = await response.json();
                        if (data && data.display_name) {
                            deviceInfo.location = data.display_name;
                            console.log('地址解析成功:', deviceInfo.location);
                        }
                    } catch (geoError) {
                        console.log('无法转换坐标为地址:', geoError);
                    }
                } catch (error) {
                    console.log('无法获取地理位置:', error);
                    // 尝试通过多个IP API获取大致位置
                    const ipApis = [
                        'https://ipapi.co/json/',
                        'https://ip-api.com/json/',
                        'https://ipinfo.io/json'
                    ];
                    
                    for (const api of ipApis) {
                        try {
                            const response = await fetch(api);
                            const data = await response.json();
                            
                            if (data) {
                                if (data.city && data.country) {
                                    const region = data.region || data.regionName || data.region_name || '';
                                    const country = data.country_name || data.country || '';
                                    deviceInfo.location = `${data.city}${region ? ', ' + region : ''}${country ? ', ' + country : ''}`;
                                    console.log('通过IP获取位置成功:', deviceInfo.location);
                                    break;
                                }
                            }
                        } catch (ipError) {
                            console.log(`尝试API ${api} 失败:`, ipError);
                            continue;
                        }
                    }
                }
            }
            
            resolve(deviceInfo);
        });
    }
    
    // 通用表单提交处理函数（已废弃，保留用于兼容）
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // 添加设备信息
        const deviceInfo = await getDeviceInfo();
        Object.assign(data, deviceInfo);
        
        // 计算填写时长
        const formId = this.id || 'contactForm';
        if (formStartTime[formId]) {
            const durationMs = Date.now() - formStartTime[formId];
            // 转换为秒并保留一位小数
            const durationSec = Math.round(durationMs / 100) / 10;
            data.fill_duration = durationSec + '秒';
            console.log('表单填写时长:', data.fill_duration);
            // 重置开始时间
            formStartTime[formId] = null;
        } else {
            data.fill_duration = '0秒';
            console.log('未检测到表单开始时间，填写时长设为:', data.fill_duration);
        }
        
        handleFormSubmitWithData(this, data);
    }
    
    // 处理带有设备信息和填写时长的表单数据提交
    function handleFormSubmitWithData(form, data) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'var(--error-color)';
            } else {
                field.style.borderColor = '';
            }
        });
        
        if (isValid) {
            // 获取提交按钮（按钮状态已在事件监听器中处理）
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : '提交';
            
            // 记录提交时间和数据
            console.log('提交表单数据:', data);
            
            fetch('http://localhost:5002/submit_consultation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showNotification('您的提交已经成功！我们会尽快与您联系。也欢迎您加我们的客服微信：kaiwen251899，谢谢您！', 'success');
                    form.reset();
                } else {
                    showNotification('提交失败: ' + result.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('提交失败，请检查网络连接或联系管理员。', 'error');
            })
            .finally(() => {
                // 恢复按钮状态
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        } else {
            showNotification('请填写所有必填字段', 'error');
        }
    }

// 获取IP地址
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('获取IP地址失败:', error);
        return '';
    }
}

// 初始化表单跟踪
async function initForms() {
    // 获取IP地址
    const ip = await getIPAddress();
    
    // 为联系表单添加事件监听器
    if (contactForm) {
        trackFormFocus(contactForm, 'contactForm');
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 显示加载状态
            const submitBtn = this.querySelector('button[type="submit"]');
            let originalText = '';
            if (submitBtn) {
                originalText = submitBtn.textContent;
                submitBtn.textContent = '提交中...';
                submitBtn.disabled = true;
            }
            
            try {
                // 获取设备信息
                const deviceInfo = await getDeviceInfo();
                deviceInfo.ip_address = ip;
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                Object.assign(data, deviceInfo);
                
                // 计算填写时长
                if (formStartTime['contactForm']) {
                    const durationMs = Date.now() - formStartTime['contactForm'];
                    // 转换为秒并保留一位小数
                    const durationSec = Math.round(durationMs / 100) / 10;
                    data.fill_duration = durationSec + '秒';
                    console.log('联系表单填写时长:', data.fill_duration);
                    formStartTime['contactForm'] = null;
                } else {
                    data.fill_duration = '0秒';
                    console.log('未检测到咨询表单开始时间，填写时长设为:', data.fill_duration);
                }
                
                // 计算浏览时长
                if (pageLoadTime) {
                    const browseDurationMs = Date.now() - pageLoadTime;
                    // 转换为秒并保留一位小数
                    const browseDurationSec = Math.round(browseDurationMs / 100) / 10;
                    data.browse_duration = browseDurationSec + '秒';
                    console.log('网页浏览时长:', data.browse_duration);
                } else {
                    data.browse_duration = '0秒';
                    console.log('未检测到页面加载时间，浏览时长设为:', data.browse_duration);
                }
                
                handleFormSubmitWithData(this, data);
            } catch (error) {
                console.error('表单提交错误:', error);
                showNotification('提交失败，请稍后重试', 'error');
                
                // 恢复按钮状态
                if (submitBtn) {
                    submitBtn.textContent = originalText || '提交';
                    submitBtn.disabled = false;
                }
            }
        });
    }
    
    // 为咨询表单添加事件监听器
    if (consultationForm) {
        trackFormFocus(consultationForm, 'consultationForm');
        consultationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 显示加载状态
            const submitBtn = this.querySelector('button[type="submit"]');
            let originalText = '';
            if (submitBtn) {
                originalText = submitBtn.textContent;
                submitBtn.textContent = '提交中...';
                submitBtn.disabled = true;
            }
            
            try {
                // 获取设备信息
                const deviceInfo = await getDeviceInfo();
                deviceInfo.ip_address = ip;
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                Object.assign(data, deviceInfo);
                
                // 计算填写时长
                if (formStartTime['consultationForm']) {
                    const durationMs = Date.now() - formStartTime['consultationForm'];
                    // 转换为秒并保留一位小数
                    const durationSec = Math.round(durationMs / 100) / 10;
                    data.fill_duration = durationSec + '秒';
                    console.log('咨询表单填写时长:', data.fill_duration);
                    formStartTime['consultationForm'] = null;
                } else {
                    data.fill_duration = '0秒';
                    console.log('未检测到咨询表单开始时间，填写时长设为:', data.fill_duration);
                }
                
                // 计算浏览时长
                if (pageLoadTime) {
                    const browseDurationMs = Date.now() - pageLoadTime;
                    // 转换为秒并保留一位小数
                    const browseDurationSec = Math.round(browseDurationMs / 100) / 10;
                    data.browse_duration = browseDurationSec + '秒';
                    console.log('网页浏览时长:', data.browse_duration);
                } else {
                    data.browse_duration = '0秒';
                    console.log('未检测到页面加载时间，浏览时长设为:', data.browse_duration);
                }
                
                handleFormSubmitWithData(this, data);
            } catch (error) {
                console.error('表单提交错误:', error);
                showNotification('提交失败，请稍后重试', 'error');
                
                // 恢复按钮状态
                if (submitBtn) {
                    submitBtn.textContent = originalText || '提交';
                    submitBtn.disabled = false;
                }
            }
        });
    }
}

// 初始化表单
initForms();

// 成就标签切换
const tabButtons = document.querySelectorAll('.tab-btn');
const achievementCards = document.querySelectorAll('.achievement-card');

if (tabButtons.length > 0 && achievementCards.length > 0) {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            achievementCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// 通知函数
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;

    const colors = {
        success: '#4CAF50',
        error: '#F44336',
        info: '#2196F3'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

console.log('网站初始化完成');
});