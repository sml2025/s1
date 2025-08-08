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

    // 表单处理 - 修复移动端提交问题
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // 添加设备信息用于调试
            data.device_model = navigator.userAgent || '未知设备';
            data.location = window.location.hostname;
            
            // 使用增强的表单验证
            if (!validateMobileForm(this)) {
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = '提交中...';
                submitBtn.disabled = true;
                
                // 使用相对路径，兼容移动端和桌面端
                const apiUrl = '/submit_consultation';
                
                // 添加超时处理
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
                
                fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                    signal: controller.signal
                })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        showNotification('咨询表单提交成功！我们会尽快联系您。', 'success');
                        this.reset();
                        // 移除所有错误样式
                        this.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
                    } else {
                        showNotification('提交失败: ' + (result.message || '未知错误'), 'error');
                    }
                })
                .catch(error => {
                    console.error('表单提交错误:', error);
                    if (error.name === 'AbortError') {
                        showNotification('网络超时，请检查网络连接', 'error');
                    } else {
                        showNotification('提交失败，请检查网络连接或稍后重试。', 'error');
                    }
                })
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
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