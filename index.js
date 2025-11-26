const extensionName = "CTE_Map";
const extensionPath = `scripts/extensions/third-party/${extensionName}`;

let stContext = null;
let currentTheme = 0; // 0: 黑金, 1: 蓝白, 2: 粉白

window.CTEMap = {
    currentDestination: '',
    
    // 初始化
    init: async function() {
        console.log("[CTE Map] Initializing...");
        
        // 移除旧元素
        $('#cte-map-panel').remove();
        $('#cte-toggle-btn').remove();
        $('link[href*="CTE_Map/style.css"]').remove();

        // 加载CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${extensionPath}/style.css`;
        document.head.appendChild(link);

        // 创建基础HTML结构
        const panelHTML = `
            <div id="cte-toggle-btn" title="打开 CTE 地图" 
                 style="position:fixed; top:130px; left:10px; z-index:9000; width:45px; height:45px; background:#c5a065; border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.5); color:#fff; font-size:24px; border:2px solid #fff;">
                🗺️
            </div>
            <div id="cte-map-panel">
                <div id="cte-drag-handle">
                    <span>CTE E-SPORTS MAP</span>
                    <span id="cte-close-btn">✖</span>
                </div>
                <!-- 内容将被 map.html 填充 -->
                <div id="cte-content-wrapper" style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
                    Loading...
                </div>
            </div>
        `;
        $('body').append(panelHTML);

        // 加载 map.html 内容
        try {
            const response = await fetch(`${extensionPath}/map.html`);
            if (!response.ok) throw new Error("Map file missing");
            const html = await response.text();
            $('#cte-content-wrapper').html(html);
            
            this.bindEvents();
            this.loadSettings();
        } catch (e) {
            console.error(e);
            $('#cte-content-wrapper').html(`<p style="color:red; padding:20px;">加载失败: ${e.message}</p>`);
        }

        // 绑定主面板开关
        $('#cte-toggle-btn').on('click', () => $('#cte-map-panel').fadeToggle());
        $('#cte-close-btn').on('click', () => $('#cte-map-panel').fadeOut());

        // 使面板可拖拽 (仅通过头部)
        if ($.fn.draggable) {
            $('#cte-map-panel').draggable({ 
                handle: '#cte-drag-handle',
                containment: 'window'
            });
        }
    },

    bindEvents: function() {
        const container = document.getElementById('cte-map-wrapper');
        const pins = document.querySelectorAll('.cte-pin');
        
        // 地标拖拽逻辑
        pins.forEach(pin => {
            let isDragging = false;
            let startX, startY, startLeft, startTop;
            let hasMoved = false;

            pin.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                isDragging = true;
                hasMoved = false;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = pin.offsetLeft;
                startTop = pin.offsetTop;
                pin.classList.add('dragging');

                document.onmousemove = (moveEvent) => {
                    if (!isDragging) return;
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

                    let newLeft = startLeft + dx;
                    let newTop = startTop + dy;
                    
                    // 限制在800x800容器内
                    newLeft = Math.max(0, Math.min(newLeft, 800));
                    newTop = Math.max(0, Math.min(newTop, 800));

                    pin.style.left = newLeft + 'px';
                    pin.style.top = newTop + 'px';
                };

                document.onmouseup = () => {
                    isDragging = false;
                    pin.classList.remove('dragging');
                    document.onmousemove = null;
                    document.onmouseup = null;

                    if (hasMoved) {
                        this.savePosition(pin.id, pin.style.left, pin.style.top);
                    } else {
                        // 如果没有移动，则视为点击，触发onclick
                        pin.click(); 
                    }
                };
            };
        });
    },

    // --- 弹窗与交互 ---
    
    closeAll: function() {
        $('.cte-popup').hide();
        $('.cte-popup-overlay').hide();
    },

    openPopup: function(id) {
        this.closeAll();
        // 直接在 #cte-map-panel 内查找，确保不受外部影响
        const panel = document.getElementById('cte-map-panel');
        const overlay = panel.querySelector('#cte-overlay');
        const popup = panel.querySelector(`#${id}`);
        
        if (overlay) overlay.style.display = 'block';
        if (popup) {
            popup.style.display = 'block';
            popup.scrollTop = 0; // 重置滚动条
        }
    },

    // --- 旅行系统 ---

    openTravelMenu: function(destName) {
        this.currentDestination = destName;
        this.closeAll();
        
        const menu = document.getElementById('popup-travel-menu');
        const overlay = document.getElementById('cte-overlay');
        
        if(menu && overlay) {
            document.getElementById('travel-dest-title').innerText = '前往：' + destName;
            overlay.style.display = 'block';
            menu.style.display = 'block';
        }
    },

    submitCustomPlace: function() {
        const val = $('#custom-place-input').val().trim();
        if(val) this.openTravelMenu(val);
        else alert("请输入地点名称");
    },

    confirmTravel: function(isAlone) {
        const dest = this.currentDestination;
        let text = "";
        
        if (isAlone) {
            text = `{{user}} 决定独自前往${dest}。`;
        } else {
            const name = $('#companion-input').val().trim();
            if (!name) return alert("请输入同伴姓名");
            text = `{{user}} 邀请 ${name} 一起前往${dest}。`;
        }
        
        if (stContext) {
            // 尝试发送到ST输入框并触发
            stContext.executeSlashCommandsWithOptions(`/setinput ${text}`);
            // 可选：自动发送 /send
            // stContext.executeSlashCommandsWithOptions(`/send`); 
            this.closeAll();
            $('#cte-map-panel').fadeOut(); // 旅行开始，关闭地图
        } else {
            alert("未连接到 SillyTavern 上下文:\n" + text);
        }
    },

    // --- 设置与持久化 ---

    toggleTheme: function() {
        currentTheme = (currentTheme + 1) % 3;
        const panel = document.getElementById('cte-map-panel');
        const btn = document.getElementById('cte-theme-btn');
        
        let v = { bg: '', panel: '', gold: '', text: '', sub: '', pin: '', btnText: '' };

        if (currentTheme === 0) { // 黑金
            btn.innerText = '🎨 主题: 默认黑金';
            v = { bg:'#121212', panel:'#1e1e1e', gold:'#c5a065', text:'#e0e0e0', sub:'#888', pin:'rgba(0,0,0,0.85)', btnText:'#000' };
        } else if (currentTheme === 1) { // 蓝白
            btn.innerText = '🎨 主题: 清爽蓝白';
            v = { bg:'#f4f7f6', panel:'#ffffff', gold:'#5d9cec', text:'#333', sub:'#666', pin:'rgba(44,62,80,0.85)', btnText:'#fff' };
        } else { // 粉白
            btn.innerText = '🎨 主题: 浪漫粉白';
            v = { bg:'#fff0f3', panel:'#ffffff', gold:'#f06292', text:'#4a2c36', sub:'#8d6e63', pin:'rgba(136,14,79,0.7)', btnText:'#fff' };
        }

        panel.style.setProperty('--bg-dark', v.bg);
        panel.style.setProperty('--panel-bg', v.panel);
        panel.style.setProperty('--accent-gold', v.gold);
        panel.style.setProperty('--text-main', v.text);
        panel.style.setProperty('--text-sub', v.sub);
        panel.style.setProperty('--pin-bg', v.pin);
        panel.style.setProperty('--btn-text-hover', v.btnText);

        localStorage.setItem('cte_map_theme', currentTheme);
    },

    changeBackground: function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target.result;
                document.getElementById('cte-map-wrapper').style.backgroundImage = `url(${url})`;
                localStorage.setItem('cte_map_bg', url);
            }
            reader.readAsDataURL(input.files[0]);
        }
    },

    savePosition: function(id, left, top) {
        let data = localStorage.getItem('cte_map_positions');
        data = data ? JSON.parse(data) : {};
        data[id] = { left, top };
        localStorage.setItem('cte_map_positions', JSON.stringify(data));
    },

    loadSettings: function() {
        // 恢复位置
        const posData = JSON.parse(localStorage.getItem('cte_map_positions'));
        if (posData) {
            for (const [id, pos] of Object.entries(posData)) {
                const el = document.getElementById(id);
                if (el) { el.style.left = pos.left; el.style.top = pos.top; }
            }
        }
        
        // 恢复背景
        const bg = localStorage.getItem('cte_map_bg');
        if (bg) document.getElementById('cte-map-wrapper').style.backgroundImage = `url(${bg})`;

        // 恢复主题
        const theme = localStorage.getItem('cte_map_theme');
        if (theme) {
            currentTheme = parseInt(theme) - 1; // 设为前一个，然后toggle回到当前
            this.toggleTheme(); 
        }
    }
};

// 等待 ST 就绪
const initInterval = setInterval(() => {
    if (window.SillyTavern && window.SillyTavern.getContext && window.jQuery) {
        clearInterval(initInterval);
        stContext = window.SillyTavern.getContext();
        window.CTEMap.init();
    }
}, 500);
