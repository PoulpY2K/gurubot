import {PrismaClient} from "@prisma/client";
import type {Bank, Player} from '@prisma/client/index';
import {ContextMenu, Discord, Slash, SlashOption} from "discordx";
import type {EmbedBuilder as EmbedBuilderType} from "discord.js";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    User,
    UserContextMenuCommandInteraction
} from "discord.js";
import PlayerHelper from "../../database/player-helper";

export const prisma = new PrismaClient()

export const getPlayerFromInteractionAndTarget = async (interaction: CommandInteraction | UserContextMenuCommandInteraction, target: User): Promise<Player & {
    coins: Bank | null
} | null> => {
    const isInteractionUserNotTarget = target && interaction.user.username !== target.username
    return await PlayerHelper.findUniquePlayerWithBank(isInteractionUserNotTarget ? target.id : interaction.user.id);
}

export const createGurubankEmbed = (interaction: UserContextMenuCommandInteraction | CommandInteraction, player: Player & {
    coins: Bank | null
}, target: GuildMember | undefined = undefined): EmbedBuilderType => {
    const member = interaction.member as GuildMember;
    const embed = new EmbedBuilder();
    if (target) {
        embed
            .setThumbnail(target.displayAvatarURL())
            .setTitle(`Gurubank de ${target.displayName}`)
            .setDescription(`${member}, voici le contenu de la \`\`Gurubank\`\` de ${target}.`)
    } else {
        embed
            .setThumbnail(member.displayAvatarURL())
            .setTitle(`Gurubank de ${member.displayName}`)
            .setDescription(`${member}, voici le contenu de votre \`\`Gurubank\`\`.`)
    }

    embed
        .setColor(0x8636B1)
        .addFields({
                name: 'Pain Coins',
                value: `${player.coins?.painCoin ?? 0} <:paincoin:873563604992016485>`,
                inline: true
            },
            {
                name: 'Agony Coins',
                value: `${player.coins?.agonyCoin ?? 0} <:agonycoin:873566300608299029>`,
                inline: true
            },
            {
                name: 'Despair Coins',
                value: `${player.coins?.despairCoin ?? 0} <:despaircoin:873568372112105523>`,
                inline: true
            },
        )
        .setFooter({
            text: `Demandé par ${member.displayName ?? "N/A"}`,
            iconURL: member.avatarURL() ?? undefined
        })
        .setTimestamp(new Date());

    return embed;
}

@Discord()
export class GurubankShow {
    @ContextMenu({name: "Voir la Gurubank", type: ApplicationCommandType.User})
    async handle(interaction: UserContextMenuCommandInteraction): Promise<void> {
        getPlayerFromInteractionAndTarget(interaction, interaction.targetUser).then(async (player) => {
            if (interaction.guild && player && player.coins) {
                const target = interaction.guild.members.cache.get(interaction.targetId);

                const embed = createGurubankEmbed(interaction, player, target)
                await interaction.reply({embeds: [embed], ephemeral: true})
            }
        });
    }

    @Slash({description: "Voir la Gurubank d'un joueur"})
    async show(
        @SlashOption({
            description: "Pseudo du joueur",
            name: "user",
            required: true,
            type: ApplicationCommandOptionType.User,
        })
            user: User,
        interaction: CommandInteraction
    ): Promise<void> {
        getPlayerFromInteractionAndTarget(interaction, user).then(async (player) => {
            if (interaction.guild && player && player.coins) {
                const target = interaction.guild.members.cache.get(user.id);

                const embed = createGurubankEmbed(interaction, player, target)
                await interaction.reply({embeds: [embed], ephemeral: true})
            }
        });
    }
}

