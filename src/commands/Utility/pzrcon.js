import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { sendRconCommand, isPzRconConfigured } from '../../services/pzRconService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pzrcon')
    .setDescription('Send a command to the Project Zomboid server')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('The server command to run (e.g. players, save, additem)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const deferSuccess = await InteractionHelper.safeDefer(interaction, { ephemeral: true });
      if (!deferSuccess) {
        logger.warn(`PZRcon interaction defer failed`, {
          userId: interaction.user.id,
          guildId: interaction.guildId,
          commandName: 'pzrcon'
        });
        return;
      }

      if (!isPzRconConfigured()) {
        const embed = createEmbed({
          title: 'PZ RCON Not Configured',
          description: 'Set `PZ_RCON_HOST`, `PZ_RCON_PORT`, and `PZ_RCON_PASSWORD` in the bot\'s environment before using this command.'
        });
        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        return;
      }

      const command = interaction.options.getString('command');
      const response = await sendRconCommand(command);

      const embed = createEmbed({
        title: 'PZ Server Command Executed',
        description: `**Command:** \`${command}\``
      }).addFields(
        {
          name: 'Response',
          value: response && response.trim().length > 0
            ? '```' + response.slice(0, 1000) + '```'
            : '*(no response text)*'
        }
      );

      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });

      logger.info(`PZRcon command executed`, {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        command
      });
    } catch (error) {
      logger.error(`PZRcon command execution failed`, {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        commandName: 'pzrcon'
      });
      await handleInteractionError(interaction, error, {
        commandName: 'pzrcon',
        source: 'pzrcon_command'
      });
    }
  },
};