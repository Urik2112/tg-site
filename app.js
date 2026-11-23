const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const SUPABASE_URL = 'https://' + 'zhakfkqqurjlqdthsnhz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_T-9Yrgl3fHMvua82YTvgVw__QWlEzFl';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    document.getElementById('profile-name').innerText = tg.initDataUnsafe.user.first_name;
}

let ads = [];
let currentCategory = 'all';
let currentType = 'all';
let searchQuery = '';

// В списке чатов осталась только Техподдержка
let chats = [
    { id: 'support', name: 'Техподдержка', icon: '🎧', color: '#2481cc', messages: [{ from: 'them', text: 'Напишите сюда, если возникнут вопросы по сделкам.' }] }
];
let activeChatId = null;

async function loadAds() {
    document.getElementById('items-count').innerText = 'Загрузка...';
    const { data, error } = await db.from('ads').select('*').order('id', { ascending: false });
    if (error) {
        document.getElementById('items-count').innerText = 'Ошибка: ' + error.message;
        return;
    }
    ads = data || [];
    renderAds();
}

function renderAds() {
    const grid = document.getElementById('ads-grid');
    grid.innerHTML = '';
    const filtered = ads.filter(ad => {
        const matchCat = currentCategory === 'all' || ad.category === currentCategory;
        const matchType = currentType === 'all' || ad.type === currentType;
        const matchSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchType && matchSearch;
    });
    document.getElementById('items-count').innerText = `Найдено: ${filtered.length}`;
    filtered.forEach(ad => {
        const card = document.createElement('div');
        card.className = 'ad-card';
        card.innerHTML = `
            <div class="ad-img">${ad.icon || '📦'}</div>
            <div class="ad-body">
                <div class="ad-title">${ad.title}</div>
                <div class="ad-sub">${ad.type} • ${ad.category}</div>
                <div class="ad-price">${Number(ad.price).toLocaleString('ru-RU')} ₽</div>
            </div>
        `;
        card.onclick = () => openItemModal(ad);
        grid.appendChild(card);
    });
}

function openItemModal(ad) {
    document.getElementById('modal-img').innerText = ad.icon || '📦';
    document.getElementById('modal-type').innerText = ad.type;
    document.getElementById('modal-title').innerText = ad.title;
    document.getElementById('modal-price').innerText = `${Number(ad.price).toLocaleString('ru-RU')} ₽`;
    document.getElementById('modal-meta').innerText = `СЕРВЕР 8 / ${ad.category.toUpperCase()}`;
    document.getElementById('modal-desc').innerText = ad.desc;
    
    document.getElementById('modal-contact-btn').onclick = () => {
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        document.getElementById('item-modal').classList.remove('open');
        
        const chatId = 'ad_' + ad.id;
        let existing = chats.find(c => c.id === chatId);
        if (!existing) {
            existing = {
                id: chatId,
                name: `${ad.title} (${Number(ad.price).toLocaleString('ru-RU')} ₽)`,
                icon: ad.icon || '💬',
                color: '#7b42f6',
                messages: [{ from: 'them', text: `Здравствуйте! Объявление «${ad.title}» ещё актуально.` }]
            };
            chats.unshift(existing);
        }
        renderChats();
        switchTab('screen-chats');
        openChatRoom(chatId);
    };
    document.getElementById('item-modal').classList.add('open');
}

document.getElementById('close-item-modal').onclick = () => document.getElementById('item-modal').classList.remove('open');

function renderChats() {
    const list = document.getElementById('chat-list');
    list.innerHTML = '';
    chats.forEach(chat => {
        const lastMsg = chat.messages[chat.messages.length - 1]?.text || '';
        const item = document.createElement('div');
        item.className = 'chat-item';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div class="chat-avatar" style="background: ${chat.color};">${chat.icon}</div>
            <div class="chat-info">
                <div class="chat-top">
                    <strong>${chat.name}</strong>
                    <span>Сейчас</span>
                </div>
                <p>${lastMsg}</p>
            </div>
        `;
        item.onclick = () => openChatRoom(chat.id);
        list.appendChild(item);
    });
}

function openChatRoom(chatId) {
    activeChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    document.getElementById('chat-room-title').innerText = chat.name;
    renderMessages();
    document.getElementById('chat-room-modal').classList.add('open');
}

function renderMessages() {
    const chat = chats.find(c => c.id === activeChatId);
    const box = document.getElementById('chat-messages');
    box.innerHTML = '';
    chat.messages.forEach(m => {
        const div = document.createElement('div');
        div.style.padding = '10px 14px';
        div.style.borderRadius = '14px';
        div.style.maxWidth = '80%';
        div.style.fontSize = '15px';
        if (m.from === 'me') {
            div.style.background = '#7b42f6';
            div.style.alignSelf = 'flex-end';
        } else {
            div.style.background = '#272044';
            div.style.alignSelf = 'flex-start';
        }
        div.innerText = m.text;
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
}

document.getElementById('send-chat-msg').onclick = () => {
    const input = document.getElementById('chat-msg-input');
    const text = input.value.trim();
    if (!text || !activeChatId) return;
    const chat = chats.find(c => c.id === activeChatId);
    chat.messages.push({ from: 'me', text });
    input.value = '';
    renderMessages();
    renderChats();
};

document.getElementById('close-chat-room').onclick = () => {
    document.getElementById('chat-room-modal').classList.remove('open');
};

document.querySelectorAll('.cat-item').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.cat-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        renderAds();
    };
});

document.querySelectorAll('.pill').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
        renderAds();
    };
});

document.getElementById('search-input').oninput = (e) => {
    searchQuery = e.target.value;
    renderAds();
};

document.getElementById('open-create-btn').onclick = () => document.getElementById('create-modal').classList.add('open');
document.getElementById('close-create-modal').onclick = () => document.getElementById('create-modal').classList.remove('open');

document.getElementById('submit-ad-btn').onclick = async () => {
    const btn = document.getElementById('submit-ad-btn');
    const title = document.getElementById('new-title').value.trim();
    const price = parseInt(document.getElementById('new-price').value);
    const type = document.getElementById('new-type').value;
    const category = document.getElementById('new-cat').value;
    const desc = document.getElementById('new-desc').value.trim() || 'Без описания';

    if (!title || !price) return alert('Укажите название и цену!');

    btn.disabled = true;
    btn.innerText = 'Публикация...';

    const icons = { 'Авто': '🚘', 'Скины': '🧥', 'Недвижка': '🏠' };
    const { error } = await db.from('ads').insert([
        { title, type, category, price, icon: icons[category], desc }
    ]);

    btn.disabled = false;
    btn.innerText = 'Опубликовать';

    if (error) {
        alert('Ошибка при публикации: ' + error.message);
        return;
    }

    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    document.getElementById('create-modal').classList.remove('open');
    document.getElementById('new-title').value = '';
    document.getElementById('new-price').value = '';
    document.getElementById('new-desc').value = '';
    loadAds();
};

function switchTab(targetId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.target);
});

renderChats();
loadAds();
