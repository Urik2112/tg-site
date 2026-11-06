// Инициализируем объект Telegram Web App
const tg = window.Telegram.WebApp;

// Сообщаем Telegram, что приложение готово к работе
tg.ready();

// Расширяем приложение на весь экран смартфона
tg.expand();

// Проверяем, доступны ли данные о пользователе, и подставляем его имя
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}

// Навешиваем событие на кнопку
document.getElementById('main-btn').addEventListener('click', () => {
    // Данные, которые мы хотим отправить обратно в бота (например, для обработки)
    const data = {
        message: "Кнопка на сайте успешно нажата!"
    };
    
    // Отправляем данные в виде строки и автоматически закрываем Mini App
    tg.sendData(JSON.stringify(data));
});
