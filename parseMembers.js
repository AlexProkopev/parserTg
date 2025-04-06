const { Api } = require('telegram');

async function parseMembers(client, chat) {
  try {
    let participants = [];

    try {

      participants = await client.getParticipants(chat.id);
      
      console.log(`🔍 Найдено участников через getParticipants: ${participants.length}`);
      
      const expectedParticipantsCount = 100; 
      if (participants.length < expectedParticipantsCount * 0.8) { 
        console.log("⚠️ Количество участников меньше ожидаемого, переключаемся на парсинг сообщений.");
        throw new Error("Недостаточное количество участников, переключаемся на парсинг сообщений");
      }

    } catch (err) {

      console.error("❌ Ошибка при получении участников:", err.message);
      console.log("❌ Попробуем парсить сообщения.");
      

      participants = await parseMessages(client, chat);
    }

    // Используем Set для уникальности пользователей
    const users = Array.from(new Set(participants.map(user => user.id.toString())))
      .map(id => participants.find(user => user.id.toString() === id))
      .map((user) => ({
        id: user.id.toString(),
        username: user.username || "Не указано",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Без имени",
      }));

    console.log(`🔍 Найдено пользователей: ${users.length}`);
    return users;

  } catch (err) {
    console.error("❌ Ошибка при парсинге участников:", err.message);
    return [];
  }
}

async function parseMessages(client, chat) {
  try {
    let allUsers = new Set(); // Используем Set для уникальных пользователей
    let offsetId = 0; 
    let limit = 50; 

    console.log("🔍 Запуск парсинга сообщений...");

    let messages;
    do {
      messages = await client.getMessages(chat.id, { offsetId, limit });
      if (messages.length > 0) {
        console.log(`🔍 Получено ${messages.length} сообщений`);
      }

      for (let message of messages) {
        if (message.fromId) {
          allUsers.add(message.fromId); // Добавляем уникальный ID пользователя
        }
      }

      if (messages.length > 0) {
        offsetId = messages[messages.length - 1].id;
      }

    } while (messages.length === limit); 

    // Получаем пользователей по их ID
    const users = [];
    for (let userId of allUsers) {
      try {
        const user = await client.getEntity(userId);
        users.push({
          id: user.id.toString(),
          username: user.username || "Не указано",
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Без имени",
        });
      } catch (err) {
        console.error("❌ Ошибка при получении пользователя:", err);
      }
    }

    console.log(`🔍 Найдено пользователей через парсинг сообщений: ${users.length}`);
    return users;

  } catch (err) {
    console.error("❌ Ошибка при парсинге сообщений:", err);
    return [];
  }
}

module.exports = parseMembers;
