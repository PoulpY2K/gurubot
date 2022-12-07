import type {UserContextMenuCommandInteraction} from "discord.js";
import {ApplicationCommandType} from "discord.js";
import {ContextMenu, Discord} from "discordx";
import {Logger} from "tslog";
import {PrismaClient} from "@prisma/client";
import {GurubankEmbed} from "../gurubank.js";

const logger = new Logger({name: "choices"});

export const prisma = new PrismaClient()

@Discord()
export class GurubankContext {
    @ContextMenu({name: "Gurubank", type: ApplicationCommandType.User})
    async userHandler(interaction: UserContextMenuCommandInteraction): Promise<void> {

        const player = await prisma.player.findUnique({
            where: {discordId: interaction.user.id},
            include: {coins: true},
        });

        if (player && player.coins) {
            const embed = GurubankEmbed(interaction, player)

            if (embed) {
                await interaction.reply({
                        embeds: [embed],
                    }
                ).then(() => {
                    logger.trace(`${interaction.user.username} used the Gurubank`);
                });
            }
        }
    }
}
