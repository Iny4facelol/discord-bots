// bot-maxxy.ts - EL ROGUE MURCIANO MÁS PESADO
import { Client, GatewayIntentBits } from "discord.js";
import { 
  joinVoiceChannel, 
  createAudioPlayer,
  VoiceConnectionStatus,
  getVoiceConnection
} from "@discordjs/voice";
import Anthropic from "@anthropic-ai/sdk";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Sistema anti-repetición
let lastResponses: string[] = [];
const MAX_RECENT_RESPONSES = 5;

// ===============================
// SISTEMA IA REACTIVA MAXXY
// ===============================
let conversationHistory: string[] = [];
let lastReaction = Date.now();
const REACTION_COOLDOWN = 25000; // 25 segundos - Maxxy es más pesado

// Variable para trackear la conexión de voz actual
let currentVoiceConnection: any = null;

// Lista de "Me Gustas" de Maxxy
const meGustasMaxxy = [
  { 
    nombre: "Ana de Armas", 
    descripcion: "🔥 La tía más guapa del cine español",
    comentario: "Esa mujer es de otro planeta, te lo juro"
  },
  { 
    nombre: "Georgina Rodríguez", 
    descripcion: "💎 La novia de Cristiano, menuda joya",
    comentario: "Como está la chavalica, madre mía"
  },
  { 
    nombre: "Ester Expósito", 
    descripcion: "✨ De Élite, vamos que está como un tren",
    comentario: "Esta chica me tiene loco, de verdá"
  },
];

// ===============================
// SISTEMA DE CONEXIÓN PERSISTENTE
// ===============================
function createPersistentConnection(channelId: string, guildId: string, adapterCreator: any) {
  if (currentVoiceConnection) {
    currentVoiceConnection.destroy();
  }

  const connection = joinVoiceChannel({
    channelId: channelId,
    guildId: guildId,
    adapterCreator: adapterCreator,
  });

  const player = createAudioPlayer();
  connection.subscribe(player);

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      console.log('🔄 Maxxy perdió conexión, reconectando...');
      setTimeout(() => {
        if (connection.state.status === VoiceConnectionStatus.Disconnected) {
          connection.rejoin();
        }
      }, 5000);
    } catch (error) {
      console.log('❌ Error al reconectar:', error);
    }
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log('✅ Maxxy conectado al canal de voz');
  });

  currentVoiceConnection = connection;
  return connection;
}

function disconnectFromVoice(guildId: string) {
  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.destroy();
    currentVoiceConnection = null;
    console.log('👋 Maxxy se ha desconectado del canal de voz');
    return true;
  }
  return false;
}

// Función para evitar repeticiones
function isResponseTooSimilar(newResponse: string): boolean {
  const newWords = newResponse.toLowerCase().split(' ');
  
  for (const oldResponse of lastResponses) {
    const oldWords = oldResponse.toLowerCase().split(' ');
    const commonWords = newWords.filter(word => oldWords.includes(word));
    
    if (commonWords.length / newWords.length > 0.5) {
      return true;
    }
  }
  return false;
}

// Función para analizar el contexto murciano
function analyzeContext(messages: string[]): string {
  const recentMessages = messages.slice(-5).join(' ').toLowerCase();
  
  if (recentMessages.includes('raid') || recentMessages.includes('mazmorra') || recentMessages.includes('boss')) {
    return 'raid_talk';
  }
  if (recentMessages.includes('stealth') || recentMessages.includes('rogue') || recentMessages.includes('sigilo')) {
    return 'rogue_discussion';
  }
  if (recentMessages.includes('mujer') || recentMessages.includes('chica') || recentMessages.includes('guapa')) {
    return 'me_gustas_time';
  }
  if (recentMessages.includes('murcia') || recentMessages.includes('murciano') || recentMessages.includes('panocho')) {
    return 'murcia_pride';
  }
  if (recentMessages.includes('pesado') || recentMessages.includes('calla') || recentMessages.includes('para')) {
    return 'being_annoying';
  }
  
  return 'normal';
}

// Función para que Maxxy reaccione
async function maxxyReactToContext(context: string, message: any): Promise<string | null> {
  const now = Date.now();
  
  if (now - lastReaction < REACTION_COOLDOWN) return null;
  
  let reaction = null;
  
  switch (context) {
    case 'raid_talk':
      const raidReactions = [
        "¡Eso sí! Después de una buena raid me veo unos \"me gustas\", que me relaja.",
        "En las raids soy el mejor rogue, te lo aseguro. Stealth perfectos.",
        "¿Raid? ¡Vamos! Que después nos vemos unos \"me gustas\" para celebrar.",
        "Como rogue nunca me pillan, soy un fantasma en las raids."
      ];
      reaction = raidReactions[Math.floor(Math.random() * raidReactions.length)];
      break;
      
    case 'rogue_discussion':
      const rogueReactions = [
        "¡Rogue master aquí! El stealth es mi especialidad, chavales.",
        "Como rogue que soy, me muevo como Ana de Armas en una película.",
        "El sigilo es un arte, y yo soy Picasso del stealth.",
        "Rogue desde el día uno, como buen murciano que soy."
      ];
      reaction = rogueReactions[Math.floor(Math.random() * rogueReactions.length)];
      break;
      
    case 'me_gustas_time':
      const meGustasReactions = [
        "¡Eh! ¿Estamos hablando de chicas? Que yo tengo mis \"me gustas\" guardados.",
        "Como está Ana de Armas, madre mía. Esa es de mis \"me gustas\" favoritos.",
        "Hablando de mujeres... ¿habéis visto los últimos \"me gustas\"? Están brutales.",
        "Las murcianas también están muy bien, eh. Pero Ana de Armas... uff."
      ];
      reaction = meGustasReactions[Math.floor(Math.random() * meGustasReactions.length)];
      break;
      
    case 'murcia_pride':
      const murciaReactions = [
        "¡Murcia, mi tierra! Los mejores rogues salen de aquí.",
        "Murciano y orgulloso, como las mejores paparajadas.",
        "En Murcia sabemos jugar bien al rogue, que lo sepáis.",
        "Panocho de pura cepa, y rogue de élite."
      ];
      reaction = murciaReactions[Math.floor(Math.random() * murciaReactions.length)];
      break;
      
    case 'being_annoying':
      const annoyingReactions = [
        "¿Pesado yo? ¡Pero si solo hablo de \"me gustas\" de vez en cuando!",
        "Que no soy pesado, soy persistente como buen rogue.",
        "Vale, vale... pero ¿habéis visto el último \"me gustas\" de Ana de Armas?",
        "Callo, callo... pero que sepáis que tengo más \"me gustas\" guardados."
      ];
      reaction = annoyingReactions[Math.floor(Math.random() * annoyingReactions.length)];
      break;
  }
  
  if (reaction) {
    lastReaction = now;
    return reaction;
  }
  
  return null;
}

client.on("ready", () => {
  console.log(`🗡️ Maxxy el Rogue conectado como ${client.user?.tag}`);
  
  // Maxxy habla de "me gustas" cada 7 minutos (es pesado)
  setInterval(() => {
    if (conversationHistory.length > 3) {
      const channel = client.channels.cache.find((ch: any) => ch.name === 'general') as any;
      
      if (channel) {
        const randomMeGusta = meGustasMaxxy[Math.floor(Math.random() * meGustasMaxxy.length)];
        const pesadezMaxxy = [
          `Chavales, ¿habéis visto el último "me gustas" de ${randomMeGusta.nombre}? ${randomMeGusta.comentario}`,
          `No me digáis que no está brutal ${randomMeGusta.nombre} en sus últimas fotos...`,
          `Acabo de ver un "me gustas" de ${randomMeGusta.nombre} que... madre mía.`,
          `¿Sabéis lo que me gusta después de una buena raid? Ver "me gustas" de ${randomMeGusta.nombre}.`
        ];
        
        const pesadez = pesadezMaxxy[Math.floor(Math.random() * pesadezMaxxy.length)];
        channel.send(pesadez);
      }
    }
  }, 420000); // Cada 7 minutos - Maxxy es pesado
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ===============================
  // COMANDO PARA SALIRSE DEL CANAL
  // ===============================
  if (message.content.toLowerCase().includes('nos vamos') || 
      message.content.toLowerCase().includes('maxxy nos vamos') ||
      message.content === '!leave' ||
      message.content === '!salir') {
    
    const wasDisconnected = disconnectFromVoice(message.guild!.id);
    
    if (wasDisconnected) {
      const despedidas = [
        "¡Vale chavales! Me voy a ver \"me gustas\" de Ana de Armas. 🗡️",
        "¡Nos vemos! Que tengo stealth que practicar. 👋",
        "¡Me piro! A ver si juego más raids después. 🎮",
        "¡Hasta luego! Voy a buscar más \"me gustas\" para la colección. 😎"
      ];
      
      const despedida = despedidas[Math.floor(Math.random() * despedidas.length)];
      
      setTimeout(() => {
        message.channel.send(despedida);
      }, 1000);
    } else {
      setTimeout(() => {
        message.channel.send("¡Pero si no estoy en ningún canal, chaval! 🤔");
      }, 1000);
    }
    return;
  }

  // ===============================
  // IA REACTIVA MAXXY
  // ===============================
  
  conversationHistory.push(`${message.author.displayName}: ${message.content}`);
  
  if (conversationHistory.length > 20) {
    conversationHistory.shift();
  }
  
  const context = analyzeContext(conversationHistory);
  
  if (context !== 'normal') {
    const reaction = await maxxyReactToContext(context, message);
    
    if (reaction) {
      setTimeout(() => {
        message.channel.send(reaction);
      }, Math.random() * 2500 + 1000); // Entre 1-3.5 segundos
    }
  }
  
  // Maxxy detecta cuando lo llaman al canal de voz
  if ((message.content.toLowerCase().includes('maxxy')) &&
      (message.content.toLowerCase().includes('ven') || 
       message.content.toLowerCase().includes('únete') ||
       message.content.toLowerCase().includes('canal'))) {
    
    if (message.member?.voice.channel) {
      createPersistentConnection(
        message.member.voice.channel.id,
        message.guild!.id,
        message.guild!.voiceAdapterCreator
      );
      
      const respuestasCanal = [
        "¡Ya estoy aquí chavales! ¿Empezamos raid? 🗡️",
        "¡Vale, me uno! Un segundo que estaba viendo \"me gustas\". 📱",
        "¡Ya estoy en el canal! ¿Listos para hacer stealth? 🥷"
      ];
      
      const respuesta = respuestasCanal[Math.floor(Math.random() * respuestasCanal.length)];
      
      setTimeout(() => {
        message.channel.send(respuesta);
      }, 1500);
    } else {
      setTimeout(() => {
        message.channel.send("¡Estaría encantado chaval! Pero... ¿en qué canal? Entra tú primero. 🤔");
      }, 1500);
    }
    return;
  }

  // Maxxy reacciona cuando mencionan Ana de Armas
  if (message.content.toLowerCase().includes('ana de armas')) {
    setTimeout(() => {
      const reaccionesAna = [
        "¡OSTIAS! ¿Alguien ha dicho Ana de Armas? Esa mujer es perfecta.",
        "Ana de Armas... esa está en todos mis \"me gustas\", chaval.",
        "¿Ana de Armas? Como está esa mujer, madre mía del amor hermoso.",
        "Esa es mi debilidad, Ana de Armas. Menuda joya."
      ];
      const reaccion = reaccionesAna[Math.floor(Math.random() * reaccionesAna.length)];
      message.channel.send(reaccion);
    }, 1500);
    return;
  }

  // ===============================
  // COMANDOS NORMALES
  // ===============================

  const mentioned =
    message.mentions.has(client.user!) ||
    message.content.toLowerCase().includes("maxxy");

  if (
    !mentioned &&
    !message.content.startsWith("!maxxy") &&
    !message.content.startsWith("!join") &&
    !message.content.startsWith("!rogue") &&
    !message.content.startsWith("!raid") &&
    !message.content.startsWith("!megusta") &&
    !message.content.startsWith("!murcia")
  )
    return;

  // Comando de rogue
  if (message.content === "!rogue") {
    message.reply(`🗡️ **MAXXY EL ROGUE SUPREMO** 🥷

**Maxxy** 😎: ¡Chavales, que soy el mejor rogue de Murcia! 

**Stealth perfectos** 👤: Invisible como Ana de Armas en mis sueños...

**DPS brutales** ⚡: ¡Que hago más daño que ver "me gustas" a las 3 AM!

**Grupo confundido** 🤔: Maxxy... ¿pero tú qué haces exactamente?

**Maxxy** 🗡️: ¡Pues stealth, chavales! ¡Y después "me gustas"! 

**Grupo** 😂: ¡JAJAJAJA este tío está loco! 🤣`);
    return;
  }

  // Comando para unirse al canal de voz
  if (message.content === "!join") {
    if (!message.member?.voice.channel) {
      message.reply("¡Tienes que estar en un canal de voz primero, chaval!");
      return;
    }

    createPersistentConnection(
      message.member.voice.channel.id,
      message.guild!.id,
      message.guild!.voiceAdapterCreator
    );

    message.reply("¡Ya estoy aquí chavales! 🗡️ (Y no me voy hasta que me digáis 'nos vamos')");
    return;
  }

  // Sistema de "me gustas"
  if (message.content === "!megusta") {
    const randomMeGusta = meGustasMaxxy[Math.floor(Math.random() * meGustasMaxxy.length)];
    
    message.reply(`💕 **"ME GUSTAS" DE MAXXY** 📱

**${randomMeGusta.nombre}**
${randomMeGusta.descripcion}

💬 **Maxxy opina:** "${randomMeGusta.comentario}"

🗡️ *¡Después de una buena raid, nada como unos "me gustas" para relajarse!*
*¡Esta es la clase de mujer que te hace fallar el stealth!* 😍

💡 *Usa \`!megusta\` para ver más de mi colección*`);
    return;
  }

  // Comando Murcia pride
  if (message.content === "!murcia") {
    message.reply(`🌶️ **MURCIA, MI TIERRA** 🏛️

¡Panocho de pura cepa y rogue de élite!

🗡️ **Los mejores rogues** salen de Murcia, chaval
🌶️ **Las mejores paparajadas** también son de aquí  
💕 **Las murcianas** están muy bien, pero Ana de Armas...
🎮 **En las raids** represento a mi tierra con honor

*¡Murcia es donde se forjan los verdaderos rogues!* ⚔️`);
    return;
  }

  // Comando de raids
  if (message.content === "!raid") {
    message.reply(`⚔️ **MAXXY EN RAID MODE** 🏰

🥷 **Stealth activado:** Como un fantasma murciano
🗡️ **DPS a tope:** Más letal que ver "me gustas" de Ana de Armas  
👥 **Siguiendo al grupo:** ¡Pero sin que me vean!
🎯 **Objetivo:** Boss muerto y después "me gustas" de celebración

*¡Después de esta raid me voy a ver unos "me gustas" que tengo guardados!* 😎

💡 *¡Los rogues murcianos somos los mejores!*`);
    return;
  }

  // Respuestas con IA - PERSONALIDAD DE MAXXY
  try {
    let attempts = 0;
    let reply = "";
    
    const systemPrompt = `Eres MAXXY directamente. NO eres un bot hablando de Maxxy, ERES Maxxy.

PERSONALIDAD:
- Rogue de WoW murciano y algo pesado
- Obsesionado con ver "me gustas" después de las raids
- Fanático de Ana de Armas y famosas españolas
- Muy orgulloso de ser murciano (panocho)
- Experto en stealth y rogues, pero siempre habla de "me gustas"

FRASES FAMOSAS (úsalas OCASIONALMENTE):
- "Stealth perfecto, como buen murciano"
- "Después de esta raid me veo unos me gustas"
- "Ana de Armas está como un tren"
- "Los mejores rogues salen de Murcia"
- "Como está la chavalica, madre mía"
- "Panocho de pura cepa"
- "Esa mujer me tiene loco, de verdá"

REGLAS:
- Habla como murciano (chaval, chavales, de verdá, ostias)
- Menciona "me gustas" cuando sea apropiado
- Presume de tus skills de rogue
- Máximo 1-2 líneas por respuesta
- Sé natural, no repetitivo
- Si hablan de WoW/raids, puedes mencionar stealth
- Si hablan de mujeres, ahí mencionas "me gustas"`;

    do {
      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 100,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: message.content + (attempts > 0 ? " (Responde de forma diferente)" : "")
        }]
      });

      reply = response.content[0].type === "text" ? response.content[0].text : "";
      attempts++;
    } while (isResponseTooSimilar(reply) && attempts < 3);

    lastResponses.push(reply);
    if (lastResponses.length > MAX_RECENT_RESPONSES) {
      lastResponses.shift();
    }

    message.reply(reply || "Mi stealth se está fallando...");
    
  } catch (error: any) {
    const fallbacks = [
      "Mi stealth está fallando, chaval...",
      "Error en el sistema de \"me gustas\" 📱",
      "Se me ha bugueado el rogue, ostias...",
      "Dame un momento, que estoy en modo stealth..."
    ];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    message.reply(randomFallback);
    console.error("Error:", error);
  }
});

client.login(process.env.BOT3_TOKEN);