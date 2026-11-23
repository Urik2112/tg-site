const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'sb_publishable_T-9Yrgl3fHMvua82YTvgVw__QWlEzFl';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    document.getElementById('profile-name').innerText = tg.initDataUnsafe.user.first_name;
}

let ads = [];
let currentCategory = 'all';
let currentType = 'all';
let searchQuery = '';

async function loadAds() {
    document.getElementById('items-count').innerText = 'Загрузка...';
    const { data, error } = await db.from('ads').select('*').order('id', { ascending: false });
    if (error) {
        console.error('Ошибка загрузки:', error);
        document.getElementById('items-count').innerText = 'Ошибка базы';
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
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        alert(`Вы открыли чат по объявлению «${ad.title}»!`);
        document.getElementById('item-modal').classList.remove('open');
        switchTab('screen-chats');
    };
    document.getElementById('item-modal').classList.add('open');
}

document.getElementById('close-item-modal').onclick = () => {
    document.getElementById('item-modal').classList.remove('open');
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

document.getElementById('open-create-btn').onclick = () => {
    document.getElementById('create-modal').classList.add('open');
};
document.getElementById('close-create-modal').onclick = () => {
    document.getElementById('create-modal').classList.remove('open');
};

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

loadAds();
