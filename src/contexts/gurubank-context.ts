import type {UserContextMenuCommandInteraction} from "discord.js";
import {ApplicationCommandType} from "discord.js";
import {ContextMenu, Discord} from "discordx";
import {Logger} from "tslog";
import {PrismaClient} from "@prisma/client";

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
            interaction.reply({
                    content: `Vous avez ${player.coins.painCoin} Pain Coins, ${player.coins.agonyCoin} Agony Coins, ${player.coins.despairCoin} Despair Coins`,
                    ephemeral: true,
                }
            ).then(() => {
                logger.trace(`${interaction.user.username} used Gurubank`);
            });
        }
    }
}
