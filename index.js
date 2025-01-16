//TODO: Make prefix server specific
let PREFIX = ";";

import { REST, Routes, ApplicationCommandOptionType, ChatInputCommandInteraction, Message, Client, Events, GatewayIntentBits } from 'discord.js';

const commands = [
    {
        name: 'help',
        description: 'Get information about the commands',
    },
    {
        name: 'h',
        description: 'Alias for \"help\"',
    },
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
    {
        name: 'echo',
        description: 'Echoes the user',
        options: [
            {
                name: "text",
                description: "The text to be echoe\'d",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ],
    },
    {
        name: 'chprefix',
        description: 'Change the bot\'s prefix',
        options: [
            {
                name: "new_prefix",
                description: "The new prefix",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ],
    },
    {
        name: 'uptime',
        description: 'Check how long the bot\'s online',
    }
];

const func_table = {
    help: async function (env, args) {
        let response = "";

        response += `**PREFIX**: \`${PREFIX}\`\n`;
        response += "**COMMANDS**:\n";
        for (const cmd of commands) {
            response += `\t${cmd.name} `;
            if (cmd.options) {
                for (const option of cmd.options) {
                    response += option.required ? "<" : "[";
                    response += `${option.name} - ${option.description}`;
                    response += option.required ? ">" : "]";
                }
            }
            response += `: ${cmd.description}\n`;
        }

        await env.reply(response);
    },
    h: async function (env, args) { return func_table.help(env, args); },
    ping: async function (env, args) {
        await env.reply("Pong!");
    },
    echo: async function (env, args) {
        let content;
        if (env instanceof ChatInputCommandInteraction) {
            content = env.options.getString("text");
        } else if (env instanceof Message) {
            content = args.slice(1).join(" ");
        }
        await env.reply(content);
    },
    chprefix: async function (env, args) {
        if (env instanceof ChatInputCommandInteraction) {
            PREFIX = env.options.getString("new_prefix");
        } else if (env instanceof Message) {
            PREFIX = args.slice(1).join(" ");
        }

        await env.reply(`Successfuly changed prefix to ${PREFIX}`);
    },
    uptime: async function (env, args) {
        const SEC_PER_DAY = 86400;

        const days = process.uptime()/SEC_PER_DAY;
        const hours = (days - Math.floor(days)) * 24;
        const minutes = (hours - Math.floor(hours)) * 60;
        const seconds = (minutes - Math.floor(minutes)) * 60;

        let response = "";
        response += "I\'m online for...\n";
        response += `${Math.floor(days)} day(s), `;
        response += `${Math.floor(hours)} hour(s), `;
        response += `${Math.floor(minutes)} minute(s) and `;
        response += `${Math.floor(seconds)} second(s).`;

        await env.reply(response);
    },
};

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    func_table[interaction.commandName](interaction);
});

client.on(Events.MessageCreate, async msg => {
    if (msg.author.bot) return;

    if (msg.content.includes(`<@${process.env.CLIENT_ID}>`)) {
        func_table["help"](msg, null);
    }

    if (!msg.content.startsWith(PREFIX)) return;

    const args = msg.content.slice(PREFIX.length).split(" ");

    const f = func_table[args[0]];
    if (f) f(msg, args);
});

client.login(process.env.TOKEN);
