import {PrismaClient} from "@prisma/client";
import type {Bank, Player} from '@prisma/client/index';
import {ContextMenu, Discord, Slash, SlashOption} from "discordx";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    CommandInteraction,
    User,
    UserContextMenuCommandInteraction
} from "discord.js";
import PlayerHelper from "../../database/player-helper.js";
import EmbedHelper from "./embed-helper.js";

export const prisma = new PrismaClient()

export const getPlayerFromInteractionAndTarget = async (interaction: CommandInteraction | UserContextMenuCommandInteraction, target: User): Promise<Player & {
    coins: Bank | null
} | null> => {
    const isInteractionUserNotTarget = target && interaction.user.username !== target.username
    return await PlayerHelper.findUniquePlayerWithBank(isInteractionUserNotTarget ? target.id : interaction.user.id);
}

@Discord()
export class GurubankShow {
    @ContextMenu({name: "Voir la Gurubank", type: ApplicationCommandType.User})
    async handle(interaction: UserContextMenuCommandInteraction): Promise<void> {
        getPlayerFromInteractionAndTarget(interaction, interaction.targetUser).then(async (player) => {
            if (interaction.guild && player && player.coins) {
                const target = interaction.guild.members.cache.get(interaction.targetId);

                const embed = EmbedHelper.createGurubankEmbed(interaction, player, target)
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

                const embed = EmbedHelper.createGurubankEmbed(interaction, player, target)
                await interaction.reply({embeds: [embed], ephemeral: false})
            }
        });
    }
}

