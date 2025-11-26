const extensionName = "CTE_Map";
const extensionPath = `scripts/extensions/third-party/${extensionName}`;

let stContext = null;

// 定义全局命名空间
window.CTEMap = {
    currentDestination: '',
    roomDetails: {
        // --- 一层 ---
        '前院': '设有景观花园及访客通道，作为基地门面区域。',
        '接待区': '位于入口处，用于接待访客、粉丝或媒体。',
        '休息厅': '宽敞明亮，配备沙发、电视及娱乐设施，供队员与访客休憩。',
        '厨房餐厅': '开放式布局设计，便于队员用餐交流。',
        '储物室': '存放清洁工具及日常杂物。',
        '洗衣房': '供队员及工作人员洗涤衣物。',
        '医务室': '配备基础医疗设施，处理日常轻微伤痛或身体不适。',
        '一层储物区': '供队员及工作人员存放个人物品。',
        '后院': '设有小型花园、休闲区及户外泳池，供队员锻炼放松，亦可举办户外活动。',
        
        // --- 二层 ---
        '采访室': '用于媒体采访或宣传视频录制。',
        '直播间': '配备隔音墙体，供队员或官员进行直播。',
        '内容创作工作室': '专为拍摄及剪辑队伍日常视频或宣传素材设计。',
        '教练与分析师办公室': '每位教练及分析师均设独立办公室，便于专注战术研究。',
        '经理办公室': '位于楼梯旁，便于处理日常事务及接待外部人员。',
        '档案室': '集中存储球队历史资料、比赛录像及重要文件。',
        '观赛区': '配备大屏幕及观众席，供队员与嘉宾观看比赛或复盘赛事。',
        
        // --- 三层 ---
        '主训练室': '日常团队训练与赛前备战的核心区域。',
        '副训练室': '供替补队员或青年训练队成员练习使用。',
        '战术会议室': '毗邻主训练室，便于战术研讨与赛后分析。',
        '球员休息室': '配备舒适沙发及娱乐设施，是队员放松的主要场所。',
        
        // --- 四层 ---
        '健身房': '宽敞区域配备各类健身器材供队员锻炼。',
        '瑜伽室': '安静私密，适合拉伸、冥想及身体恢复。',
        '按摩理疗室': '供队员赛后放松恢复。',
        
        // --- 五层 ---
        '球员宿舍': '每位球员拥有独立带卫浴的单间。',
        '其他宿舍': '教练、分析师及助理人员均配有独立宿舍，环境静谧利于休养。',
        '五层公共休憩区': '供楼层住户交流放松。',
        
        // --- 顶楼 ---
        '露台咖啡厅': '设有露天座位与绿植景观，队员及宾客可在此休憩社交，同时俯瞰城市风光。',
        '屋顶花园': '栽种各类花卉植物，营造自然氛围。',

        // --- 万达广场内部 ---
        'CGV影城': '万达广场内的电影院，设备一流。',
        '海底捞火锅': '团队聚餐热门选择，服务周到。',
        '电玩城': '万达广场内的游戏厅，魏星泽与鹿言常光顾。',
        '星光书店': '设有电竞文化专区与咖啡阅读区，环境优雅。',
        '星空天台酒吧': '位于顶层，拥有绝佳夜景的露天酒吧。',
        '潮玩集合店': '主营手办、盲盒及潮流玩具，队员常来寻觅独特藏品。',

        // --- 百步街/小吃街内部 ---
        '老张文具店': '百步街上的小型文具店，充满怀旧气息。',
        '老王烧烤': '小吃街上的知名烧烤摊，味道一绝。',
        '糖葫芦摊': '传统糖渍山楂，酸甜可口。',
        '麻辣烫小店': '自助式麻辣烫，食材新鲜。',
    }
};

const initInterval = setInterval(() => {
    if (window.SillyTavern && window.SillyTavern.getContext && window.jQuery) {
        clearInterval(initInterval);
        stContext = window.SillyTavern.getContext();
        initializeExtension();
    }
}, 500);

async function initializeExtension() {
    console.log("[CTE Map] Initializing...");

    $('#cte-map-panel').remove();
    $('#cte-toggle-btn').remove();
    $('link[href*="CTE_Map/style.css"]').remove();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${extensionPath}/style.css`;
    document.head.appendChild(link);

    const panelHTML = `
        <div id="cte-toggle-btn" title="打开 CTE 地图" 
             style="position:fixed; top:130px; left:10px; z-index:9000; width:40px; height:40px; background:#b38b59; border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3); color:#fff; font-size:20px;">
            🗺️
        </div>
        <div id="cte-map-panel">
            <div id="cte-drag-handle">
                <span>CTE 区域地图</span>
                <span id="cte-close-btn">❌</span>
            </div>
            <div id="cte-content-area">Loading Map...</div>
        </div>
    `;
    $('body').append(panelHTML);

    try {
        const response = await fetch(`${extensionPath}/map.html`);
        if (!response.ok) throw new Error("Map file not found");
        const htmlContent = await response.text();
        $('#cte-content-area').html(htmlContent);
        
        bindMapEvents();
        loadSavedPositions();
        loadSavedBg();

    } catch (e) {
        console.error("[CTE Map] Error:", e);
        $('#cte-content-area').html(`<p style="padding:20px; color:white;">无法加载地图文件 (map.html)。<br>请检查控制台获取详细错误。</p>`);
    }

    $('#cte-toggle-btn').on('click', () => $('#cte-map-panel').fadeToggle());
    $('#cte-close-btn').on('click', () => $('#cte-map-panel').fadeOut());

    if ($.fn.draggable) {
        $('#cte-map-panel').draggable({ 
            handle: '#cte-drag-handle',
            containment: 'window'
        });
    }
}

function bindMapEvents() {
    const mapContainer = document.getElementById('cte-map-container');
    if (!mapContainer) return;
    
    const locations = mapContainer.querySelectorAll('.location');
    
    locations.forEach(elm => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        let hasMoved = false;

        elm.onmousedown = function(e) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            hasMoved = false;
            elm.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = elm.offsetLeft;
            initialTop = elm.offsetTop;

            document.onmousemove = function(e) {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;
                
                newLeft = Math.max(0, Math.min(newLeft, mapContainer.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, mapContainer.offsetHeight));

                elm.style.left = newLeft + 'px';
                elm.style.top = newTop + 'px';
            };

            document.onmouseup = function() {
                isDragging = false;
                elm.classList.remove('dragging');
                document.onmousemove = null;
                document.onmouseup = null;

                if (!hasMoved) {
                    const popupId = elm.getAttribute('data-popup');
                    if (popupId) window.CTEMap.showPopup(popupId);
                } else {
                    savePosition(elm.id, elm.style.left, elm.style.top);
                }
            };
        };
    });
}

function savePosition(id, left, top) {
    let data = localStorage.getItem('cte_map_positions');
    data = data ? JSON.parse(data) : {};
    data[id] = { left, top };
    localStorage.setItem('cte_map_positions', JSON.stringify(data));
}

function loadSavedPositions() {
    const data = JSON.parse(localStorage.getItem('cte_map_positions'));
    if (!data) return;
    for (const [id, pos] of Object.entries(data)) {
        const el = document.getElementById(id);
        if (el) {
            el.style.left = pos.left;
            el.style.top = pos.top;
        }
    }
}

function loadSavedBg() {
    const bg = localStorage.getItem('cte_map_bg');
    if (bg) {
        document.getElementById('cte-map-container').style.backgroundImage = `url(${bg})`;
    }
}

window.CTEMap.changeBackground = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('cte-map-container').style.backgroundImage = `url(${e.target.result})`;
            localStorage.setItem('cte_map_bg', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
};

window.CTEMap.showPopup = function(id) {
    if (id === 'cte-internal-popup') window.CTEMap.closeAllPopups();
    
    const popup = document.querySelector(`#cte-map-panel #${id}`);
    const overlay = document.querySelector(`#cte-map-panel #cte-overlay`);
    
    if (popup) {
        if (overlay) overlay.style.display = 'block';
        popup.style.display = 'block';
        popup.scrollTop = 0;
    }
};

window.CTEMap.closeAllPopups = function() {
    $('#cte-map-panel #cte-overlay').hide();
    $('#cte-map-panel .cte-popup').hide();
    window.CTEMap.closeSubMenu();
    window.CTEMap.closeTravelMenu();
};

window.CTEMap.openTravelMenu = function(destination) {
    window.CTEMap.currentDestination = destination;
    const box = $('#travel-menu-overlay');
    box.find('.travel-options').html(`
        <button class="cte-btn" onclick="window.CTEMap.confirmTravel(true)">👤 独自前往</button>
        <button class="cte-btn" onclick="window.CTEMap.showCompanionInput()">👥 和……一起前往</button>
        <button class="cte-btn" style="margin-top: 10px; border-color: #666; color: #888;" onclick="window.CTEMap.closeTravelMenu()">关闭</button>
    `);
    box.css('display', 'flex');
};

window.CTEMap.showCompanionInput = function() {
    $('#travel-menu-overlay .travel-options').html(`
        <p style="color: #888; margin: 0 0 10px 0;">和谁一起去？</p>
        <input type="text" id="companion-name" class="travel-input" placeholder="输入角色姓名">
        <button class="cte-btn" onclick="window.CTEMap.confirmTravel(false)">🤝 一起前往</button>
        <button class="cte-btn" style="margin-top: 10px; border-color: #666; color: #888;" onclick="window.CTEMap.openTravelMenu('${window.CTEMap.currentDestination}')">返回</button>
    `);
};

window.CTEMap.closeTravelMenu = function() {
    $('#travel-menu-overlay').hide();
};

window.CTEMap.goToCustomDestination = function() {
    const val = $('#custom-destination-input').val();
    if (val) {
        window.CTEMap.closeAllPopups();
        window.CTEMap.openTravelMenu(val);
    } else {
        alert('请输入地点名称');
    }
};

window.CTEMap.confirmTravel = function(isAlone) {
    const dest = window.CTEMap.currentDestination;
    let text = "";
    
    if (isAlone) {
        text = `{{user}} 决定独自前往${dest}。`;
    } else {
        const name = $('#companion-name').val();
        if (!name) return alert("请输入姓名");
        text = `{{user}} 邀请 ${name} 一起前往${dest}。`;
    }
    
    if (stContext) {
        stContext.executeSlashCommandsWithOptions(`/setinput ${text}`);
        window.CTEMap.closeAllPopups();
    }
};

window.CTEMap.openSubMenu = function(title, items) {
    const overlay = document.getElementById('interior-sub-menu');
    
    if (title !== '顶楼：休闲景观区' && !title.includes('层') && document.getElementById('wanda-plaza-popup').style.display !== 'none') {
        const currentPopup = document.querySelector('.cte-popup[style*="block"]');
        let container = currentPopup.querySelector('.sub-list-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'sub-list-container';
            container.style.marginTop = '15px';
            container.style.display = 'flex';
            container.style.flexWrap = 'wrap';
            container.style.gap = '8px';
            container.style.justifyContent = 'center';
            currentPopup.appendChild(container);
        }
        container.innerHTML = '';
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'cte-btn';
            btn.style.fontSize = '12px';
            btn.innerText = item;
            btn.onclick = () => window.CTEMap.openThirdLevelMenu(item, title, items); 
            container.appendChild(btn);
        });
        return;
    }

    const titleEl = document.getElementById('sub-menu-title');
    const contentEl = document.getElementById('sub-menu-content');
    
    if (titleEl && contentEl) {
        titleEl.textContent = title;
        contentEl.innerHTML = '';
        
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'sub-item-btn';
            btn.textContent = item;
            btn.onclick = () => window.CTEMap.openThirdLevelMenu(item, title, items);
            contentEl.appendChild(btn);
        });
        
        if (overlay) overlay.style.display = 'flex';
    }
};

window.CTEMap.closeSubMenu = function() {
    $('#interior-sub-menu').hide();
};

window.CTEMap.openThirdLevelMenu = function(roomName, floorTitle, floorItems) {
    const existingOverlay = document.getElementById('interior-sub-menu');
    const isExternal = (existingOverlay && existingOverlay.style.display === 'none');

    if (isExternal) {
        const box = $('#travel-menu-overlay');
        const desc = window.CTEMap.roomDetails[roomName] || "暂无详细介绍。";
        box.find('.travel-options').html(`
            <h3 style="color:#e0c5a1; margin-top:0;">${roomName}</h3>
            <p style="color:#dcdcdc; font-size:14px; margin-bottom:15px;">${desc}</p>
            <button class="cte-btn" onclick="window.CTEMap.openTravelMenu('${roomName}')">🚀 前往这里</button>
            <button class="cte-btn" style="margin-top: 10px; border-color: #666; color: #888;" onclick="window.CTEMap.closeTravelMenu()">关闭</button>
        `);
        box.css('display', 'flex');
        return;
    }

    const titleEl = document.getElementById('sub-menu-title');
    const contentEl = document.getElementById('sub-menu-content');
    
    titleEl.textContent = roomName;
    const desc = window.CTEMap.roomDetails[roomName] || "暂无详细介绍。";
    
    contentEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%;">
            <p style="text-align:justify; font-size:14px; line-height:1.6;">${desc}</p>
            <button class="cte-btn" onclick="window.CTEMap.openTravelMenu('${roomName}')">🚀 前往</button>
            <button class="sub-item-btn" id="temp-back-btn">[ < 返回上一级 ]</button>
        </div>
    `;
    
    document.getElementById('temp-back-btn').onclick = () => window.CTEMap.openSubMenu(floorTitle, floorItems);
};