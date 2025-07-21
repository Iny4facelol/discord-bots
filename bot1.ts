// bot-fatlotus.ts con IA REACTIVA y CONEXIÓN PERSISTENTE
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
// SISTEMA IA REACTIVA
// ===============================
let conversationHistory: string[] = [];
let lastReaction = Date.now();
const REACTION_COOLDOWN = 30000; // 30 segundos entre reacciones

// Variable para trackear la conexión de voz actual
let currentVoiceConnection: any = null;

// Playlist de Hugo con enlaces directos
const musicaHugo = [
  { 
    nombre: "Omega - Tu si quieres", 
    link: "https://www.youtube.com/watch?v=oadOjfI7m04&list=RDoadOjfI7m04&start_radio=1",
    description: "🔥 La canción más épica del power metal"
  },
];

// ===============================
// SISTEMA DE CONEXIÓN PERSISTENTE
// ===============================
function createPersistentConnection(channelId: string, guildId: string, adapterCreator: any) {
  // Si ya hay una conexión, destruirla primero
  if (currentVoiceConnection) {
    currentVoiceConnection.destroy();
  }

  const connection = joinVoiceChannel({
    channelId: channelId,
    guildId: guildId,
    adapterCreator: adapterCreator,
  });

  // Crear un player para mantener la conexión
  const player = createAudioPlayer();
  connection.subscribe(player);

  // Manejar desconexiones automáticas
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      console.log('🔄 Conexión perdida, intentando reconectar...');
      // Intentar reconectar después de 5 segundos
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
    console.log('✅ Hugo conectado al canal de voz');
  });

  // Guardar la conexión actual
  currentVoiceConnection = connection;
  return connection;
}

// Función para desconectar del canal de voz
function disconnectFromVoice(guildId: string) {
  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.destroy();
    currentVoiceConnection = null;
    console.log('👋 Hugo se ha desconectado del canal de voz');
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

// Función para analizar el contexto de la conversación
function analyzeContext(messages: string[]): string {
  const recentMessages = messages.slice(-5).join(' ').toLowerCase();
  
  // Detectar temas específicos
  if (recentMessages.includes('build') || recentMessages.includes('gema') || recentMessages.includes('estadística')) {
    return 'build_discussion';
  }
  if (recentMessages.includes('raid') || recentMessages.includes('boss') || recentMessages.includes('estrategia')) {
    return 'raid_planning';
  }
  if (recentMessages.includes('kill') || recentMessages.includes('muerto') || recentMessages.includes('ganado')) {
    return 'gaming_action';
  }
  if (recentMessages.includes('frustrado') || recentMessages.includes('joder') || recentMessages.includes('mierda')) {
    return 'frustration';
  }
  if (recentMessages.includes('epic') || recentMessages.includes('increíble') || recentMessages.includes('genial')) {
    return 'excitement';
  }
  
  return 'normal';
}

// Función para que Hugo reaccione inteligentemente
async function hugoReactToContext(context: string, message: any): Promise<string | null> {
  const now = Date.now();
  
  // Cooldown para no spamear
  if (now - lastReaction < REACTION_COOLDOWN) return null;
  
  let reaction = null;
  
  switch (context) {
    case 'build_discussion':
      const buildReactions = [
        "¡Eh, que estáis hablando de builds! Mi build de mago es perfecta, tetín.",
        "¿Builds? Yo tengo la mejor combinación de gemas de poder.",
        "Si queréis una build que funcione, preguntadme a mí.",
        "Mi build de GangPlank Ron Cola es legendaria, por si os interesa."
      ];
      reaction = buildReactions[Math.floor(Math.random() * buildReactions.length)];
      break;
      
    case 'gaming_action':
      const actionReactions = [
        "¡Esa kill ha sido épica! Como mis gemas de poder.",
        "Voy engemao y encantao con esas jugadas.",
        "¡Así se hace! Con estilo, como siempre.",
        "La Q de Twisted Fate no se puede esquivar, tetín."
      ];
      reaction = actionReactions[Math.floor(Math.random() * actionReactions.length)];
      break;
      
    case 'frustration':
      const frustrationReactions = [
        "Tranquilo tetín, todos hemos estado ahí. Mi build me ayuda en momentos así.",
        "¿Frustraciones? Eso se arregla con una buena build como la mía.",
        "No te agobies, que esto es para divertirse.",
        "El Apex que juegazo tío, a ver si jugamos luego."
      ];
      reaction = frustrationReactions[Math.floor(Math.random() * frustrationReactions.length)];
      break;
      
    case 'excitement':
      const excitementReactions = [
        "¡Voy engemao y encantao con tanto entusiasmo!",
        "¡Esa es la actitud! Como cuando estrené mis gemas de poder.",
        "¡Así se habla! Con esa energía vamos a arrasar.",
        "¡Somos nosotros! El mejor grupo del servidor."
      ];
      reaction = excitementReactions[Math.floor(Math.random() * excitementReactions.length)];
      break;
  }
  
  if (reaction) {
    lastReaction = now;
    return reaction;
  }
  
  return null;
}

// Sistema de estados del grupo
function detectGroupMood(messages: string[]): string {
  const recentText = messages.slice(-10).join(' ').toLowerCase();
  
  const positiveWords = ['genial', 'increíble', 'perfecto', 'epic', 'brutal', 'good', 'win'];
  const negativeWords = ['mal', 'horrible', 'mierda', 'joder', 'fail', 'lag', 'bug'];
  const excitedWords = ['vamos', 'dale', 'a tope', 'letsgo', 'brutal'];
  
  const positiveCount = positiveWords.filter(word => recentText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => recentText.includes(word)).length;
  const excitedCount = excitedWords.filter(word => recentText.includes(word)).length;
  
  if (excitedCount >= 2) return 'excited';
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

client.on("ready", () => {
  console.log(`🧙‍♂️ FatLotus conectado como ${client.user?.tag}`);
  
  // Hugo reacciona al mood del grupo cada 5 minutos
  setInterval(() => {
    if (conversationHistory.length > 5) {
      const mood = detectGroupMood(conversationHistory);
      
      // Buscar el canal general (cambiar por tu canal)
      const channel = client.channels.cache.find((ch: any) => ch.name === 'general') as any;
      
      if (channel && mood !== 'neutral') {
        const moodReactions = {
          excited: "¡Me encanta cuando el grupo está así de motivado! ¡Vamos a arrasar!",
          positive: "Buen rollo en el grupo, me gusta. Voy engemao y encantao.",
          negative: "Eh, que tampoco es para tanto. A veces pasan cosas raras, como mis builds."
        };
        
        if (moodReactions[mood as keyof typeof moodReactions]) {
          channel.send(moodReactions[mood as keyof typeof moodReactions]);
        }
      }
    }
  }, 300000); // Cada 5 minutos
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ===============================
  // COMANDO PARA SALIRSE DEL CANAL
  // ===============================
  if (message.content.toLowerCase().includes('nos vamos') || 
      message.content.toLowerCase().includes('hugo nos vamos') ||
      message.content.toLowerCase().includes('fatlotus nos vamos') ||
      message.content === '!leave' ||
      message.content === '!salir') {
    
    const wasDisconnected = disconnectFromVoice(message.guild!.id);
    
    if (wasDisconnected) {
      const despedidas = [
        "¡Vale tetes! Me voy a seguir perfeccionando mi build. 🧙‍♂️",
        "¡Nos vemos! Voy a actualizar mi guía de mobafire. 👋",
        "¡Hasta luego! A ver si jugamos al Apex después. 🎮",
        "¡Me piro! Que tengo que reorganizar mis gemas de poder. ✨"
      ];
      
      const despedida = despedidas[Math.floor(Math.random() * despedidas.length)];
      
      setTimeout(() => {
        message.channel.send(despedida);
      }, 1000);
    } else {
      setTimeout(() => {
        message.channel.send("¡Pero si no estoy en ningún canal, tetín! 🤔");
      }, 1000);
    }
    return;
  }

  // ===============================
  // IA REACTIVA - OBSERVADOR INTELIGENTE
  // ===============================
  
  // Guardar en historial de conversación
  conversationHistory.push(`${message.author.displayName}: ${message.content}`);
  
  // Mantener solo los últimos 20 mensajes
  if (conversationHistory.length > 20) {
    conversationHistory.shift();
  }
  
  // Analizar contexto
  const context = analyzeContext(conversationHistory);
  
  // Hugo reacciona automáticamente si detecta algo interesante
  if (context !== 'normal') {
    const reaction = await hugoReactToContext(context, message);
    
    if (reaction) {
      // Esperar un poco para que parezca natural
      setTimeout(() => {
        message.channel.send(reaction);
      }, Math.random() * 3000 + 1000); // Entre 1-4 segundos
    }
  }
  
  // Hugo detecta cuando lo llaman al canal de voz
  if ((message.content.toLowerCase().includes('hugo') || 
       message.content.toLowerCase().includes('fatlotus')) &&
      (message.content.toLowerCase().includes('ven') || 
       message.content.toLowerCase().includes('únete') ||
       message.content.toLowerCase().includes('canal'))) {
    
    // Buscar si el usuario está en un canal de voz
    if (message.member?.voice.channel) {
      // ENTRAR AL CANAL automáticamente con conexión persistente
      createPersistentConnection(
        message.member.voice.channel.id,
        message.guild!.id,
        message.guild!.voiceAdapterCreator
      );
      
      const respuestasCanal = [
        "¡Ya estoy aquí tetín! Tiro blink *se tira cubo*. 🧙‍♂️",
        "¡Vale, ya me uno! Un segundo que termino un tronquito. 🚬",
        "¡Ya estoy en el canal! ¿Listos para fumarnos unos puros? 🔥"
      ];
      
      const respuesta = respuestasCanal[Math.floor(Math.random() * respuestasCanal.length)];
      
      setTimeout(() => {
        message.channel.send(respuesta);
      }, 1500);
    } else {
      // Si el usuario no está en canal de voz
      setTimeout(() => {
        message.channel.send("¡Estaría encantado tetín! Pero... ¿en qué canal quieres que entre? Entra tú primero. 🤔");
      }, 1500);
    }
    return;
  }

  if (message.author.username?.toLowerCase().includes('nins') || 
      message.author.username?.toLowerCase().includes('ismael')) {
    
    if (message.content.toLowerCase().includes('build') && 
        message.content.toLowerCase().includes('mal')) {
      
      setTimeout(() => {
        message.channel.send("¡Eh Ismael! ¿Que mi build está mal? ¡Si funciona perfectamente, tetín!");
      }, 2000);
      return; // No procesar más comandos
    }
  }
  
  // Hugo se defiende cuando lo critican directamente
  if (message.content.toLowerCase().includes('hugo') && 
      (message.content.toLowerCase().includes('gema') || 
       message.content.toLowerCase().includes('build'))) {
    
    if (message.content.toLowerCase().includes('mal') || 
        message.content.toLowerCase().includes('no sirve')) {
      
      setTimeout(() => {
        const defensas = [
          "¡Que sí sirve! Voy engemao y encantao con mi build.",
          "Mi build es única, tetín. No la entendéis.",
          "¿Sabías que tengo una build en mobafire? Mírala antes de criticar.",
          "Coño pues de poder, ¡y funciona!"
        ];
        const defensa = defensas[Math.floor(Math.random() * defensas.length)];
        message.channel.send(defensa);
      }, 1500);
      return; // No procesar más comandos
    }
  }

  // ===============================
  // COMANDOS NORMALES
  // ===============================

  const mentioned =
    message.mentions.has(client.user!) ||
    message.content.toLowerCase().includes("fatlotus") ||
    message.content.toLowerCase().includes("hugo");

  if (
    !mentioned &&
    !message.content.startsWith("!hugo") &&
    !message.content.startsWith("!join") &&
    !message.content.startsWith("!gema") &&
    !message.content.startsWith("!music") &&
    !message.content.startsWith("!musica") &&
    !message.content.startsWith("!playlist") &&
    !message.content.startsWith("!leave") &&
    !message.content.startsWith("!salir")
  )
    return;

  // Comando de gemas
  if (message.content === "!gema") {
    message.reply(`**Fatlotus** 😎: ¡Voy engemado y encantado eh! Os podréis quejar... ✨💪

**Ismael** 🤔: ¿Pero Hugo, esas gemas qué coño son? 💎❓

**Resto del grupo** 😂: ¡JAJAJAJAJAJA! 🤣🤣🤣

**Fatlotus** 💥: ¡Coño, pues de poder! ⚡🔥

**Ismael** 🤦‍♂️: Pero Hugo... ¡que tú no usas poder de ataque, máquina! 🙄 ¡Que eres mago! 🧙‍♂️✨`);
    return;
  }

  // Comando para unirse al canal de voz con conexión persistente
  if (message.content === "!join") {
    if (!message.member?.voice.channel) {
      message.reply("¡Tienes que estar en un canal de voz primero, tetín!");
      return;
    }

    createPersistentConnection(
      message.member.voice.channel.id,
      message.guild!.id,
      message.guild!.voiceAdapterCreator
    );

    message.reply("¡Ya estoy aquí tetes! 🧙‍♂️ (Y no me voy hasta que me digáis 'nos vamos')");
    return;
  }

  // Comando para salirse del canal manual
  if (message.content === "!leave" || message.content === "!salir") {
    const wasDisconnected = disconnectFromVoice(message.guild!.id);
    
    if (wasDisconnected) {
      message.reply("¡Me piro tetín! 👋 Hasta la próxima. 🧙‍♂️");
    } else {
      message.reply("¡Pero si no estoy en ningún canal, tetín! 🤔");
    }
    return;
  }

  // Sistema de música simplificado - Solo enlaces
  if (message.content === "!music" || message.content === "!musica") {
    if (!message.member?.voice.channel) {
      message.reply("¡Tienes que estar en un canal de voz primero, tetín! 🧙‍♂️");
      return;
    }
    
    // Entrar al canal de voz con conexión persistente
    createPersistentConnection(
      message.member.voice.channel.id,
      message.guild!.id,
      message.guild!.voiceAdapterCreator
    );

    const randomSong = musicaHugo[Math.floor(Math.random() * musicaHugo.length)];
    
    message.reply(`🎸 **¡Música épica seleccionada!** 🎵

**${randomSong.nombre}**
${randomSong.description}

🔗 **Enlace:** ${randomSong.link}

¡Voy engemao y encantao! Pon esto mientras jugamos, tetín! 🤘🔥
*¡Esta es música de guerreros, no como esas baladas de Ismael!*

💡 *Copia el enlace y ponlo en tu reproductor favorito*`);
    return;
  }

  // Comando para ver playlist completa
  if (message.content === "!playlist") {
    let playlist = "🎸 **Mi playlist épica de power metal:** 🤘\n\n";
    
    musicaHugo.forEach((song, i) => {
      playlist += `**${i+1}. ${song.nombre}**\n`;
      playlist += `   ${song.description}\n`;
      playlist += `   🔗 ${song.link}\n\n`;
    });
    
    playlist += "*¡Esta es música de verdaderos guerreros! Usa `!music` para una aleatoria.* ⚔️";
    
    message.reply(playlist);
    return;
  }

  // Respuestas con IA - PERSONALIDAD DE HUGO CON ANTI-REPETICIÓN
  try {
    let attempts = 0;
    let reply = "";
    
    const systemPrompt = `Eres HUGO (FATLOTUS) directamente. NO eres un bot hablando de Hugo, ERES Hugo.

PERSONALIDAD:
- Gnomo mago terco que usa gemas de poder de ataque
- Defiendes tu build pero NO repitas las mismas frases todo el rato
- Eres confiado y algo fanfarrón sobre tus builds raros
- Te encanta el Apex pero sabes que no juega ni dios
- Te mataron con PvP en un servidor hardcore del WoW y te quedaste con trauma

FRASES FAMOSAS (úsalas OCASIONALMENTE, no siempre):
- "La Q de Twisted Fate no se puede esquivar tetín"
- "El escudo de Mordekaiser es a lvl 2"
- "¿Qué si quiero o que si tengo?"
- "Eso lo explico en mi build de GangPlank Ron Cola"
- "Voy engemao y encantao" (solo cuando estés MUY orgulloso)
- "¿Sabías que tengo una build en mobafire?"
- "Uf el Apex que juegazo tio"

REGLAS IMPORTANTES:
- NO uses "¿Qué si quiero o que si tengo?" en cada respuesta
- NO digas "Voy engemao y encantao" constantemente
- Varía tus respuestas, sé natural
- Responde al contexto específico de la pregunta
- Máximo 1-2 líneas por respuesta
- Si hablan de GangPlank, ahí sí puedes mencionar tu build
- Sé Hugo, pero conversando normalmente, no recitando frases`;

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

    message.reply(reply || "Mi cerebro mágico está procesando...");
    
  } catch (error: any) {
    const fallbacks = [
      "Mi conexión mágica está fallando...",
      "Error en el hechizo de comunicación 🧙‍♂️",
      "Mis gemas están interfiriendo con la IA...",
      "Dame un momento, estoy recalibrando mi build..."
    ];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    message.reply(randomFallback);
    console.error("Error:", error);
  }
});

client.login(process.env.BOT1_TOKEN);