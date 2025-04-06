const connectClient = require("./session"); // Подключение к Telegram API
const joinChat = require("./joinChat"); // Присоединение к чату
const parseMembers = require("./parseMembers"); // Парсинг участников
const input = require("input"); // Ввод с консоли

(async () => {
  try {
    const client = await connectClient();

    const chatLink = await input.text("Вставь ссылку на чат: ");

    if (chatLink.includes("+")) {
      // Если ссылка содержит +, это инвайт-ссылка
      const result = await joinChat(client, chatLink);
      if (result) {
        console.log("✅ Присоединились к чату по инвайт-ссылке.");

        const chat = await client.getEntity(chatLink);
        const members = await parseMembers(client, chat);

        if (members.length > 0) {
          console.log("Участники чата:");
          members.forEach((member) => {
            console.log(`ID: ${member.id}, Username: ${member.username}, Name: ${member.name}`);
          });
        } else {
          console.log("❌ Не удалось получить участников чата.");
        }
      } else {
        console.log("❌ Не удалось присоединиться по инвайт-ссылке.");
      }
    } else {
      // Если это обычная ссылка на чат (без инвайт-ссылки)
      const chatUsername = chatLink.replace("https://t.me/", "");

      try {
        const chat = await client.getEntity(chatUsername);
        const members = await parseMembers(client, chat);

        if (members.length > 0) {
          console.log("Участники чата:");
          members.forEach((member) => {
            console.log(`ID: ${member.id}, Username: ${member.username}, Name: ${member.name}`);
          });
        } else {
          console.log("❌ Не удалось получить участников чата.");
        }
      } catch (err) {
        console.log("❌ Ошибка при получении чата:", err.message);
      }
    }
  } catch (err) {
    console.log("Произошла ошибка:", err.message);
  }
})();
