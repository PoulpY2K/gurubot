import {dirname, importx} from "@discordx/importer";
import type {Interaction, Message} from "discord.js";
import {IntentsBitField} from "discord.js";
import {Client} from "discordx";
import {PrismaClient} from '@prisma/client'
import {Logger} from "tslog";

const logger = new Logger({name: "main"});
export const prisma = new PrismaClient()

export const bot = new Client({
    // To use only guild command
    botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

    // Discord intents
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildVoiceStates,
    ],

    // Debug logs are disabled in silent mode
    silent: false,
});

bot.once("ready", async () => {
    // Make sure all guilds are cached
    await bot.guilds.fetch();

    // Synchronize applications commands with Discord
    await bot.initApplicationCommands();

    // To clear all guild commands, uncomment this line,
    // This is useful when moving from guild commands to global commands
    // It must only be executed once
    //
    // await bot.clearApplicationCommands(
    //    ...bot.guilds.cache.map((g) => g.id)
    // );

    // Make sure all guruland members are cached
    const gurulandMembers = await bot.guilds.cache.get("861596038066733156")?.members.fetch();

    if (gurulandMembers) {
        for (const [, member] of gurulandMembers) {
            if (!member.user.bot) {
                let user = await prisma.player.findUnique({
                    where: {discordId: member.id}
                });

                if (!user) {
                    user = await prisma.player.create({
                        data: {
                            discordId: member.id,
                            coins: {
                                create: {},
                            },
                            statistics: {
                                create: {},
                            },
                        }
                    })
                    logger.trace(`Created member: ${member.displayName} with id ${user.id}`)
                }
            }
        }
    }

    logger.trace("Bot started");
});

bot.on("interactionCreate", (interaction: Interaction) => {
    bot.executeInteraction(interaction);
});

bot.on("messageCreate", (message: Message) => {
    bot.executeCommand(message).then(() => {
        if (!bot.silent) {
            logger.debug(`Command executed: ${message.content}`);
        }
    });
});

async function run() {
    // The following syntax should be used in the ECMAScript environment
    await importx(`${dirname(import.meta.url)}/{events,commands,contexts}/**/*.{ts,js}`);

    // Let's start the bot
    if (!process.env.BOT_TOKEN) {
        const error = Error("Could not find BOT_TOKEN in your environment")
        logger.fatal(error);
        throw error;
    }

    // Log in with your bot token
    await bot.login(process.env.BOT_TOKEN);
}

run().then(() => {
    logger.trace("Bot is starting");
});
