require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Mémoire de conversation par salon
const conversationHistory = new Map();
const MAX_HISTORY = 10; // Nombre de messages mémorisés
const {
  Client, GatewayIntentBits, Partials, ChannelType,
  PermissionFlagsBits, EmbedBuilder
} = require('discord.js');

// Création du bot avec les permissions nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Quand le bot se connecte
const { ActivityType } = require('discord.js');

client.once('ready', () => {
  console.log(`✅ Bot en ligne : ${client.user.tag}`);
  client.user.setActivity('Elite Dangerous 🫣', {
    type: ActivityType.Streaming,
    url: 'https://www.twitch.tv/petogaz'
  });
});

// Quand quelqu'un utilise une commande slash
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const cmd = interaction.commandName;

    // ─── /warn ───────────────────────────────────────────
    if (cmd === 'warn') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const user   = interaction.options.getUser('utilisateur');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      const embed  = new EmbedBuilder()
        .setColor('#FFA500').setTitle('⚠️ Avertissement')
        .addFields(
          { name: 'Utilisateur', value: `${user}`, inline: true },
          { name: 'Modérateur',  value: `${interaction.user}`, inline: true },
          { name: 'Raison',      value: raison }
        ).setTimestamp();
      try { await user.send({ embeds: [embed] }); } catch {}
      await interaction.reply({ embeds: [embed] });
    }

    // ─── /mute ───────────────────────────────────────────
    if (cmd === 'mute') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const user   = interaction.options.getUser('utilisateur');
      const duree  = interaction.options.getInteger('duree');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });

      await member.timeout(duree * 60 * 1000, raison);
      const embed = new EmbedBuilder()
        .setColor('#FF0000').setTitle('🔇 Mute')
        .addFields(
          { name: 'Utilisateur', value: `${user}`, inline: true },
          { name: 'Durée', value: `${duree} minute(s)`, inline: true },
          { name: 'Modérateur', value: `${interaction.user}`, inline: true },
          { name: 'Raison', value: raison }
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // ─── /unmute ──────────────────────────────────────────
    if (cmd === 'unmute') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const user   = interaction.options.getUser('utilisateur');
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      await member.timeout(null);
      await interaction.reply({ content: `✅ ${user} a été unmute.` });
    }

    // ─── /ban ────────────────────────────────────────────
    if (cmd === 'ban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const user   = interaction.options.getUser('utilisateur');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      try {
        await interaction.guild.members.ban(user.id, { reason: raison });
        const embed = new EmbedBuilder()
          .setColor('#8B0000').setTitle('🔨 Ban')
          .addFields(
            { name: 'Utilisateur', value: `${user.tag}`, inline: true },
            { name: 'Modérateur',  value: `${interaction.user.tag}`, inline: true },
            { name: 'Raison',      value: raison }
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ content: '❌ Impossible de bannir.', ephemeral: true });
      }
    }

    // ─── /unban ───────────────────────────────────────────
    if (cmd === 'unban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const userId = interaction.options.getString('userid');
      try {
        await interaction.guild.members.unban(userId);
        await interaction.reply({ content: `✅ Utilisateur débanni.` });
      } catch {
        await interaction.reply({ content: '❌ ID invalide ou utilisateur non banni.', ephemeral: true });
      }
    }

    // ─── /kick ───────────────────────────────────────────
    if (cmd === 'kick') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const user   = interaction.options.getUser('utilisateur');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      try {
        await member.kick(raison);
        const embed = new EmbedBuilder()
          .setColor('#FF4500').setTitle('👢 Kick')
          .addFields(
            { name: 'Utilisateur', value: `${user.tag}`, inline: true },
            { name: 'Modérateur',  value: `${interaction.user.tag}`, inline: true },
            { name: 'Raison',      value: raison }
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ content: '❌ Impossible de kicker.', ephemeral: true });
      }
    }

    // ─── /annonce ─────────────────────────────────────────
    if (cmd === 'annonce') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const texte  = interaction.options.getString('message');
      const titre  = interaction.options.getString('titre') || '📢 Annonce';
      const salon  = interaction.options.getChannel('salon') || interaction.channel;
      const couleur= interaction.options.getString('couleur') || '#7289DA';

      const embed = new EmbedBuilder()
        .setColor(couleur).setTitle(titre).setDescription(texte)
        .setTimestamp()
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

      await salon.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ Annonce envoyée dans ${salon} !`, ephemeral: true });
    }

    // ─── /clear ───────────────────────────────────────────
    if (cmd === 'clear') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const nb = interaction.options.getInteger('nombre');
      await interaction.channel.bulkDelete(nb, true);
      await interaction.reply({ content: `✅ ${nb} messages supprimés.`, ephemeral: true });
    }

    // ─── /slowmode ────────────────────────────────────────
    if (cmd === 'slowmode') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const duree = interaction.options.getInteger('duree');
      await interaction.channel.setRateLimitPerUser(duree);
      const msg = duree === 0
        ? '✅ Slowmode désactivé.'
        : `✅ Slowmode réglé à ${duree} seconde(s).`;
      await interaction.reply({ content: msg, ephemeral: true });
    }

    // ─── /userinfo ────────────────────────────────────────
    if (cmd === 'userinfo') {
      const user   = interaction.options.getUser('utilisateur') || interaction.user;
      const member = interaction.guild.members.cache.get(user.id);
      const roles  = member?.roles.cache
        .filter(r => r.name !== '@everyone')
        .map(r => r.toString()).join(', ') || 'Aucun';

      const embed = new EmbedBuilder()
        .setColor('#7289DA').setTitle(`👤 Infos : ${user.tag}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '📅 Compte créé', value: ``, inline: true },
          { name: '📥 A rejoint', value: member ? `` : 'Inconnu', inline: true },
          { name: '🎭 Rôles', value: roles }
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // ─── /serverinfo ─────────────────────────────────────
    if (cmd === 'serverinfo') {
      const g = interaction.guild;
      const embed = new EmbedBuilder()
        .setColor('#7289DA').setTitle(`🏠 ${g.name}`)
        .setThumbnail(g.iconURL())
        .addFields(
          { name: '👑 Propriétaire', value: `<@${g.ownerId}>`, inline: true },
          { name: '👥 Membres', value: `${g.memberCount}`, inline: true },
          { name: '📅 Créé le', value: ``, inline: true },
          { name: '💬 Salons', value: `${g.channels.cache.size}`, inline: true },
          { name: '🎭 Rôles', value: `${g.roles.cache.size}`, inline: true }
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
    // ─── /dm (utilisateurs ou rôle entier) ───────────────
    if (cmd === 'dm') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: '❌ Tu n\'as pas la permission.', ephemeral: true });

      const message      = interaction.options.getString('message');
      const role         = interaction.options.getRole('role');
      const staffChannel = interaction.guild.channels.cache.get(process.env.STAFF_CHANNEL_ID);

      await interaction.deferReply({ ephemeral: true });

      let cibles = [];

      if (role) {
        // ── Mode rôle : on récupère tous les membres ayant ce rôle ──
        await interaction.guild.members.fetch();
        cibles = interaction.guild.members.cache
          .filter(m => m.roles.cache.has(role.id) && !m.user.bot)
          .map(m => m.user);

        if (cibles.length === 0)
          return interaction.editReply({ content: `❌ Aucun membre trouvé avec le rôle ${role}.` });

      } else {
        // ── Mode utilisateurs individuels (jusqu'à 5) ──
        cibles = [
          interaction.options.getUser('utilisateur1'),
          interaction.options.getUser('utilisateur2'),
          interaction.options.getUser('utilisateur3'),
          interaction.options.getUser('utilisateur4'),
          interaction.options.getUser('utilisateur5'),
        ].filter(u => u !== null);

        if (cibles.length === 0)
          return interaction.editReply({ content: '❌ Tu dois renseigner au moins un utilisateur ou un rôle.' });
      }

      const resultats = [];

      for (const user of cibles) {
        try {
          const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('📩 Nouveau message 📩')
            .setDescription(message)
            .setFooter({ text: `Serveur : ${interaction.guild.name}` })
            .setTimestamp();

          await user.send({ embeds: [embed] });
          resultats.push(`✅ ${user.tag}`);

          // Log dans le salon staff
          if (staffChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor('#FFA500')
              .setTitle('📤 DM envoyé')
              .addFields(
                { name: 'Destinataire', value: `${user} (${user.tag})`, inline: true },
                { name: 'Envoyé par',   value: `${interaction.user}`, inline: true },
                { name: 'Via', value: role ? `Rôle @${role.name}` : 'Sélection manuelle', inline: true },
                { name: 'Message',      value: message }
              )
              .setTimestamp();
            await staffChannel.send({ embeds: [logEmbed] });
          }

          // Pause d'1 seconde entre chaque envoi pour éviter d'être bloqué par Discord
          await new Promise(r => setTimeout(r, 1000));

        } catch {
          resultats.push(`❌ ${user.tag} (DMs fermés)`);
        }
      }

      // Résumé final (raccourci si trop long)
      const resume = role
        ? `📬 DM envoyé à ${resultats.length} membre(s) du rôle **@${role.name}** :\n${resultats.join('\n')}`
        : `📬 **Résumé des envois :**\n${resultats.join('\n')}`;

      if (resume.length > 1900) {
        const ok = resultats.filter(r => r.startsWith('✅')).length;
        const ko = resultats.filter(r => r.startsWith('❌')).length;
        await interaction.editReply({ content: `📬 Envoi terminé — ✅ ${ok} réussi(s), ❌ ${ko} échoué(s).` });
      } else {
        await interaction.editReply({ content: resume });
      }
    }
	
  } catch (err) {
    console.error('Erreur commande:', err);
    const msg = { content: '❌ Une erreur est survenue.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});
// ─── Redirection des réponses DM vers le salon staff ────
client.on('messageCreate', async message => {
  // On ignore les messages du bot lui-même
  if (message.author.bot) return;

  // On vérifie que c'est bien un DM (type 1 = message privé)
  if (message.channel.type !== ChannelType.DM) return;

  const guild = client.guilds.cache.first();
  if (!guild) return;

  const staffChannel = guild.channels.cache.get(process.env.STAFF_CHANNEL_ID);
  if (!staffChannel) return;

  // Embed affiché dans le salon staff
  const embed = new EmbedBuilder()
    .setColor('#00C853')
    .setTitle('📨 Réponse DM reçue')
    .setThumbnail(message.author.displayAvatarURL())
    .addFields(
      { name: '👤 Membre', value: `${message.author} (${message.author.tag})`, inline: true },
      { name: '🆔 ID',     value: message.author.id, inline: true },
      { name: '💬 Message', value: message.content || '*(aucun texte)*' }
    )
    .setTimestamp()
    .setFooter({ text: 'Message reçu en DM' });

  // Si le membre a joint un fichier ou une image
  if (message.attachments.size > 0) {
    const fichiers = message.attachments.map(a => a.url).join('\n');
    embed.addFields({ name: '📎 Fichier(s) joint(s)', value: fichiers });
  }

  await staffChannel.send({ embeds: [embed] });

  // Accusé de réception automatique envoyé au membre
  await message.reply('👍');
});
// Connexion du bot
// ─── IA : répond quand le bot est mentionné ──────────────
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.mentions.has(client.user)) return;

  const systemPrompt = 'Tu es la personnalité IA officiel de [Petogaz]. Tu t\'appelles [PetoGOAT] et tu es chaleureux, fun et proche de la communauté. Tu réponds toujours en français. Tu tutoies tout le monde. Tu utilises des emojis avec modération.';

  const userMessage = message.content
    .replace('<@' + client.user.id + '>', '').trim();

  if (!userMessage)
    return message.reply('Tu voulais me dire quelque chose ? 😊');

  const channelId = message.channel.id;
  if (!conversationHistory.has(channelId))
    conversationHistory.set(channelId, []);
  const history = conversationHistory.get(channelId);

  history.push({
    role: 'user',
    content: message.author.username + ' : ' + userMessage
  });

  if (history.length > MAX_HISTORY)
    history.splice(0, history.length - MAX_HISTORY);

  await message.channel.sendTyping();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: systemPrompt,
      messages: history,
    });

    const reply = response.content[0].text;
    history.push({ role: 'assistant', content: reply });

    if (reply.length <= 2000) {
      await message.reply(reply);
    } else {
      const chunks = reply.match(/.{1,1990}/gs) || [];
      for (const chunk of chunks) await message.channel.send(chunk);
    }

  } catch (err) {
    console.error('Erreur API Anthropic:', err);
    await message.reply('Désolé, problème technique ! Réessaie dans un moment 🙏');
  }
});
client.login(process.env.TOKEN);
