import {PrismaClient} from "@prisma/client";
import type {Player, Bank} from '@prisma/client/index';
import {Discord, ContextMenu, Slash, SlashGroup, SlashOption} from "discordx";
import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    CommandInteraction,
    EmbedBuilder,
    GuildMember, User,
    UserContextMenuCommandInteraction
} from "discord.js";
import type {EmbedBuilder as EmbedBuilderType} from "discord.js";
import {Logger} from "tslog";

const logger = new Logger({name: "gurubank.show"});
export const prisma = new PrismaClient()

export const findUniquePlayerWithBank = async (discordId: string): Promise<Player & { coins: Bank | null } | null> => {
    return prisma.player.findUnique({
        where: {discordId: discordId},
        include: {coins: true},
    });
}

export const getPlayerFromInteractionAndTarget = async (interaction: CommandInteraction | UserContextMenuCommandInteraction, target: User): Promise<Player & { coins: Bank | null } | null | undefined> => {
    let player;

    if (interaction.user.username !== target.username) {
        if (target) {
            player = await findUniquePlayerWithBank(target.id);
        }
    } else {
        player = await findUniquePlayerWithBank(interaction.user.id);
    }

    return player;
}

export const sendGurubankEmbed = async (interaction: CommandInteraction | UserContextMenuCommandInteraction, target: GuildMember | undefined, player: Player & { coins: Bank | null } | null | undefined, ephemeral: boolean = false): Promise<void> => {
    if (player && player.coins) {
        const embed = GurubankEmbed(interaction, player, target)
        if (embed) {
            await interaction.reply({
                    embeds: [embed],
                    ephemeral: ephemeral
                }
            )
        }
    }
}

export const GurubankEmbed = (interaction: UserContextMenuCommandInteraction | CommandInteraction, player: Player & { coins: Bank | null }, target: GuildMember | undefined = undefined): EmbedBuilderType | null => {
    const member = interaction.member as GuildMember;

    let embed = null;
    if (member) {

        embed = new EmbedBuilder();
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
            .addFields(
                {
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
    }

    return embed;
}

@Discord()
export class GurubankShow {
    @ContextMenu({name: "Voir la Gurubank", type: ApplicationCommandType.User})
    async handle(interaction: UserContextMenuCommandInteraction): Promise<void> {
        getPlayerFromInteractionAndTarget(interaction, interaction.targetUser).then(async (player) => {
            if (interaction.guild && player && player.coins) {
                const target = interaction.guild.members.cache.get(interaction.targetId);

                sendGurubankEmbed(interaction, target, player, true).then(() => {
                    let log: string = target ? `${(interaction.member as GuildMember).displayName} used the Gurubank on ${target.displayName}` : `${(interaction.member as GuildMember).displayName} used the Gurubank for themselves`;
                    logger.trace(log);
                });
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

                sendGurubankEmbed(interaction, target, player).then(() => {
                    let log: string = target ? `${(interaction.member as GuildMember).displayName} used the Gurubank on ${target.displayName}` : `${(interaction.member as GuildMember).displayName} used the Gurubank for themselves`;
                    logger.trace(log);
                });
            }
        });
    }
}

