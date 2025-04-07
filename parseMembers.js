const parseMessages = require('./parseMessages');
const { Api } = require('telegram');

// Функция для получения общего количества участников
async function getChatParticipantCount(client, chat) {
  const fullChat = await client.invoke(
    new Api.channels.GetFullChannel({
      channel: chat,
    })
  );
  
  return fullChat.fullChat.participantsCount;
}

// Функция для парсинга участников
async function parseMembers(client, chat) {
  try {
    // Получаем общее количество участников чата
    const totalCount = await getChatParticipantCount(client, chat);
    console.log(`Общее количество участников в чате: ${totalCount}`);

    let participants = [];
    try {
      participants = await client.getParticipants(chat.id);
      console.log(`🔍 Найдено участников через getParticipants: ${participants.length}`);
      
      // Если количество участников через getParticipants меньше 20% от общего количества участников
      if (participants.length < totalCount * 0.2) {
        console.warn("⚠️ Участников слишком мало, переключаемся на парсинг сообщений...");
        return await parseMessages(client, chat);
      }
      
      if (participants.length === 0) {
        throw new Error("Участники скрыты или отсутствуют");
      }
    } catch (err) {
      console.warn("⚠️ Не удалось получить участников. Переходим к парсингу сообщений...");
      return await parseMessages(client, chat);
    }

    const users = participants
      .filter(user => !user.bot && !user.admin)
      .map(user => ({
        id: user.id.toString(),
        username: user.username || "Не указано",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Без имени",
      }));

    console.log(`✅ Найдено пользователей: ${users.length}`);
    return users;

  } catch (err) {
    console.error("❌ Ошибка в parseMembers:", err.message);
    return [];
  }
}

module.exports = parseMembers;
