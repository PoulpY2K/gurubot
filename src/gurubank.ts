import type {Player, Bank} from '@prisma/client/index';
import {EmbedBuilder, GuildMember, UserContextMenuCommandInteraction} from "discord.js";
import type {EmbedBuilder as EmbedBuilderType} from "discord.js";

export const GurubankEmbed = (interaction: UserContextMenuCommandInteraction, player: Player & { coins: Bank | null }): EmbedBuilderType | null => {
    const member = interaction.member as GuildMember ?? undefined;

    let embed = null;
    if (interaction.user && member) {
        embed = new EmbedBuilder()
            .setTitle(`Gurubank de ${member.displayName}`)
            .setThumbnail("https://cdn.discordapp.com/attachments/873566730495066163/1042752506758955018/Divine_Gate.png")
            .setColor(0x8636B1)
            .setDescription(`${interaction.user}, voici le contenu de votre \`\`Gurubank\`\`.`)
            .addFields(
                {name: 'Pain Coins', value: `${player.coins?.painCoin ?? 0} <:paincoin:873563604992016485>`, inline: true},
                {name: 'Agony Coins', value: `${player.coins?.agonyCoin ?? 0} <:agonycoin:873566300608299029>`, inline: true},
                {name: 'Despair Coins', value: `${player.coins?.despairCoin ?? 0} <:despaircoin:873568372112105523>`, inline: true},
            )
            .setFooter({
                text: `Demandé par ${member.displayName ?? "N/A"}`,
                iconURL: member.avatarURL() ?? undefined
            })
            .setTimestamp(new Date());
    }

    return embed;
}