import type {Bank, Player} from "@prisma/client/index";
import {PrismaClient} from "@prisma/client";
import {
    CommandInteraction, ModalSubmitInteraction, ActionRowBuilder, ApplicationCommandType, ApplicationCommandOptionType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle, User, UserContextMenuCommandInteraction, GuildMember,
} from "discord.js";

import {ContextMenu, Discord, ModalComponent, Slash, SlashGroup, SlashOption} from "discordx";

import {Logger} from "tslog";

export const prisma = new PrismaClient()

const logger = new Logger({name: "gurubank.modal"});

export const findUniquePlayerWithBank = async (discordId: string): Promise<Player & { coins: Bank | null } | null> => {
    return prisma.player.findUnique({
        where: {discordId: discordId},
        include: {coins: true},
    });
}

export const createCoinTextInput = (customId: string, label: string, placeholder: string, value: number): TextInputBuilder => {
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

export const createGurubankModal = (customId: string, target: Player & { coins: Bank | null } | null): ModalBuilder => {
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

    @ContextMenu({name: "Modifier la Gurubank", type: ApplicationCommandType.User})
    async handle(interaction: UserContextMenuCommandInteraction): Promise<void> {
        this.player = await findUniquePlayerWithBank(interaction.targetUser.id);

        const modal = createGurubankModal("GurubankModal", this.player)

        // Present the modal to the user
        await interaction.showModal(modal).then(() =>
            logger.trace("Gurubank modal has been opened by " + this.player?.displayName)
        );
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
            this.player = await findUniquePlayerWithBank(user.id);

            const modal = createGurubankModal("GurubankModal", this.player)

            // Present the modal to the user
            await interaction.showModal(modal).then(() =>
                logger.trace("Gurubank modal has been opened by " + this.player?.displayName)
            );
        }
    }

    @ModalComponent()
    async GurubankModal(interaction: ModalSubmitInteraction): Promise<void> {
        const [painCoins, agonyCoins, despairCoins] = ["painCoins", "agonyCoins", "despairCoins"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        if (this.player && this.player.coins) {
            await prisma.bank.update({
                where: {
                    id: this.player.id
                },
                data: {
                    painCoin: +painCoins,
                    agonyCoin: +agonyCoins,
                    despairCoin: +despairCoins
                }
            }).then(async () => {
                    await interaction.reply(
                        `Pain Coins: ${painCoins}, Agony Coins: ${agonyCoins}, Despair Coins: ${despairCoins}`
                    );

                    this.player = null;
                    return;
                }
            ).catch((error) => {
                this.player = null;
                logger.error(error)
            })
        }
    }
}