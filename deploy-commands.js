require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  // /warn
  new SlashCommandBuilder()
    .setName('warn').setDescription('Avertir un utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('L\'utilisateur').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison')),

  // /mute
  new SlashCommandBuilder()
    .setName('mute').setDescription('Mettre en sourdine un utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('L\'utilisateur').setRequired(true))
    .addIntegerOption(o => o.setName('duree').setDescription('Durée en minutes').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('raison').setDescription('Raison')),

  // /unmute
  new SlashCommandBuilder()
    .setName('unmute').setDescription('Enlever le mute d\'un utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('L\'utilisateur').setRequired(true)),

  // /ban
  new SlashCommandBuilder()
    .setName('ban').setDescription('Bannir un utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('L\'utilisateur').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison')),

  // /unban
  new SlashCommandBuilder()
    .setName('unban').setDescription('Débannir un utilisateur par son ID')
    .addStringOption(o => o.setName('userid').setDescription('L\'ID Discord de l\'utilisateur').setRequired(true)),

  // /kick
  new SlashCommandBuilder()
    .setName('kick').setDescription('Expulser un utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('L\'utilisateur').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison')),

  // /annonce
  new SlashCommandBuilder()
    .setName('annonce').setDescription('Envoyer une annonce stylisée')
    .addStringOption(o => o.setName('message').setDescription('Texte de l\'annonce').setRequired(true))
    .addStringOption(o => o.setName('titre').setDescription('Titre (optionnel)'))
    .addChannelOption(o => o.setName('salon').setDescription('Salon cible (optionnel)'))
    .addStringOption(o => o.setName('couleur').setDescription('Couleur hex ex: #FF0000 (optionnel)')),

  // /clear
  new SlashCommandBuilder()
    .setName('clear').setDescription('Supprimer des messages en masse')
    .addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages (max 100)').setRequired(true).setMinValue(1).setMaxValue(100)),

  // /slowmode
  new SlashCommandBuilder()
    .setName('slowmode').setDescription('Activer/désactiver le mode lent')
    .addIntegerOption(o => o.setName('duree').setDescription('Secondes (0 = désactiver)').setRequired(true).setMinValue(0).setMaxValue(21600)),
  
  // /dm
  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Envoyer un message privé à des membres ou à tout un rôle')
    .addStringOption(o =>
      o.setName('message').setDescription('Le message à envoyer').setRequired(true)
    )
    .addRoleOption(o =>
      o.setName('role').setDescription('Envoyer à tous les membres ayant ce rôle (prioritaire sur les utilisateurs)')
    )
    .addUserOption(o =>
      o.setName('utilisateur1').setDescription('1er membre (optionnel si un rôle est choisi)')
    )
    .addUserOption(o =>
      o.setName('utilisateur2').setDescription('2ème membre (optionnel)')
    )
    .addUserOption(o =>
      o.setName('utilisateur3').setDescription('3ème membre (optionnel)')
    )
    .addUserOption(o =>
      o.setName('utilisateur4').setDescription('4ème membre (optionnel)')
    )
    .addUserOption(o =>
      o.setName('utilisateur5').setDescription('5ème membre (optionnel)')
    ),
  
  // /userinfo
  new SlashCommandBuilder()
    .setName('userinfo').setDescription('Voir les infos d\'un utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('L\'utilisateur (optionnel)')),

  // /serverinfo
  new SlashCommandBuilder()
    .setName('serverinfo').setDescription('Voir les infos du serveur'),

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⏳ Enregistrement des commandes...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Toutes les commandes sont enregistrées !');
  } catch (err) {
    console.error('Erreur :', err);
  }
})();
