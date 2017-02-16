// Discord.js
const Discord = require("discord.js");
// config file
const config = require("./config.json");

const level_alias = {
    0: "Membre",
    1: "Modérateur",
    2: "Administrateur",
    3: "Bot Owner"
}


// autoReconnect is enabled
var bot = new Discord.Client({autoReconnect: true});

// Ready? Set? Go!
bot.on('ready', () => {
    bot.user.setStatus("Online"); //dnd , online , ldle
    bot.user.setGame("Bot Discord, use " + config.prefix + "help");
    console.log("Bot connecté");
});

bot.on("disconnect", () => {
    console.log("Bot déconnecté");
});

bot.on("guildCreate", guild => {
    console.log(`Le bot a été ajouter sur : ${guild.name} (${guild.id}) | ${guild.members.size - 1} Clients totaux`);
})

bot.on("guildDelete", guild => {
    console.log(`Le bot a été supprimé sur : ${guild.name} (${guild.id})`);
})

bot.on("error", err => {
    console.log(err)
})

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n" + err.stack);
});

bot.on('message', m => {
    if (m.author.bot) return;
	
	
    if (checklevel(m.member) == 0) {
        if (capsLimit(m)) {
            m.delete();
            return m.reply("Calme toi sur les majuscules !")
                .then(m => {
                m.delete(3000)
            })
                .catch(console.error);
        }
    }
    if (!m.content.startsWith(config.prefix)) return;
    var cmd = m.content.split(' ')[0].substring(config.prefix.length).toLowerCase();
    let args = m.content.split(" ").slice(1).join(" ");
    if (commands.hasOwnProperty(cmd))
        if (checklevel(m.member) >= commands[cmd].level) {
            commands[cmd].exec(m);
			if(cmd !== "eval"){
            console.log("---------\n" +
                "\033[32;1m" + new Date() + "\033[0m\n" +
                "\033[33;1mCommand:\033[0m\033[33m " + cmd + "\033[0m\n" +
                "\033[33;1mArguments:\033[0m\033[33m " + args + "\033[0m\n" +
                "\033[31;1mUtilisateur:\033[0m\033[31m " + m.author.username + "(" + m.author.id + ")\033[0m\n" +
                "\033[36;1mAuthorized:\033[0m\033[36m " + (checklevel(m.member) >= commands[cmd].level) + "\033[0m")
			}
        } else {
            m.reply(`Vous n'avez pas la permission d'utiliser cette commande (Votre niveau de permission est trop faible: **${checklevel(m.member)}** au lieu de **${commands[cmd].level}**)`)
        }
});

var commands = {
        'help': {
            description: 'Affiche la liste des commandes disponible',
            syntax: config.prefix + 'help',
            level: 0,
            exec: function (message) {
                let embed = new Discord.RichEmbed().setTitle(`Liste des commandes sur le serveur ${message.guild.name}`).setColor("#FF7F50")
                    .addField('Aide pour la syntaxe', '[paramètre optionnel] <paramètre requis>');
                for (cmd in commands) {
                    if (commands[cmd].level <= checklevel(message.member))
                        embed.addField(`__**${cmd}**__`, "Description: " + commands[cmd].description + "\n"
                            + "Syntaxe: " + commands[cmd].syntax);
                }
                message.channel.sendEmbed(embed);

            }
        },
        'ping': {
            description: 'Affiche le temps que met le bot pour répondre',
            syntax: config.prefix + 'ping',
            level: 0,
            exec: function (message) {
                message.channel.sendMessage("Ping...")
                    .then(mm => {
                    mm.edit(`Pong, took ${mm.createdTimestamp - message.createdTimestamp} ms`)
                })
            }
        },     
        'serverinfo': {
            description: 'Affiche des informations sur le serveur Discord',
            syntax: config.prefix + 'serverinfo',
            level: 0,
            exec: function (message) {
                let embed = new Discord.RichEmbed().setTitle("Information sur le serveur Discord").setThumbnail(message.guild.iconURL)
                embed.addField("Nom du serveur", message.guild.name + '(' + message.guild.id + ')')
                embed.addField("Owner", message.guild.owner.user.username + '#' + message.guild.owner.user.discriminator + '(' + message.guild.owner.user.id + ')')
                embed.addField("Création du serveur", message.guild.createdAt)
                embed.addField("Région du serveur", message.guild.region)
                embed.addField("Nombre de membres", message.guild.memberCount)
                embed.addField("Nombre de roles", message.guild.roles.size)
                embed.addField("Nombre de channels textuel", message.guild.channels.array().filter(g => g.type == 'text').length)
                embed.addField("Nombre de channels audio", message.guild.channels.array().filter(g => g.type == 'voice').length)
                message.channel.sendEmbed(embed)
            }

        },
        'userinfo': {
            description: 'Affiche des informations sur soit même ou sur une autre personne',
            syntax: config.prefix + 'userinfo [@User Mention]',
            level: 0,
            exec: function (message) {
                let args = message.content.split(" ").slice(1);
                if (!args[0]) {
                    let user_level = checklevel(message.member);
                    let embed = new Discord.RichEmbed().setTitle(`Information pour ce membre`).setColor("#51adf6").setThumbnail(message.author.avatarURL)
                    embed.addField("Nom", message.author.username + "#" + message.author.discriminator + " (" + message.author.id + ")")
                    embed.addField("Alias", message.member.nickname)
					embed.addField("Rejoind le server",message.member.joinedAt)
                    embed.addField("Rôles", message.member.roles.array().splice(1).map(r =>r.name).join(", "))
                    embed.addField("Status", message.member.user.presence.status)
                    embed.addField("Permission level",user_level +" | "+ level_alias[user_level])
                    return message.channel.sendEmbed(embed);
                } else {
                    let guildMember = message.guild.member(message.mentions.users.first());
                    let user_level =  checklevel(guildMember)
                    if (!guildMember) return message.reply("Utilisateur inconnu.");
                    let embed = new Discord.RichEmbed().setColor("#51adf6").setThumbnail(guildMember.user.avatarURL)
                    embed.setTitle(`Information pour le membre ${guildMember.user.username}`)
                    embed.addField("Nom", guildMember.user.username + "#" + guildMember.user.discriminator + " (" + guildMember.id + ")")
                    embed.addField("Alias", guildMember.nickname)
					embed.addField("Rejoind le server",guildMember.joinedAt)
                    embed.addField("Rôles", guildMember.roles.array().splice(1).map(r =>r.name).join(", "))
                    embed.addField("Status", guildMember.user.presence.status)
                    embed.addField("Permission level",user_level +" | "+ level_alias[user_level])
                    embed.setColor("#51adf6");
                    return message.channel.sendEmbed(embed);
                }

            }
        },
		'version': {
			description: "Affiche la version du bot discord",
			syntax: config.prefix + "version",
			level: 0,
			exec: function(message){
				 let embed = new Discord.RichEmbed().setColor("#147006").setTitle("Information Bot discord").setThumbnail(bot.user.avatarURL)
				 embed.addField("Créateur","Sabrus")
				 embed.addField("Date de création",bot.user.createdAt)
				 embed.addField("Date de derniere modification", new Date(2017,02,16))
				 embed.addField("Version du bot","2.1")
				 embed.addField("API Discord",`Discord.js v${Discord.version}`)
				 return message.channel.sendEmbed(embed);
			}
			
		},
        'purge': {
            description: "Supprime tout les messages d'un montant donné",
            syntax: config.prefix + 'purge <nombre 2-100>',
            level: 1,
            exec: function (message) {
                let args = message.content.split(" ").slice(1);
                if (!args[0] || args[0] < 2 || args[0] > 100 || isNaN(args[0])) return message.reply("Veuillez indiquer une nombre de messages à supprimer entre 2 et 100 ")

                if (!message.member.hasPermission('MANAGE_MESSAGES') && !(checklevel(message) === 3)) {
                    return message.reply("Vous ne pouvez pas utiliser cette commande (MANAGE_MESSAGES) est requis")
                }

                if (!message.guild.member(bot.user).hasPermission('MANAGE_MESSAGES')) {
                    return message.reply("Le bot ne peut pas utiliser cette commande (MANAGE_MESSAGES) est requis")
                }
                message.delete()
                message.channel.fetchMessages({limit: parseInt(args[0])})
                    .then(messages => {

                    message.channel.bulkDelete(messages)
                        .then(m => {

                    })
                        .catch(console.error)

                    message.channel.sendMessage(`__**${messages.size}**__ message(s) ont été supprimés !`)
                        .then(mm => {
                        mm.delete(4000)
                    })
                })
                    .catch(console.error)


            }
        },
        'kick': {
            description: 'Ejecte une personne du serveur',
            syntax: config.prefix + 'kick <@User mention>',
            level: 1,
            exec: function (message) {

                if (!message.member.hasPermission('KICK_MEMBERS') && !(checklevel(message) === 3)) {
                    return message.reply("Vous ne pouvez pas utiliser cette commande (KICK_MEMBERS) est requis")
                }

                if (!message.guild.member(bot.user).hasPermission("KICK_MEMBERS")) {
                    return message.reply("Le bot ne peut pas utiliser cette commande (KICK_MEMBERS) est requis").catch(console.error);
                }

                if (message.mentions.users.size === 0) {
                    return message.reply("Veuillez mentionner une personne à kick.").catch(console.error);
                }

                let kickMember = message.guild.member(message.mentions.users.first());

                if (!kickMember) {
                    return message.reply("Cet utilisateur est incorrect ou n'existe pas")
                }

                kickMember.kick().then(member => {
                    message.reply(member.user.username + " à bien été éjecté du serveur")
                }).catch(console.error)

            }
        }
        ,
        'annonce': {
            description: 'Permet d\'effectuer une annonce dans un canal textuel',
            syntax: config.prefix + 'annonce [#channel] <message>',
            level: 1,
            exec: function (message) {
                let args = message.content.split(" ").slice(1);
                let annonce;
                if (message.mentions.channels.size === 0) {
                    var channel = message.channel
                    annonce = args.join(" ");
                } else {
                    channel = message.mentions.channels.first()
                    annonce = args.splice(1).join(" ");
                }
                if (!channel) return message.reply("Le channel ne semble pas valide")
					const embed = new Discord.RichEmbed().setTitle("__**ANNONCE**__").setColor("#F00")
						embed.setDescription(annonce)	
                channel.sendEmbed(embed)

            }
        },
        'say': {
            description: 'Le bot ecrit le message que vous lui demander dans un canal donnée',
            syntax: config.prefix + 'say [#channel] <message>',
            level: 1,
            exec: function (message) {
                let args = message.content.split(" ").slice(1);
				message.delete();
                let msg;
                if (message.mentions.channels.size === 0) {
                    var channel = message.channel
                    msg = args.join(" ");
                } else {
                    channel = message.mentions.channels.first()
                    msg = args.splice(1).join(" ");
                }
                if (!channel) return message.reply("Le channel ne semble pas valide")
                channel.sendMessage(`${msg}`).catch(console.error)
            }
        },
        'ban': {
            description: 'Ban une personne du serveur',
            syntax: config.prefix + 'ban <@User mention> [delete 0-7 day message]',
            level: 2,
            exec: function (message) {
                if (!message.member.hasPermission('BAN_MEMBERS') && !(checklevel(message) === 3)) {
                    return message.reply("Vous ne pouvez pas utiliser cette commande (BAN_MEMBERS) est requis")
                }

                if (!message.guild.member(bot.user).hasPermission("BAN_MEMBERS")) {
                    return message.reply("Le bot ne peut pas utiliser cette commande (BAN_MEMBERS) est requis")
                }

                if (message.mentions.users.size === 0) {
                    return message.reply("Veuillez mentionner une personne à bannir").catch(console.error);
                }

                let banMember = message.guild.member(message.mentions.users.first());
                if (!banMember) {
                    return message.reply("Cet utilisateur est incorrect ou n'existe pas");
                }
				
				if(!banMember.bannable){
					return message.reply("Cet utilisateur ne peut etre banni");
				}
				
                let args = message.content.split(" ").slice(1);
                if (isNaN(args[1]) || args[1] > 7) args[1] = 0;
                banMember.ban(parseInt(args[1]))
                    .then(member => {
                    return message.channel.sendMessage(`Le membre **${member.user.username}**(${member.user.id}) à bien été banni`)
                })
                    .catch(console.error)
            }
        },
        'unban': {
            description: 'Débannir une personne du serveur',
            syntax: config.prefix + 'unban <id>',
            level: 2,
            exec: function (message) {

                if (!message.member.hasPermission('BAN_MEMBERS') && !(checklevel(message) === 3)) {
                    return message.reply("Vous ne pouvez pas utiliser cette commande (BAN_MEMBERS) est requis")
                }

                if (!message.guild.member(bot.user).hasPermission("BAN_MEMBERS")) {
                    return message.reply("Le bot ne peut pas utiliser cette commande (BAN_MEMBERS) est requis")
                }
                let args = message.content.split(" ").slice(1);
                if (!args[0]) {
                    return message.reply("Veuillez indiquer un id à débannir")
                }

                if (!args[0].match(/^[0-9]{18}$/)) return message.reply("l'id n'est pas dans le bon format, il doit etre constitué de 18 caractere numérique");

                message.guild.fetchBans().then(ban => {
                    if (ban.has(parseInt(args[0]))) {
                        message.guild.unban(args[0])
                            .then(user =>
                            message.reply(`Cet utilisateur est maintenant débanni`))
                            .catch(console.error);

                    } else {
                        return message.reply(`Cet id est inconnu de la banlist`)
                    }

                }).catch(console.error);
            }
        }
        ,
        'eval': {
            description: "Permet d'exécuter du code directement",
            syntax: config.prefix + "eval <code>",
            level: 3,
            exec: function (message) {
                if (message.author.id !== "246779580902277121" && message.author.id !== "265018556133933068") return;
                let args = message.content.split(" ").slice(1);
                try {
                    var code = args.join(" ");
                    var evaled = eval(code);
                    if (typeof evaled !== "string")
                        evaled = require("util").inspect(evaled);
                    message.channel.sendCode("javascript", clean(evaled));
                } catch (err) {
                    message.channel.sendMessage(`\`ERROR\` \`\`\`javascript\n${clean(err)}\n\`\`\``);
                }
            }
        }

    }
    ;


function checklevel(user) {
    if (user.id === '246779580902277121') {
        return 3;
	}
    if (user.id === '265018556133933068') {
        return 3;
    }

    if (user.guild.ownerID === user.id) {
        return 2;
    }

    let level = user.highestRole.position

    let AdminRole = user.guild.roles.array().filter(r => r.id === `${config.adminrole}`)[0].position
    let ModRole = user.guild.roles.array().filter(r => r.id === `${config.modrole}`)[0].position
    if (level >= AdminRole) {
        return 2
    }
    if (level >= ModRole) {
        return 1
    }
    return 0

}

/*
 * Return true si le nombre de majusucle dépasse le nombre autorisé
 * Return false sinon
 * */
function capsLimit(m) {
    let ww = m.content.split(" ");
    ww.forEach((w, c) => {
        //regarde si il y a une mention et supprime la mention dans le tableau words
        if (w.match(/^<#?@?&?[0-9]{18}>(<#?@?&?[0-9]{18}>)?$/)) {
            ww.splice(c, 1);
        } else {
            //supprime toute la ponctuation
            w = w.replace(/[^[a-zA-ZàâçèéêîôùûÀÂÇÈÉÊÎÔÙÛ]/g, '');
            ww.splice(c, 1, w);
        }
    });
    let s;
    ww.forEach((w, c) => {
        if (parseInt(c) === 0) {
            s = w;
        }
        else {
            s = s + w;
        }
    });
    let ss = s.length;
    let c = 0;
    for (let i = 0; i < ss; i++) {
        if (s[i] == s[i].toUpperCase() && s[i] != ' ') {
            c++;
        }
    }
    if (c > config.capslimit) return true;
    return false;

}

function clean(text) {
    if (typeof(text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}
//Login with TOKEN for Bot
bot.login(config.token); // Find your token > https://discordapp.com/developers/applications/me
