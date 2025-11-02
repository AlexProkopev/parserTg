const { Api } = require("telegram");
const connectClient = require("./session");
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

    const isInviteLink = chatLink.includes("t.me/+") || chatLink.startsWith("+");
    const chatIdentifier = chatLink
      .replace("https://t.me/+", "")
      .replace("https://t.me/", "")
      .replace("+", "")
      .trim();

    let chat;

    if (isInviteLink) {
      try {
        const inviteInfo = await client.invoke(
          new Api.messages.CheckChatInvite({ hash: chatIdentifier })
        );
      
        if (inviteInfo.className === "ChatInviteAlready") {
          chat = inviteInfo.chat;
          console.log("✅ Уже в чате по инвайт-ссылке.");
        } else if (inviteInfo.className === "ChatInvite") {
          const result = await client.invoke(
            new Api.messages.ImportChatInvite({ hash: chatIdentifier })
          );
          chat = result.chats[0];
          console.log("✅ Присоединились к чату по инвайт-ссылке.");
        } else {
          console.log("❌ Неизвестный ответ от CheckChatInvite:", inviteInfo);
          return;
        }
      } catch (error) {
        console.log("❌ Не удалось обработать инвайт-ссылку:", error.message);
        return;
      }
      
    } else {
      try {
        chat = await client.getEntity(chatIdentifier);
        console.log("✅ Чат найден по username.");
      } catch (err) {
        console.log("❌ Ошибка при получении чата:", err.message);
        return;
      }
    }

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
    console.log("Произошла ошибка:", err.message);
  }
})();
