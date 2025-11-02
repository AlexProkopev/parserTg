const fs = require('fs');
const path = require('path');
const parseMessages = require('./parseMessages');
const { Api } = require('telegram');

async function getChatParticipantCount(client, chat) {
  const fullChat = await client.invoke(
    new Api.channels.GetFullChannel({
      channel: chat,
    })
  );
  
  return fullChat.fullChat.participantsCount;
}

async function parseMembers(client, chat) {
  try {
    const totalCount = await getChatParticipantCount(client, chat);
    console.log(`Общее количество участников в чате: ${totalCount}`);

    let participants = [];
    try {
      participants = await client.getParticipants(chat.id);
      console.log(`🔍 Найдено участников через getParticipants: ${participants.length}`);

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
      .filter(user => user.username && !user.bot && !user.admin)
      .map(user => ({
        username: `@${user.username}`,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Без имени",
      }));

    console.log(`✅ Пользователей с username: ${users.length}`);

    const folder = path.join(__dirname, 'results');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(folder, `${chat.username || chat.id}_${timestamp}.txt`);
    
    const fileContent = users.map(u => `${u.username}`).join('\n');
    fs.writeFileSync(filename, fileContent, 'utf8');

    console.log(`📁 Сохранено в файл: ${filename}`);
    return users;

  } catch (err) {
    console.error("❌ Ошибка в parseMembers:", err.message);
    return [];
  }
}

module.exports = parseMembers;
