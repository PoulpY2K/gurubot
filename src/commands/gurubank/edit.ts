import type {Bank, Player} from "@prisma/client/index";
import {PrismaClient} from "@prisma/client";
import {
    CommandInteraction, ModalSubmitInteraction, ActionRowBuilder, ApplicationCommandType, ApplicationCommandOptionType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle, User, UserContextMenuCommandInteraction, ContextMenuCommandInteraction,
} from "discord.js";

import {ContextMenu, Discord, ModalComponent, Slash, SlashOption} from "discordx";

import {Logger} from "tslog";
import PlayerHelper from "../../database/player-helper.js";
import EmbedHelper from "./embed-helper.js";

export const prisma = new PrismaClient()

const logger = new Logger({name: "gurubank.edit"});

const createCoinTextInput = (customId: string, label: string, placeholder: string, value: number): TextInputBuilder => {
    return new TextInputBuilder()
        .setCustomId(customId)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(2)
        .setLabel(label)
        .setPlaceholder(placeholder)
        .setValue(value.toString())
        .setStyle(TextInputStyle.Short)
}
const createGurubankModal = (customId: string, target: Player & { coins: Bank | null } | null): ModalBuilder => {
    let modal = new ModalBuilder();

    if (target && target.coins) {
        // Create the modal
        modal.setTitle(`Gurubank de ${target.displayName}`)
            .setCustomId(customId) //GurubankModal

        // Create text input fields
        const painCoins = createCoinTextInput(
            "painCoins",
            "Pain Coins 🩸",
            "Nombre de PC",
            target.coins.painCoin
        );

        const agonyCoins = createCoinTextInput(
            "agonyCoins",
            "Agony Coins 🔪",
            "Nombre d'AC",
            target.coins.agonyCoin
        );

        const despairCoins = createCoinTextInput(
            "despairCoins",
            "Despair Coins ☠️",
            "Nombre de DC",
            target.coins.despairCoin
        );

        const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(painCoins);
        const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(agonyCoins);
        const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(despairCoins);

        // Add action rows to form
        modal.addComponents(firstRow, secondRow, thirdRow);
    }

    return modal;
}

@Discord()
export class GurubankModal {
    player: Player & { coins: Bank | null } | null = null;
    user: User | null = null;

    @ContextMenu({name: "Modifier la Gurubank", type: ApplicationCommandType.User})
    async handle(interaction: UserContextMenuCommandInteraction): Promise<void> {
        if (interaction.targetUser.bot) {
            await interaction.reply({content: "❌ Vous ne pouvez pas interagir avec un bot !", ephemeral: true})
            return;
        }

        this.player = await PlayerHelper.findUniquePlayerWithBank(interaction.targetUser.id);
        this.user = interaction.targetUser;

        const modal = createGurubankModal("GurubankModal", this.player)

        // Present the modal to the user
        await interaction.showModal(modal);
    }

    @Slash({description: "Modifier le contenu de la Gurubank d'un joueur"})
    async edit(
        @SlashOption({
            description: "Pseudo du joueur",
            name: "user",
            required: true,
            type: ApplicationCommandOptionType.User,
        })
            user: User,
        interaction: CommandInteraction): Promise<void> {
        if (user) {
            if (user.bot) {
                await interaction.reply({content: "❌ Vous ne pouvez pas interagir avec un bot !", ephemeral: true})
                return;
            }

            this.player = await PlayerHelper.findUniquePlayerWithBank(user.id);
            this.user = user;

            const modal = createGurubankModal("GurubankModal", this.player)

            // Present the modal to the user
            await interaction.showModal(modal);
        }
    }

    @ModalComponent()
    async GurubankModal(interaction: ModalSubmitInteraction): Promise<void> {
        const [painCoins, agonyCoins, despairCoins] = ["painCoins", "agonyCoins", "despairCoins"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        if (this.player && this.player.coins) {
            const playerDiscordId = this.player.discordId

            await prisma.bank.update({
                where: {
                    id: this.player.id
                },
                data: {
                    painCoin: +painCoins,
                    agonyCoin: +agonyCoins,
                    despairCoin: +despairCoins
                }
            }).then(async (player) => {
                this.player = await PlayerHelper.findUniquePlayerWithBank(playerDiscordId);

                if (interaction.guild && this.player && this.player.coins && this.user) {
                    const target = interaction.guild.members.cache.get(this.user.id);

                    const embed = EmbedHelper.createGurubankEmbed(interaction, this.player, target)
                    await interaction.reply({embeds: [embed], ephemeral: true})

                    this.player = null;
                    return;
                }
            }).catch(error => {
                this.player = null;
                logger.error(error)
            })
        }
    }

}