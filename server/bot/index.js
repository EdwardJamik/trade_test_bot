const {Telegraf, Markup} = require("telegraf");
const { v4: uuidv4 } = require('uuid');
const {getRegisteredUser,getUserPhone, setUserType} = require("../util/getUser");
const User = require("../models/user.model");
const UserProgress = require("../models/progress.model");
const Module = require("../models/module.model");
const {getLastMessage} = require("../util/lastMessage");
// const getCreatedUser = require("../util/getCreatedUser");
const { TG_TOKEN } = process.env
const bot = new Telegraf(`${TG_TOKEN}`)

const {getFillingText, getFillingCode} = require('../util/getFilling')

bot.command('start', async (ctx) => {
    try {
        const chat_id = ctx?.chat?.id;

        const getRegistered = await getRegisteredUser({chat_id})

        if(getRegistered){

            ctx.deleteMessage().catch((e)=>{})
            const getPhone = await getUserPhone({chat_id})

            if(getPhone){
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})

                ctx.replyWithHTML(
                    await getFillingText('module_message'),{
                        protect_content: true,
                        ... Markup.keyboard([
                            [await getFillingText('modules_button'), await getFillingText('resources_button')],
                            [await getFillingText('help_button')],
                        ]).resize()

                    }
                ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id }) });
            } else {
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})

                ctx.replyWithHTML(
                    await getFillingText('start'),{
                        protect_content: true,
                        ...Markup.keyboard([
                            [Markup.button.contactRequest(await getFillingText('send_phone'))]
                        ]).resize().oneTime()
                    }
                ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id }) });

            }
        } else {
            ctx.deleteMessage().catch((e)=>{})

            const username = ctx?.from?.username
            const last_name = ctx?.from?.last_name
            const first_name = ctx?.from?.first_name
            const language = ctx?.from?.language_code

            await User.create({
                chat_id,
                username,
                first_name,
                last_name,
                language
            })

            ctx.replyWithHTML(
                await getFillingText('start'),{
                    protect_content: true,
                    ...Markup.keyboard([
                        [Markup.button.contactRequest(await getFillingText('send_phone'))]
                    ]).resize().oneTime()
                }
            ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id }) });
        }
    } catch (e) {
        console.error(e)
    }
});

bot.on('contact', async (ctx) => {

    const phoneNumber = ctx.message.contact.phone_number;
    const chat_id = ctx.message.from.id;

    ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})
    ctx.deleteMessage().catch((e)=>{})

    await User.updateOne({ chat_id: chat_id }, { phone: phoneNumber });

    ctx.replyWithHTML(
        await getFillingText('phone_correct'),{
            protect_content: true,
            ... Markup.keyboard([
                [await getFillingText('modules_button'), await getFillingText('resources_button')],
                [await getFillingText('help_button')],
            ]).resize()
        }
    ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id }) });
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const chat_id = ctx.message.from.id;

    const getMessageCode = await getFillingCode(text)

    if (getMessageCode === 'help_button') {
        ctx.deleteMessage().catch((e)=>{})
        ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})
        ctx.replyWithHTML(
            await getFillingText('help_result_text'),{
                protect_content: true,
                ... Markup.keyboard([
                    [await getFillingText('modules_button'), await getFillingText('resources_button')]
                ]).resize()
            }
        ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id }) });
    } else if (getMessageCode === 'resources_button') {
        ctx.deleteMessage().catch((e)=>{})
        ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})
        ctx.replyWithHTML(
            await getFillingText('resource_result_text'),{
                protect_content: true,
                ... Markup.keyboard([
                    [await getFillingText('modules_button')],
                    [await getFillingText('help_button')],
                ]).resize()
            }
        ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id }) });
    } else if (getMessageCode === 'modules_button') {
        ctx.deleteMessage().catch((e)=>{})
        ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})

        const findModule = await Module.find({})


        if(findModule?.length){
            let i = 0
            for(const module_item of findModule){

                const findUserProgress = await UserProgress.find({chat_id, module_id: module_item?._id})
                if(findUserProgress?.confirm){
                    i++
                 } else{

                    // console.log(module_item?.other_files[0])
                    // module_item?.other_files[0]
                    // await ctx.sendVideo({
                    //     url: 'https://98e1-31-172-136-3.ngrok-free.app/uploads/module/34c1d528-67ef-44ed-b16e-d052dd3c2d1d.mp4',
                    //     // Опціонально можна додати:
                    //     caption: 'Опис відео',
                    //     supports_streaming: true
                    // });
                    // ctx.sendVideo('https://98e1-31-172-136-3.ngrok-free.app/uploads/module/c0a25e5d-106f-4eb4-aa3f-f0d35d7272a7.mp4');
                    return ctx.replyWithHTML(
                        module_item?.message,{
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback(await getFillingText('get_module_file_button'), 'get_module_file_button')],
                                [Markup.button.callback(await getFillingText('get_module_test_button'), 'get_module_test_button')],
                                [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                            ]),
                        }
                    ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id }) });

                }
            }
        }
    }
});



bot.on('callback_query', async (ctx) => {
    try {
        const chat_id = ctx?.update?.callback_query?.from?.id
        const callback = ctx?.update?.callback_query?.data

        switch (callback){
            case 'get_modules':
                // await setUserType({chat_id, type_user: callback.replace("start_", "")})
                ctx.answerCbQuery('')
                break;
            case 'start_owner':
                // await setUserType({chat_id, type_user: callback.replace("start_", "")})
                ctx.answerCbQuery('')
                break;
            case 'back_to_main_menu':
                ctx.deleteMessage().catch((e)=>{})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})
                // await setUserType({chat_id, type_user: callback.replace("start_", "")})
                ctx.replyWithHTML(
                    await getFillingText('module_message'),{
                        protect_content: true,
                        ... Markup.keyboard([
                            [await getFillingText('modules_button'), await getFillingText('resources_button')],
                            [await getFillingText('help_button')],
                        ]).resize()

                    }
                ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id }) });
                break;


            default:
                ctx.answerCbQuery('')
        }


        // if (callback === 'check_group') {
        //     const check_group = await bot.telegram.getChatMember(CHAT_ID_GROUPE, chat_id)
        //     const check_channel = await bot.telegram.getChatMember(CHAT_ID_CHANNEL, chat_id)
        //
        //     if((check_channel.status === 'member' || check_channel.status === 'creator' || check_channel.status === 'administrator') &&
        //         (check_group.status === 'member' || check_group.status === 'creator' || check_group.status === 'administrator')){
        //         const keyboards = await Markup.inlineKeyboard(
        //             [
        //                 [
        //                     Markup.button.webApp(button[`game_${user_language}`], webAppUrl),
        //                 ]
        //             ]
        //         )
        //
        //         await ctx.editMessageText(message[`ref_${user_language}`], {
        //             ...keyboards,
        //             parse_mode: 'HTML'
        //         })
        //     } else {
        //         const keyboards = await Markup.inlineKeyboard(
        //             [
        //                 [
        //                     Markup.button.url(`${button[`channel_${user_language}`]} ${check_channel.status === 'member' || check_channel.status === 'creator' || check_channel.status === 'administrator' ? '✅' : ''}`, LINK_CHANNEL_BOT),
        //                     Markup.button.url(`${button[`group_${user_language}`]} ${check_group.status === 'member' || check_group.status === 'creator' || check_group.status === 'administrator' ? '✅' : ''}`, LINK_GROUP_BOT),
        //                 ],
        //                 [
        //                     Markup.button.callback(button[`wait_${user_language}`], 'check_group'),
        //                 ]
        //             ]
        //         )
        //
        //         await ctx.editMessageText(message[`not_${user_language}`], {
        //             ...keyboards,
        //             parse_mode: 'HTML'
        //         })
        //     }
        //
        // }
    } catch (e) {
        console.error(e)
    }
})


async function sendUserMessages (text,users,photo,video,id){
    const {DOMAIN} = process.env
    let counter = 0
    let countTelegram = users?.length ? users?.length : 0

    await Sending.updateOne({_id:id}, {
        sending_start: true,
        sending_telegram: counter,
        un_sending_telegram: countTelegram
    })

    if (photo === null && video === null && users) {
        for (const user of users) {
            const {chat_id,language} = user;
            try {
                if(text.en && language === 'en') {
                    const sending = await bot.telegram.sendMessage(chat_id, text.en, {
                        parse_mode: 'HTML'
                    });

                    if (sending?.chat?.id) {
                        counter++
                    }
                } else if(text.ru && language === 'ru'){
                    const sending = await bot.telegram.sendMessage(chat_id, text.ru, {
                        parse_mode: 'HTML'
                    });

                    if (sending?.chat?.id) {
                        counter++
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }
    } else if (photo !== null && video === null && users) {
        for (const user of users) {
            const {chat_id,language} = user;

            if (text !== '' && text !== null) {
                try {
                    if (text.en && language === 'en') {
                        const sending = await bot.telegram.sendPhoto(chat_id, `${DOMAIN}/sending/${photo}`, {
                            caption: text.en,
                            parse_mode: 'HTML'
                        });

                        if (sending?.chat?.id) {
                            counter++
                        }
                    } else if (text.ru && language === 'ru') {
                        const sending = await bot.telegram.sendPhoto(chat_id, `${DOMAIN}/sending/${photo}`, {
                            caption: text.ru,
                            parse_mode: 'HTML'
                        });

                        if (sending?.chat?.id) {
                            counter++
                        }
                    }
                } catch (e) {
                    console.error(e)
                }
            } else {
                try {
                    const sending = await bot.telegram.sendPhoto(chat_id, `${DOMAIN}/sending/${photo}`, {
                        parse_mode: 'HTML'
                    });
                    if (sending?.chat?.id) {
                        counter++
                    }
                } catch (e) {
                    console.error(e)
                }
            }
        }
    } else if (photo === null && video !== null && users) {
        for (const user of users) {
            const {chat_id, language} = user;

            if (text !== '' && text !== null) {
                try {
                    if (text.en && language === 'en') {
                        const sending = await bot.telegram.sendVideo(chat_id, `${DOMAIN}/sending/${video}`, {
                            caption: text.en,
                            parse_mode: 'HTML'
                        });
                        if (sending?.chat?.id) {
                            counter++
                        }
                    } else if (text.ru && language === 'ru') {
                        const sending = await bot.telegram.sendVideo(chat_id, `${DOMAIN}/sending/${video}`, {
                            caption: text.ru,
                            parse_mode: 'HTML'
                        });
                        if (sending?.chat?.id) {
                            counter++
                        }
                    }

                } catch (e) {
                    console.error(e)
                }
            } else {
                try {
                    const sending = await bot.telegram.sendVideo(chat_id, `${DOMAIN}/sending/${video}`, {
                        parse_mode: 'HTML'
                    });
                    if (sending?.chat?.id) {
                        counter++
                    }
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }
    await Sending.updateOne({_id:id
    },{
        sending_end: true,
        sending_telegram: counter,
        un_sending_telegram: countTelegram
    })
}

module.exports.bot = bot
module.exports.sendUserMessages = sendUserMessages