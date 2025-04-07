const connectClient = require("./session"); 
const joinChat = require("./joinChat"); 
const parseMembers = require("./parseMembers"); 
const input = require("input");

(async () => {
  try {
    const client = await connectClient();

    const chatLink = await input.text("Вставь ссылку на чат: ");
    if (!chatLink.includes("t.me/") && !chatLink.startsWith("+")) {
      console.log("❌ Неверная ссылка. Вставь ссылку вида https://t.me/имя_чата или инвайт.");
      return;
    }
    if (chatLink.includes("+")) {
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
