const { Api } = require('telegram');
const parseMembers = require('./parseMembers');

async function joinChat(client, link) {
  try {
    if (!link.includes("+")) {
      console.log("⚠️ Некорректная инвайт-ссылка.");
      return;
    }

    const inviteCode = link.split("/+")[1];
    const result = await client.invoke(new Api.messages.ImportChatInvite({ hash: inviteCode }));
    console.log("✅ Присоединились к чату по инвайт-ссылке.");

    const chat = result.chats[0];
    if (!chat) {
      console.error("❌ Чат не найден в ответе.");
      return;
    }

    console.log("✅ Получена информация о чате.");
    const users = await parseMembers(client, chat);
    users.forEach((user) => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Name: ${user.name}`);
    });

  } catch (err) {
    console.error("❌ Ошибка при присоединении:", err.message);
  }
}

module.exports = joinChat;
