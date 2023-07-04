import {prisma} from "../main.js";
import {GuildMember} from "discord.js";
import {Player} from "@prisma/client/index";
import {Logger} from "tslog";
import {Bank} from "@prisma/client";

const logger = new Logger({name: "database.player.helper"});

export default {
    findUniqueByMemberId: async (member: GuildMember) => {
        const player: Player | null = await prisma.player.findUnique({
            where: {discordId: member.id}
        });
        if (player) {
            logger.debug(`[DB] Found member: ${member.displayName} with ID ${player.id}`)
        } else {
            logger.debug(`[DB] Couldn't find member ${member.displayName} with ID ${member.id}`)
        }
        return player;
    },
    findUniquePlayerWithBank: async (discordId: string) => {
        const player: Player & { coins: Bank | null } | null = await prisma.player.findUnique({
            where: {discordId: discordId},
            include: {coins: true},
        });
        if (player) {
            logger.debug(`[DB] Found member: ${player.displayName} with ID ${player.id}`)
        } else {
            logger.debug(`[DB] Couldn't find member with DiscordID ${discordId}`)
        }
        return player;
    },
    createPlayer: async (member: GuildMember) => {
        const player: Player = await prisma.player.create({
            data: {
                discordId: member.id,
                displayName: member.displayName,
                coins: {
                    create: {},
                },
                statistics: {
                    create: {},
                },
            }
        })
        logger.debug(`[DB] Created member: ${member.displayName} with ID ${player.id}`)
        return player;
    },
    updatePlayerDisplayName: async (user: Player, member: GuildMember) => {
        const player: Player = await prisma.player.update({
            where: {id: user.id},
            data: {
                displayName: member.displayName,
                updatedAt: new Date()
            }
        })
        logger.debug(`Updated displayName for member: ${member.displayName} with id ${user.id}`)
        return player;
    }
}