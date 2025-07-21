import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on("ready", () => {
  console.log(`Bot conectado como ${client.user?.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "!hola") {
    message.reply("¡Hola! Estoy aquí contigo 👋");
  }

  if (message.content === "!join") {
    if (!message.member?.voice.channel) {
      message.reply("¡Tienes que estar en un canal de voz!");
      return;
    }

    joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild!.id,
      adapterCreator: message.guild!.voiceAdapterCreator,
    });

    message.reply("¡Ya estoy en el canal de voz contigo! 🎤");
  }
});

client.login(process.env.BOT3_TOKEN);
