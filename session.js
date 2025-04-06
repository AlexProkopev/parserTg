const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // Для ввода с консоли
const config = require('./config'); // Импортируем конфигурацию

// Функция для авторизации и создания клиента
async function connectClient() {
  const client = new TelegramClient(new StringSession(config.stringSession), config.apiId, config.apiHash, {
    connectionRetries: 5,
  });

  console.log("⏳ Авторизация...");

  try {
    await client.start({
      phoneNumber: async () => await input.text('Введите номер телефона: '),
      password: async () => await input.text('Введите пароль: '),
      phoneCode: async () => await input.text('Введите код из Telegram: '),
      onError: (err) => console.log('Ошибка при авторизации:', err),
    });

    console.log("✅ Авторизация прошла успешно!");

    // Выводим строку сессии в консоль
    const stringSession = client.session.save();
    console.log("Сессия сохранена: ", stringSession);

    // Вставь полученную строку сессии в файл config.js
    console.log("Скопируйте строку сессии и вставьте в config.js в поле stringSession.");

    return client;
  } catch (error) {
    console.error("❌ Ошибка при авторизации:", error.message);
    process.exit(1);  // Прерываем процесс при ошибке
  }
}

module.exports = connectClient;
