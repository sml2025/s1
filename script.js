document.addEventListener('DOMContentLoaded', function() {
    console.log('生命力教育网站脚本加载成功');

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

    // 表单提交处理 - GitHub Pages兼容版本
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                city: formData.get('city'),
                contact: formData.get('text'),
                consultation_type: formData.get('consultation_type'),
                age_group: formData.get('age_group'),
                description: formData.get('description'),
                source: window.location.hostname.includes('github.io') ? 'GitHub Pages' : '本地服务器',
                device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
                timestamp: new Date().toLocaleString('zh-CN')
            };
            
            // 验证表单
            if (!data.name || !data.contact || !data.consultation_type || !data.age_group || !data.description) {
                showNotification('❌ 请填写所有必填字段', 'error');
                return;
            }
            
            // 验证联系方式格式（手机号或微信号）
            const contact = data.contact.trim();
            const isPhone = /^1[3-9]\d{9}$/.test(contact);
            const isWeChat = /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/.test(contact) || contact.length >= 6;
            
            if (!isPhone && !isWeChat) {
                showNotification('❌ 请输入正确的手机号或微信号', 'error');
                return;
            }
            
            // 禁用提交按钮
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '处理中...';
            submitBtn.disabled = true;
            
            // 检测环境并选择处理方式
            if (window.location.hostname.includes('github.io')) {
                // GitHub Pages环境：使用邮箱提交
                const subject = encodeURIComponent(`教育咨询 - ${data.name}`);
                const body = encodeURIComponent(
                    `【教育咨询表单】\n\n` +
                    `姓名：${data.name}\n` +
                    `城市：${data.city}\n` +
                    `联系方式：${data.contact}\n` +
                    `咨询类型：${data.consultation_type}\n` +
                    `年龄段：${data.age_group}\n` +
                    `需求描述：${data.description}\n\n` +
                    `设备信息：${data.device}\n` +
                    `提交时间：${data.timestamp}\n` +
                    `来源：${data.source}`
                );
                
                const mailtoLink = `mailto:kaiwen0151@163.com?subject=${subject}&body=${body}`;
                
                showNotification('✅ 咨询信息已准备完毕！正在跳转到邮箱...', 'success');
                
                setTimeout(() => {
                    window.location.href = mailtoLink;
                    this.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 1500);
                
            } else {
                // 本地服务器环境：使用后端API
                fetch('/submit_consultation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(result => {
                    showNotification('✅ 提交成功！我们会尽快联系您', 'success');
                    this.reset();
                })
                .catch(error => {
                    console.error('Error:', error);
                    let errorMsg = '提交失败，请稍后重试';
                    if (error.name === 'AbortError') {
                        errorMsg = '请求超时，请检查网络连接';
                    } else if (error.message.includes('HTTP error')) {
                        errorMsg = '服务器错误，请稍后重试';
                    } else if (error.message.includes('Failed to fetch')) {
                        errorMsg = '网络连接错误，请检查网络';
                    }
                    showNotification('❌ ' + errorMsg, 'error');
                })
                .finally(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
            }
        });
    }

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

    // 移动端表单优化
    function optimizeFormForMobile() {
        const inputs = document.querySelectorAll('.contact-form input, .contact-form select, .contact-form textarea');
        
        inputs.forEach(input => {
            // 防止iOS缩放
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.addEventListener('focus', function() {
                    document.body.style.zoom = '1';
                });
                
                input.addEventListener('blur', function() {
                    document.body.style.zoom = '';
                });
            }
            
            // 更好的触摸反馈
            input.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            input.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }

    // 初始化移动端优化
    if ('ontouchstart' in window) {
        optimizeFormForMobile();
    }
    
    // 添加表单验证增强
    function validateMobileForm(form) {
        const inputs = form.querySelectorAll('[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            const value = input.value.trim();
            if (!value) {
                input.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
            
            // 特殊验证
            if (input.name === 'text' && value) {
                // 验证电话或微信格式
                const phoneRegex = /^1[3-9]\d{9}$/;
                const wechatRegex = /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/;
                
                if (!phoneRegex.test(value) && !wechatRegex.test(value)) {
                    showNotification('请输入有效的手机号或微信号', 'error');
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }