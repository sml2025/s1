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

    // 表单处理
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            let isValid = true;
            const requiredFields = this.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'var(--error-color)';
                } else {
                    field.style.borderColor = '';
                }
            });
            
            if (isValid) {
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    const originalText = submitBtn.textContent;
                    submitBtn.textContent = '提交中...';
                    submitBtn.disabled = true;
                    
                    fetch('http://localhost:5001/submit_consultation', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            showNotification('咨询表单提交成功！我们会尽快联系您。', 'success');
                            this.reset();
                        } else {
                            showNotification('提交失败: ' + result.message, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showNotification('提交失败，请检查网络连接或联系管理员。', 'error');
                    })
                    .finally(() => {
                        if (submitBtn) {
                            submitBtn.textContent = originalText;
                            submitBtn.disabled = false;
                        }
                    });
                }
            } else {
                showNotification('请填写所有必填字段', 'error');
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