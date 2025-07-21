// bot-nins.ts con IA REACTIVA
import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import Anthropic from "@anthropic-ai/sdk";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // Para voz
  ],
});

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Sistema anti-repetición para Nins
let lastResponses: string[] = [];
const MAX_RECENT_RESPONSES = 5;

// ===============================
// SISTEMA IA REACTIVA PARA NINS
// ===============================
let conversationHistory: string[] = [];
let lastReaction = Date.now();
const REACTION_COOLDOWN = 30000; // 30 segundos entre reacciones

// Función para evitar repeticiones
function isResponseTooSimilar(newResponse: string): boolean {
  const newWords = newResponse.toLowerCase().split(" ");

  for (const oldResponse of lastResponses) {
    const oldWords = oldResponse.toLowerCase().split(" ");
    const commonWords = newWords.filter((word) => oldWords.includes(word));

    if (commonWords.length / newWords.length > 0.5) {
      return true;
    }
  }
  return false;
}

// Función para analizar el contexto específico de Ismael
function analyzeContextIsmael(messages: string[]): string {
  const recentMessages = messages.slice(-5).join(" ").toLowerCase();

  // Detectar situaciones que requieren organización
  if (
    recentMessages.includes("caos") ||
    recentMessages.includes("desorden") ||
    recentMessages.includes("lío")
  ) {
    return "chaos_detected";
  }
  if (
    recentMessages.includes("raid") ||
    recentMessages.includes("boss") ||
    recentMessages.includes("estrategia")
  ) {
    return "raid_planning";
  }
  if (
    recentMessages.includes("hugo") &&
    (recentMessages.includes("build") || recentMessages.includes("gema"))
  ) {
    return "hugo_build_nonsense";
  }
  if (
    recentMessages.includes("fail") ||
    recentMessages.includes("wipe") ||
    recentMessages.includes("muerte")
  ) {
    return "raid_failure";
  }
  if (
    recentMessages.includes("guía") ||
    recentMessages.includes("táctica") ||
    recentMessages.includes("plan")
  ) {
    return "strategy_discussion";
  }
  if (
    recentMessages.includes("trollear") ||
    recentMessages.includes("trolear") ||
    recentMessages.includes("broma")
  ) {
    return "trolling_detected";
  }

  return "normal";
}

// Función para que Ismael reaccione como raidleader
async function ninsReactToContext(
  context: string,
  message: any
): Promise<string | null> {
  const now = Date.now();

  // Cooldown para no spamear
  if (now - lastReaction < REACTION_COOLDOWN) return null;

  let reaction = null;

  switch (context) {
    case "chaos_detected":
      const chaosReactions = [
        "Por favor, ¿podemos organizarnos un poco? Esto es un caos total.",
        "¿Sois tontos? Vamos a hacer las cosas en orden.",
        "Tío, llevamos 5 minutos y ya hay desorden. Organizaos.",
        "Vale, PAUSA. Vamos a planificar esto bien desde el principio.",
      ];
      reaction =
        chaosReactions[Math.floor(Math.random() * chaosReactions.length)];
      break;

    case "raid_planning":
      const raidReactions = [
        "Por favor, ¿podemos vernos la guía de este boss antes de empezar?",
        "Organizaos. Roles, posiciones, y después empezamos.",
        "No vayamos a ciegas otra vez, que ya sabéis cómo acaba.",
        "¿Tenemos tank, healer y DPS? Confirmadme antes de empezar.",
      ];
      reaction =
        raidReactions[Math.floor(Math.random() * raidReactions.length)];
      break;

    case "hugo_build_nonsense":
      const hugoReactions = [
        "Hugo, en serio, revisa tu build antes de que empecemos.",
        "¿De verdad vas a usar esas gemas otra vez? Que eres mago máquina.",
        "Por favor Hugo, optimiza eso antes de que nos hagan wipe.",
        "Hugo, tío, tu build no tiene sentido. Pero bueno, ya estamos acostumbrados.",
      ];
      reaction =
        hugoReactions[Math.floor(Math.random() * hugoReactions.length)];
      break;

    case "raid_failure":
      const failReactions = [
        "¿Veis? Por eso hay que leerse la guía antes.",
        "Vale, todos calmados. Analizamos qué ha fallado y repetimos.",
        "Era previsible. La próxima vez seguimos la estrategia.",
        "Respawn y organizaos. Esta vez lo hacemos bien.",
      ];
      reaction =
        failReactions[Math.floor(Math.random() * failReactions.length)];
      break;

    case "strategy_discussion":
      const strategyReactions = [
        "Perfecto, así me gusta. Planificación antes que improvisación.",
        "Bien, veo que alguien se ha leído la guía. Sigamos por ahí.",
        "Exacto, esa es la actitud correcta para una raid.",
        "Por fin alguien que piensa antes de actuar.",
      ];
      reaction =
        strategyReactions[Math.floor(Math.random() * strategyReactions.length)];
      break;

    case "trolling_detected":
      const trollReactions = [
        "¿En serio? ¿Vamos a trollear ahora?",
        "Hector, ¿puedes por favor no trolear a la raid?",
        "Tío, llevo trabajando 12 horas hoy, no me toquéis los cojones.",
        "¿Os vais a tomar esto en serio o qué?",
      ];
      reaction =
        trollReactions[Math.floor(Math.random() * trollReactions.length)];
      break;
  }

  if (reaction) {
    lastReaction = now;
    return reaction;
  }

  return null;
}

// Sistema de detección de mood del raidleader
function detectRaidMood(messages: string[]): string {
  const recentText = messages.slice(-10).join(" ").toLowerCase();

  const organizedWords = [
    "plan",
    "estrategia",
    "guía",
    "organizado",
    "perfecto",
  ];
  const chaosWords = ["caos", "desorden", "fail", "wipe", "trollear"];
  const progressWords = ["bien", "perfecto", "funciona", "good"];

  const organizedCount = organizedWords.filter((word) =>
    recentText.includes(word)
  ).length;
  const chaosCount = chaosWords.filter((word) =>
    recentText.includes(word)
  ).length;
  const progressCount = progressWords.filter((word) =>
    recentText.includes(word)
  ).length;

  if (chaosCount >= 2) return "frustrated";
  if (organizedCount >= 2) return "satisfied";
  if (progressCount >= 2) return "pleased";
  return "neutral";
}

client.on("ready", () => {
  console.log(`🎯 Nins conectado como ${client.user?.tag}`);

  // Nins comenta el estado de organización cada 5 minutos
  setInterval(() => {
    if (conversationHistory.length > 5) {
      const mood = detectRaidMood(conversationHistory);

      // Buscar el canal general
      const channel = client.channels.cache.find(
        (ch: any) => ch.name === "general"
      ) as any;

      if (channel && mood !== "neutral") {
        const moodReactions = {
          frustrated:
            "¿Podemos organizarnos un poco mejor? Esto parece una guardería.",
          satisfied: "Bien, veo que por fin hay organización en el grupo.",
          pleased:
            "Perfecto, así me gusta ver el grupo. Disciplinados y efectivos.",
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
  // IA REACTIVA - OBSERVADOR RAIDLEADER
  // ===============================

  // Guardar en historial de conversación
  conversationHistory.push(`${message.author.displayName}: ${message.content}`);

  // Mantener solo los últimos 20 mensajes
  if (conversationHistory.length > 20) {
    conversationHistory.shift();
  }

  // Analizar contexto específico de Ismael
  const context = analyzeContextIsmael(conversationHistory);

  // Nins reacciona automáticamente como raidleader
  if (context !== "normal") {
    const reaction = await ninsReactToContext(context, message);

    if (reaction) {
      // Esperar un poco para que parezca natural
      setTimeout(() => {
        message.channel.send(reaction);
      }, Math.random() * 3000 + 1000); // Entre 1-4 segundos
    }
  }

  // Nins detecta cuando lo llaman al canal de voz
  if (
    (message.content.toLowerCase().includes("nins") ||
      message.content.toLowerCase().includes("ismael")) &&
    (message.content.toLowerCase().includes("ven") ||
      message.content.toLowerCase().includes("únete") ||
      message.content.toLowerCase().includes("canal"))
  ) {
    // Buscar si el usuario está en un canal de voz
    if (message.member?.voice.channel) {
      // ENTRAR AL CANAL automáticamente
      joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild!.id,
        adapterCreator: message.guild!.voiceAdapterCreator,
      });

      const respuestasCanal = [
        "Vale, ya estoy aquí. ¿Podemos organizarnos bien esta vez? 📋🎯",
        "¡Perfecto! Ahora sí podemos coordinar la raid como es debido. 🎮",
        "Ya estoy en el canal. ¿Tenemos plan o improvisamos otra vez? 📊",
        "¡Aquí estoy! Listos para una raid organizada y disciplinada. ⚔️",
      ];

      const respuesta =
        respuestasCanal[Math.floor(Math.random() * respuestasCanal.length)];

      setTimeout(() => {
        message.channel.send(respuesta);
      }, 1500);
    } else {
      // Si el usuario no está en canal de voz
      setTimeout(() => {
        message.channel.send(
          "*entra al canal* Todos: ¡QUÉ PASA ISMAEEEEEEL! Ismael: Por favor no me toquéis los cojones que llevo trabajando 2 fases lunares seguidas... 📋"
        );
      }, 1500);
    }
    return;
  }

  // Nins reacciona cuando Hugo dice tonterías específicas
  if (
    message.author.username?.toLowerCase().includes("fatlotus") ||
    message.author.username?.toLowerCase().includes("hugo")
  ) {
    if (
      message.content.toLowerCase().includes("build") &&
      message.content.toLowerCase().includes("perfecta")
    ) {
      setTimeout(() => {
        message.channel.send(
          "¿Perfecta? Hugo, tío, que llevas gemas de ataque siendo mago. Revísatelo."
        );
      }, 2000);
      return;
    }

    if (message.content.toLowerCase().includes("voy engemao")) {
      setTimeout(() => {
        message.channel.send(
          "Sí Hugo, ya sabemos que vas 'engemao'. Pero ¿funciona en raid?"
        );
      }, 2000);
      return;
    }
  }

  // ===============================
  // COMANDOS NORMALES
  // ===============================

  const mentioned =
    message.mentions.has(client.user!) ||
    message.content.toLowerCase().includes("nins") ||
    message.content.toLowerCase().includes("ismael");

  if (
    !mentioned &&
    !message.content.startsWith("!nins") &&
    !message.content.startsWith("!join") &&
    !message.content.startsWith("!pregunta") &&
    !message.content.startsWith("!respuesta")
  )
    return;

  // Comando específico para raids
  if (
    message.content.toLowerCase().includes("raid") ||
    message.content.toLowerCase().includes("boss")
  ) {
    message.reply(`Por favor, ¿podemos vernos la guía de este boss antes? 📋
No vayamos a ciegas otra vez...`);
    return;
  }

  // Comando de preguntas difíciles de lore WoW
  if (message.content === "!pregunta") {
    const preguntasWoW = [
      {
        pregunta:
          "¿Cuál era el verdadero nombre de Illidan antes de convertirse en demonio cazador?",
        respuesta:
          "Era simplemente Illidan Stormrage, hermano gemelo de Malfurion.",
        palabrasClave: ["illidan", "stormrage", "illidan stormrage"],
      },
      {
        pregunta: "¿Quién forjó originalmente la espada Ashbringer?",
        respuesta:
          "Ashbringer fue forjada por Magni Bronzebeard usando un cristal de naaru.",
        palabrasClave: ["magni", "bronzebeard", "magni bronzebeard"],
      },
      {
        pregunta: "¿Cuál fue la primera raza en usar magia arcana en Azeroth?",
        respuesta:
          "Los Highborne fueron los primeros en dominar la magia arcana en el Pozo de la Eternidad.",
        palabrasClave: ["highborne", "elfos", "kaldorei"],
      },
      {
        pregunta:
          "¿Quién fue el último Rey Exarca de Draenor antes de la corrupción?",
        respuesta:
          "Velen era el último Rey Exarca antes de huir de Argus con los draenei.",
        palabrasClave: ["velen", "profeta velen"],
      },
      {
        pregunta:
          "¿Cómo se llamaba originalmente Deathwing antes de su corrupción?",
        respuesta:
          "Neltharion el Protector de la Tierra, antes de volverse loco por los Dioses Antiguos.",
        palabrasClave: ["neltharion", "protector", "tierra"],
      },
      {
        pregunta:
          "¿Qué acontecimiento causó la Gran Ruptura que separó Kalimdor?",
        respuesta:
          "La explosión del Pozo de la Eternidad al final de la Guerra de los Ancestros.",
        palabrasClave: [
          "pozo",
          "eternidad",
          "guerra",
          "ancestros",
          "explosion",
        ],
      },
      {
        pregunta: "¿Quién fue el primer humano en convertirse en paladín?",
        respuesta:
          "Uther Lightbringer fue el primer paladín humano de la Mano de Plata.",
        palabrasClave: ["uther", "lightbringer", "uther lightbringer"],
      },
      {
        pregunta:
          "¿Cómo se llamaba la capital de los Highborne antes del Cataclismo?",
        respuesta: "Zin-Azshari, la gloriosa capital del Imperio Kaldorei.",
        palabrasClave: ["zin-azshari", "zin azshari", "azshari"],
      },
      {
        pregunta:
          "¿Qué dragón azul traicionó a Malygos durante la Guerra de los Ancestros?",
        respuesta:
          "Arygos, uno de los hijos de Malygos, fue seducido por la Legión.",
        palabrasClave: ["arygos"],
      },
      {
        pregunta: "¿Cuál era el nombre de Sylvanas cuando era ranger general?",
        respuesta: "Sylvanas Windrunner, la Ranger General de Silvermoon.",
        palabrasClave: ["sylvanas", "windrunner", "sylvanas windrunner"],
      },
    ];

    const randomIndex = Math.floor(Math.random() * preguntasWoW.length);
    const preguntaObj = preguntasWoW[randomIndex];

    message.reply(`📚 **Pregunta de lore avanzado:**
    
❓ ${preguntaObj.pregunta}

*Responde directamente en el chat. Te diré si acertaste y después puedes usar \`!respuesta\` para ver la explicación completa.*`);

    // Guardar la pregunta actual
    (global as any).currentQuestionObj = preguntaObj;
    (global as any).questionAskedBy = message.author.id;
    return;
  }

  // Comando para mostrar la respuesta completa
  if (message.content === "!respuesta") {
    if ((global as any).currentQuestionObj) {
      message.reply(`✅ **Respuesta completa:**
      
${(global as any).currentQuestionObj.respuesta}

¡Usa \`!pregunta\` para otra!`);
      (global as any).currentQuestionObj = null;
      (global as any).questionAskedBy = null;
    } else {
      message.reply("No hay ninguna pregunta activa. Usa `!pregunta` primero.");
    }
    return;
  }

  // Verificar respuestas cuando hay una pregunta activa
  if (
    (global as any).currentQuestionObj &&
    (global as any).questionAskedBy === message.author.id
  ) {
    const userAnswer = message.content.toLowerCase();
    const correctKeywords = (global as any).currentQuestionObj.palabrasClave;

    const isCorrect = correctKeywords.some((keyword: string) =>
      userAnswer.includes(keyword.toLowerCase())
    );

    if (isCorrect) {
      message.reply(`🎉 **¡CORRECTO!** Muy bien cabecita de almendra.
      
Usa \`!respuesta\` para ver la explicación completa o \`!pregunta\` para otra.`);
    } else {
      message.reply(
        `❌ **Incorrecto.** Espabila o usa \`!respuesta\` para ver la respuesta.`
      );
    }
    return;
  }

  // Comando para unirse al canal de voz
  if (message.content === "!join") {
    if (!message.member?.voice.channel) {
      message.reply(
        "Por favor, entra a un canal de voz primero. Hay que organizarse bien..."
      );
      return;
    }

    joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild!.id,
      adapterCreator: message.guild!.voiceAdapterCreator,
    });

    message.reply(
      "Vale, ya estoy aquí. ¿Podéis callaros un poco por favor? 📋🎯"
    );
    return;
  }

  // Respuesta automática cuando Hugo dice algo de gemas
  if (
    message.author.username.toLowerCase().includes("fatlotus") ||
    message.author.username.toLowerCase().includes("hugo")
  ) {
    if (
      message.content.toLowerCase().includes("gema") ||
      message.content.toLowerCase().includes("build")
    ) {
      message.reply(`Pero Hugo... ¡que eres mago máquina! 🤦‍♂️
¿Para qué quieres poder de ataque?`);
      return;
    }
  }

  // Respuestas con IA - PERSONALIDAD DE ISMAEL CON ANTI-REPETICIÓN
  try {
    let attempts = 0;
    let reply = "";

    const systemPrompt = `Eres ISMAEL (NINS) directamente. NO eres un bot hablando de Ismael, ERES Ismael.

PERSONALIDAD:
- Eres el raidleader sensato y crítico del grupo
- Cuestionas los builds sin sentido de Hugo pero NO repitas las mismas críticas
- Eres organizado y te gusta que las cosas se hagan bien
- Eres la voz de la razón pero te diviertes molestando a Hugo
- Eres un poco sarcástico y directo 
- Crees que eres el mejor raidleader de la historia

FRASES FAMOSAS (úsalas OCASIONALMENTE, no siempre):
- "Por favor, ¿podemos vernos la guía de este boss antes?"
- "Alex te lo vas a tomar un mínimo en serio por favor?"
- "Hector ¿puedes por favor no trolear a la raid con el puto tren?"
- "que eres mago máquina!" (solo cuando Hugo haga algo muy ilógico)
- "Pero Hugo que tú no usas poder de ataque"
- "Tio llevo trabajando 12 horas hoy, no me toquéis los cojones"
- "¿Sois tontos?"

REGLAS IMPORTANTES:
- NO digas "que eres mago máquina!" en cada respuesta
- NO repitas las mismas críticas a Hugo constantemente
- Varía tus respuestas, sé natural
- Responde al contexto específico de la pregunta
- Máximo 1-2 líneas por respuesta
- Sé crítico pero constructivo y variado
- Propón soluciones, no solo quejas`;

    do {
      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 100, // Más corto = menos repetitivo
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content:
              message.content +
              (attempts > 0 ? " (Responde de forma diferente)" : ""),
          },
        ],
      });

      reply =
        response.content[0].type === "text" ? response.content[0].text : "";
      attempts++;
    } while (isResponseTooSimilar(reply) && attempts < 3);

    // Guardar la respuesta para evitar futuras repeticiones
    lastResponses.push(reply);
    if (lastResponses.length > MAX_RECENT_RESPONSES) {
      lastResponses.shift(); // Eliminar la más antigua
    }

    message.reply(reply || "Vamos a organizarnos mejor...");
  } catch (error: any) {
    // Respuestas de fallback variadas para Ismael
    const fallbacks = [
      "Error en mi sistema de organización... 📋💥",
      "Mis herramientas de planificación están fallando...",
      "Dame un momento, estoy reorganizando la estrategia...",
      "Problema técnico... ¿Podemos hacer una pausa?",
    ];
    const randomFallback =
      fallbacks[Math.floor(Math.random() * fallbacks.length)];
    message.reply(randomFallback);
    console.error("Error:", error);
  }
});

client.login(process.env.BOT2_TOKEN);
