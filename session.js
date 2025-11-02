const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); 
const config = require('./config'); 

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

    const stringSession = client.session.save();
    console.log("Сессия сохранена: ", stringSession);
    console.log("Скопируйте строку сессии и вставьте в config.js в поле stringSession.");
    return client;
  } catch (error) {
    console.error("❌ Ошибка при авторизации:", error.message);
    process.exit(1);  
  }
}

module.exports = connectClient;
