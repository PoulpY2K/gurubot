import type {UserContextMenuCommandInteraction} from "discord.js";
import {ApplicationCommandType} from "discord.js";
import {ContextMenu, Discord} from "discordx";
import {Logger} from "tslog";

const logger = new Logger({name: "choices"});

@Discord()
export class BankContext {
    @ContextMenu({name: "user context", type: ApplicationCommandType.User})
    userHandler(interaction: UserContextMenuCommandInteraction): void {
        interaction.reply("I am user context handler").then(() => {
            logger.trace(`${interaction.user.username} used user context`);
        });
    }
}
