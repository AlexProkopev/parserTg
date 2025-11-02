const { Api } = require('telegram');
const fs = require('fs');
const path = require('path');

async function parseMessages(client, chat) {
  try {
    let allUsers = new Map(); 
    let offsetId = 0;
    let limit = 50;
    let totalMessages = 0;
    const maxMessages = 1000; 

    console.log("🔍 Запуск парсинга сообщений...");

    let messages;
    do {
      // Получаем сообщения
      messages = await client.getMessages(chat.id, { offsetId, limit });

      if (messages.length > 0) {
        console.log(`🔍 Получено ${messages.length} сообщений`);
        offsetId = messages[messages.length - 1].id;
        totalMessages += messages.length;

        // Если обработано уже 25 000 сообщений, выходим
        if (totalMessages >= maxMessages) {
          console.log(`🔍 Достигнуто максимальное количество сообщений (${maxMessages}). Останавливаем парсинг.`);
          break;
        }
      }

      for (let message of messages) {
        if (message.fromId?.userId) {
          allUsers.set(message.fromId.userId, message.fromId.userId);
        }
      }

    } while (messages.length === limit);

    // Переводим Map в массив пользователей
    const users = [];
    for (let userId of allUsers.keys()) {
      try {
        const user = await client.getEntity(userId);
        users.push({
          id: user.id.toString(),
          username: user.username ? `@${user.username}` : "Не указано",
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Без имени",
        });
      } catch (err) {
        console.error("❌ Ошибка при получении пользователя:", err.message);
        
        // Проверка на ограничение и ожидание
        if (err.message.includes('A wait of')) {
          const waitTime = parseInt(err.message.split(' ')[3], 10) * 1000; // Получаем время ожидания
          console.log(`⚠️ Требуется подождать ${waitTime / 1000} секунд...`);
          await new Promise(res => setTimeout(res, waitTime)); // Ожидаем перед следующим запросом
          continue; // Пробуем снова
        }
      }
    }

    console.log(`🔍 Найдено уникальных пользователей через сообщения: ${users.length}`);
    
    // Сохраняем результаты в файл
    const usersWithUsername = users.filter(user => user.username !== "Не указано");
    if (usersWithUsername.length > 0) {
      const folder = path.join(__dirname, 'results');
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(folder, `messages_${timestamp}.txt`);
      
      const fileContent = usersWithUsername.map(u => `${u.username}`).join('\n');
      fs.writeFileSync(filename, fileContent, 'utf8');

      console.log(`📁 Сохранено в файл: ${filename}`);
    }
    
    return users;

  } catch (err) {
    console.error("❌ Ошибка при парсинге сообщений:", err.message);
    return [];
  }
}

module.exports = parseMessages;
