const { Api } = require('telegram');

async function joinChat(client, link) {
  try {
    if (link.includes("+")) {
      const inviteCode = link.split("/+")[1];

      try {
        const chat = await client.getEntity(link);
        
        if (chat) {
          // Пробуем получить участников через getParticipants
          await parseParticipants(client, chat);
        }
      } catch (error) {
        console.log("❌ Чат не найден или мы не в чате.");
      }

      const result = await client.invoke(new Api.messages.ImportChatInvite({
        hash: inviteCode
      }));

      console.log("✅ Присоединились к чату по инвайт-ссылке.");

      if (result.chats && result.chats.length > 0) {
        const chat = result.chats[0]; // Получаем чат
        console.log("✅ Получена информация о чате.");

        // Парсим участников
        await parseParticipants(client, chat);
      } else {
        console.error("❌ Чат не найден в ответе.");
      }
    } else {
      console.log("⚠️ Некорректная инвайт-ссылка.");
    }
  } catch (err) {
    console.error("❌ Ошибка при присоединении:", err);
  }
}

async function parseParticipants(client, chat) {
  try {
    let participants = [];
    
    try {
      // Пытаемся получить список участников чата
      participants = await client.getParticipants(chat.id);

      console.log(`🔍 Найдено участников через getParticipants: ${participants.length}`);
      
      if (participants.length === 0) {
        console.log("❌ Участники скрыты. Переходим к парсингу сообщений.");
        // Если участники скрыты, парсим сообщения
        await parseMessages(client, chat);
        return;
      }
    } catch (err) {
      console.error("❌ Ошибка при получении участников:", err);
      console.log("❌ Не удалось получить участников, пробуем парсить сообщения.");
      // Если getParticipants не удается, парсим сообщения
      await parseMessages(client, chat);
      return;
    }

    // Фильтруем участников (исключаем администраторов и ботов)
    const users = participants.filter((user) => !user.bot && !user.admin).map((user) => ({
      id: user.id.toString(),
      username: user.username || "Не указано",
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Без имени",
    }));

    console.log(`🔍 Найдено пользователей (не администраторов и не ботов): ${users.length}`);
    users.forEach((user) => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Name: ${user.name}`);
    });

  } catch (err) {
    console.error("❌ Ошибка при парсинге участников:", err);
  }
}

// Метод для парсинга сообщений чата и извлечения пользователей
async function parseMessages(client, chat) {
  try {
    let allUsers = new Set(); // Используем Set для уникальных пользователей
    let offsetId = 0; // Начальный offset для получения сообщений
    let limit = 100; // Получаем по 100 сообщений за раз

    // Запрашиваем сообщения по пачкам
    let messages;
    do {
      messages = await client.getMessages(chat.id, { offsetId, limit });
      for (let message of messages) {
        // Проверяем автора сообщения, если есть
        if (message.fromId) {
          allUsers.add(message.fromId); // Добавляем уникальный ID пользователя
        }
      }

      // Обновляем offsetId для следующего запроса сообщений
      offsetId = messages[messages.length - 1].id;

    } while (messages.length === limit); // Продолжаем до тех пор, пока не получим меньше сообщений, чем лимит

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

    console.log(`🔍 Найдено пользователей: ${users.length}`);
    users.forEach((user) => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Name: ${user.name}`);
    });

  } catch (err) {
    console.error("❌ Ошибка при парсинге сообщений:", err);
  }
}

module.exports = joinChat;
