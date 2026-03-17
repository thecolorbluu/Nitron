const { PermissionsBitField, inlineCode } = require('discord.js');
const config = require('../../config');
const timeMap = {
  "day": 86400,
  "hour": 3600,
  "minute": 60,
  "second": 1
};

function parseDuration(duration) {
  const split = duration.toLowerCase().split(' ');
  let totalDuration = 0;
  for (let i=0; split.length>i+1; i+=2) {
    const value1 = split[i];
    if (!Number(value1)) continue;
    const value2 = split[i+1].replace(/s$/, '');
    totalDuration += value1 * ( timeMap[value2] ?? 1 );
  }
  return totalDuration;
};

const slowmode = async (interaction) => {
  const modRole = await interaction.guild.roles.fetch(config.modRoleId);
  const slowmodeEnabled = interaction.options.getBoolean('state');
  let slowmodeTime = interaction.options.getString('time');
  const slowmodeReason = interaction.options.getString('reason');

  if (slowmodeTime === null) {
    slowmodeTime = 30;
  }

  const currentRateLimit = interaction.channel.rateLimitPerUser;

  if (slowmodeEnabled) {
    if (slowmodeTime === 'freeze') {
      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          [PermissionsBitField.Flags.SendMessages]: false,
          [PermissionsBitField.Flags.CreatePublicThreads]: false,
          [PermissionsBitField.Flags.CreatePrivateThreads]: false,
        }
      );

      await interaction.channel.permissionOverwrites.edit(modRole, {
        [PermissionsBitField.Flags.SendMessages]: true,
        [PermissionsBitField.Flags.CreatePublicThreads]: true,
        [PermissionsBitField.Flags.CreatePrivateThreads]: true,
      });

      return await interaction.reply(
        `❄️ Channel has been frozen. Only moderators can send messages or create threads.`
      );
    }

    slowmodeTime = parseDuration(slowmodeTime);

    if (currentRateLimit > 0) {
      if (currentRateLimit === slowmodeTime) {
        return await interaction.reply(
          `⏳ Slowmode is already set to **${slowmodeTime} second(s)**.`
        );
      }
      await interaction.channel.setRateLimitPerUser(
        slowmodeTime,
        `Slowmode updated by ${interaction.user.username} for reason: ` +
          (slowmodeReason ?? 'No reason provided')
      );
      return await interaction.reply(
        `🌨️ Slowmode updated to **${slowmodeTime} second(s)**.`
      );
    }

    await interaction.channel.setRateLimitPerUser(
      slowmodeTime,
      `Slowmode set by ${interaction.user.username} for reason: ` +
        (slowmodeReason ?? 'No reason provided')
    );
    return await interaction.reply(
      `🌨️ Slowmode enabled for **${slowmodeTime} second(s)**.`
    );
  }

  if (!slowmodeEnabled) {
    await interaction.channel.permissionOverwrites.edit(
      interaction.guild.roles.everyone,
      {
        [PermissionsBitField.Flags.SendMessages]: null,
        [PermissionsBitField.Flags.CreatePublicThreads]: null,
        [PermissionsBitField.Flags.CreatePrivateThreads]: null,
      }
    );

    await interaction.channel.permissionOverwrites.edit(modRole, {
      [PermissionsBitField.Flags.SendMessages]: null,
      [PermissionsBitField.Flags.CreatePublicThreads]: null,
      [PermissionsBitField.Flags.CreatePrivateThreads]: null,
    });

    await interaction.channel.setRateLimitPerUser(
      0,
      `Slowmode and freeze disabled by ${interaction.user.username} for reason: ` +
        (slowmodeReason ?? 'No reason provided')
    );
    return await interaction.reply(
      `⛅ Slowmode and freeze have been disabled in this channel.`
    );
  }
};

module.exports = {
  slowmode,
};
