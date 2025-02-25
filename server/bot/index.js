const {Telegraf, Markup} = require("telegraf");
const { v4: uuidv4 } = require('uuid');
const {getRegisteredUser,getUserPhone, setUserType} = require("../util/getUser");
const User = require("../models/user.model");
const Gallery = require("../models/gallery.model");
const UserProgress = require("../models/progress.model");
const Module = require("../models/module.model");
const Testing = require("../models/testing.model");
const Practical = require("../models/practical.model");
const Mailing = require("../models/sending.model");
const {getLastMessage,getLastTwoMessage} = require("../util/lastMessage");
// const getCreatedUser = require("../util/getCreatedUser");
const { TG_TOKEN } = process.env
const bot = new Telegraf(`${TG_TOKEN}`)

const {getFillingText, getFillingCode} = require('../util/getFilling')
const fs = require("fs");

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

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
                            [ await getFillingText('resources_button'),await getFillingText('help_button')],
                        ]).resize()

                    }
                ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });
            } else {
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})

                ctx.replyWithHTML(
                    await getFillingText('start'),{
                        protect_content: true,
                        ...Markup.keyboard([
                            [Markup.button.contactRequest(await getFillingText('send_phone'))]
                        ]).resize().oneTime()
                    }
                ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });

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
            ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });
        }
    } catch (e) {
        console.error(e)
    }
});

bot.command('add_mp4', async (ctx) => {
    try{
        const chat_id = ctx.message.from.id;

        ctx.replyWithHTML(
            'Надішліть відео для збереження в бібліотеці',{
                protect_content: true
            }
        ).then(async (response) => { await User.updateOne({ chat_id }, { action: 'sent_video' }) });
    }catch (e) {
        console.error(e)
    }
})

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
                [await getFillingText('resources_button'),await getFillingText('help_button')],
            ]).resize()
        }
    ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });

    ctx.replyWithHTML(
        await getFillingText('text_start_module_info'),{
            protect_content: true,
            ...Markup.inlineKeyboard([
                [Markup.button.callback(await getFillingText('start_learning_button'), `start_learning_button`)]
            ]),
        }
    ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });
    //
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const chat_id = ctx.message.from.id;

    const getMessageCode = await getFillingCode(text)

    const userAction = await User.findOne({ chat_id })

    if(userAction){
        const [callback, callback_2, callback_3, callback_4] = userAction?.action?.split("-");
        
        if(ctx?.message?.chat?.id && ctx?.message?.chat?.id === -1002452517593){

            const text = ctx?.message?.reply_to_message?.text;

            if(text) {
                const match = text.match(/chat_id:\s*([\d\+\-]+)/);
                const id = text.match(/module_id:\s*([\w]+)/);
                const practical = text.match(/practical:\s*([\w]+)/);

                if (match && id && practical) {
                    const chatId = match[1].trim(); // Видаляємо зайві пробіли
                    const match_id = id[1].trim(); // Видаляємо зайві пробіли
                    const match_practical = practical[1].trim(); // Видаляємо зайві пробіли
                    const messageText = ctx.message.text; // Текст відповіді

                    const findModule = await Module.findOne({_id: match_id})

                    const findProgress = await UserProgress.findOne({chat_id: chatId, module_id: match_id})

                    let task_data = findProgress?.task_data || []; // Переконаємось, що це масив
                    task_data[match_practical] = true;

                    let task = task_data.length > 0 && task_data.every(checkProgress => checkProgress === true);

                    try {
                        const messageMentor = await getFillingText('text_mentor_to_user')
                        let result = messageMentor
                            .replace(/\{title\}/g, ` ${findModule?.title}`)
                            .replace(/\{message\}/g, ` ${messageText}`);
                        await ctx.telegram.sendMessage(chatId, result, {
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback(await getFillingText('back_to_main_module'), `back_to_main_module-${match_id}`)]
                            ]),
                        });
                        await UserProgress.updateOne({chat_id: chatId, module_id: match_id}, {task_data, task})
                        ctx.deleteMessage().catch((e) => {
                        })
                        console.log(await getLastMessage(chatId))
                        ctx.deleteMessage(chatId, await getLastMessage(chatId)).catch((e) => {
                        })
                        await ctx.reply(`Повідомлення надіслано до ${chatId}`);
                    } catch (error) {
                        console.error('Помилка надсилання повідомлення:', error);
                        await ctx.reply('Помилка: Не вдалося надіслати повідомлення.');
                    }
                }
            }

        } else {
            if(callback === 'getPractical') {
                try {
                    // ctx.deleteMessage().catch((e) => {
                    // })
                    ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                    const findUserProgress = await UserProgress.findOne({chat_id, module_id: callback_2})
                    let task_data = []

                    if (findUserProgress?.task_data)
                        task_data = [...findUserProgress?.task_data]

                    if (typeof task_data[Number(callback_3)-1] === 'string') {
                        task_data[Number(callback_3)-1] += `,${ctx.message.message_id}`
                    }

                    else if (Array.isArray(task_data[Number(callback_3)-1])) {
                        task_data[Number(callback_3)-1] = task_data[Number(callback_3)-1].join(',') + `,${ctx.message.message_id}`
                    }

                    else {
                        task_data[Number(callback_3)-1] = `${ctx.message.message_id}`
                    }

                    await UserProgress.updateOne({chat_id, module_id: callback_2}, {task_data})

                    ctx.replyWithHTML(
                        await getFillingText('text_practical_sent_info'), {
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback(await getFillingText('send_practical_to_mentor_button'), `success_sent_module_practical-${callback_2}-${callback_3}`)],
                                [Markup.button.callback(await getFillingText('not_send_practical_to_mentor_button'), `decline_sent_module_practical-${callback_2}-${callback_3}`)],
                            ]),
                        }
                    ).then(async (response) => {
                        await User.updateOne({chat_id}, {last_message: response?.message_id})
                    });
                } catch (e) {
                    console.error(e)
                }

            }
            else if (getMessageCode === 'help_button') {
                ctx.deleteMessage().catch((e)=>{})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})
                ctx.replyWithHTML(
                    await getFillingText('help_result_text'),{
                        protect_content: true,
                        ... Markup.keyboard([
                            [await getFillingText('resources_button'), await getFillingText('help_button')]
                        ]).resize()
                    }
                ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });
            } else if (getMessageCode === 'resources_button') {
                ctx.deleteMessage().catch((e)=>{})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})
                ctx.replyWithHTML(
                    await getFillingText('resource_result_text'),{
                        protect_content: true,
                        ... Markup.keyboard([
                            [await getFillingText('resources_button')],
                            [await getFillingText('help_button')],
                        ]).resize()
                    }
                ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });
            } else if (getMessageCode === 'modules_button') {

            }
        }
    }
    // console.log(callback, callback_2, callback_3, callback_4)

    //-1002452517593


});

bot.on('video', async (ctx) => {
    try {

        const chat_id = ctx.message.from.id;
        const userAction = await User.findOne({ chat_id })
        const [callback, callback_2, callback_3, callback_4] = userAction?.action?.split("-");

        if(callback === 'getPractical') {
            try {
                // ctx.deleteMessage().catch((e) => {
                // })
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const findUserProgress = await UserProgress.findOne({chat_id, module_id: callback_2})
                let task_data = []

                if (findUserProgress?.task_data)
                    task_data = [...findUserProgress?.task_data]

                if (typeof task_data[Number(callback_3)-1] === 'string') {
                    task_data[Number(callback_3)-1] += `,${ctx.message.message_id}`
                }

                else if (Array.isArray(task_data[Number(callback_3)-1])) {
                    task_data[Number(callback_3)-1] = task_data[Number(callback_3)-1].join(',') + `,${ctx.message.message_id}`
                }

                else {
                    task_data[Number(callback_3)-1] = `${ctx.message.message_id}`
                }

                await UserProgress.updateOne({chat_id, module_id: callback_2}, {task_data})

                ctx.replyWithHTML(
                    await getFillingText('text_practical_sent_info'), {
                        protect_content: true,
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback(await getFillingText('send_practical_to_mentor_button'), `success_sent_module_practical-${callback_2}-${callback_3}`)],
                            [Markup.button.callback(await getFillingText('not_send_practical_to_mentor_button'), `decline_sent_module_practical-${callback_2}-${callback_3}`)],
                        ]),
                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id})
                });
            } catch (e) {
                console.error(e)
            }

        } else if(callback === 'sent_video') {
            const video = ctx.message.video;

            const fileName = video?.file_name
            const name_video = fileName ? fileName.split('.').slice(0, -1).join('.') : `Video ${dayjs().format('DD.MM.YYYY HH:mm')}`;

            ctx.replyWithHTML(
                `Відео успішно збережено в бібліотеці: ${name_video}\n\n<b>Не видаляйте відео із чата!!!</b>\n\nЩоб завантажити відео, введіть команду знову!`,{
                    // protect_content: true
                }
            ).then(async (response) => { await User.updateOne({ chat_id }, { action: '' }) });

            await Gallery.create({file_id:video?.file_id,chat_id,title: name_video})
        }

    } catch (e) {
        console.error(e)
    }
});

bot.on('document', async (ctx) => {
    try {
        const chat_id = ctx.message.from.id;
        const userAction = await User.findOne({ chat_id })
        const [callback, callback_2, callback_3, callback_4] = userAction?.action?.split("-");

        if(callback === 'getPractical') {
            try {
                // ctx.deleteMessage().catch((e) => {
                // })
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const findUserProgress = await UserProgress.findOne({chat_id, module_id: callback_2})
                let task_data = []

                if (findUserProgress?.task_data)
                    task_data = [...findUserProgress?.task_data]

                if (typeof task_data[Number(callback_3)-1] === 'string') {
                    task_data[Number(callback_3)-1] += `,${ctx.message.message_id}`
                }

                else if (Array.isArray(task_data[Number(callback_3)-1])) {
                    task_data[Number(callback_3)-1] = task_data[Number(callback_3)-1].join(',') + `,${ctx.message.message_id}`
                }

                else {
                    task_data[Number(callback_3)-1] = `${ctx.message.message_id}`
                }

                await UserProgress.updateOne({chat_id, module_id: callback_2}, {task_data})

                ctx.replyWithHTML(
                    await getFillingText('text_practical_sent_info'), {
                        protect_content: true,
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback(await getFillingText('send_practical_to_mentor_button'), `success_sent_module_practical-${callback_2}-${callback_3}`)],
                            [Markup.button.callback(await getFillingText('not_send_practical_to_mentor_button'), `decline_sent_module_practical-${callback_2}-${callback_3}`)],
                        ]),
                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id})
                });
            } catch (e) {
                console.error(e)
            }

        }
    } catch (error) {
        console.error('Помилка обробки документа:', error);
    }
});

bot.on('photo', async (ctx) => {
    try {
        const chat_id = ctx.message.from.id;
        const userAction = await User.findOne({ chat_id })
        const [callback, callback_2, callback_3, callback_4] = userAction?.action?.split("-");

        if(callback === 'getPractical') {
            try {
                // ctx.deleteMessage().catch((e) => {
                // })
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const findUserProgress = await UserProgress.findOne({chat_id, module_id: callback_2})
                let task_data = []

                if (findUserProgress?.task_data)
                    task_data = [...findUserProgress?.task_data]

                if (typeof task_data[Number(callback_3)-1] === 'string') {
                    task_data[Number(callback_3)-1] += `,${ctx.message.message_id}`
                }

                else if (Array.isArray(task_data[Number(callback_3)-1])) {
                    task_data[Number(callback_3)-1] = task_data[Number(callback_3)-1].join(',') + `,${ctx.message.message_id}`
                }

                else {
                    task_data[Number(callback_3)-1] = `${ctx.message.message_id}`
                }

                await UserProgress.updateOne({chat_id, module_id: callback_2}, {task_data})

                ctx.replyWithHTML(
                    await getFillingText('text_practical_sent_info'), {
                        protect_content: true,
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback(await getFillingText('send_practical_to_mentor_button'), `success_sent_module_practical-${callback_2}-${callback_3}`)],
                            [Markup.button.callback(await getFillingText('not_send_practical_to_mentor_button'), `decline_sent_module_practical-${callback_2}-${callback_3}`)],
                        ]),
                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id})
                });
            } catch (e) {
                console.error(e)
            }

        }
    } catch (error) {
        console.error('Помилка обробки фото:', error);
    }
});

bot.on('callback_query', async (ctx) => {
    try {
        const chat_id = ctx?.update?.callback_query?.from?.id
        const input = ctx?.update?.callback_query?.data

        const [callback, callback_2, callback_3, callback_4] = input.split("-");
        console.log(callback, callback_2, callback_3, callback_4)

        switch (callback) {
            case 'get_modules':
                // await setUserType({chat_id, type_user: callback.replace("start_", "")})
                ctx.answerCbQuery('')
                break;
            case 'start_owner':
                // await setUserType({chat_id, type_user: callback.replace("start_", "")})
                ctx.answerCbQuery('')
                break;
            case 'success_sent_module_practical': {
                // ctx.deleteMessage().catch((e) => {})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const findUserProgress = await UserProgress.findOne({chat_id, module_id: callback_2})
                const findModule = await Module.findOne({_id: callback_2})

                const getUser = await User.findOne({chat_id})

                if(findUserProgress && findModule){
                    if(findUserProgress?.task_data[Number(callback_3)-1]){
                        const message_id = findUserProgress?.task_data[Number(callback_3)-1].split(',');
                        const response = await ctx.telegram.sendMessage(
                            '-1002452517593',
                            `Модуль: ${findModule?.title}\nUsername: @${getUser?.username ? getUser?.username : 'відсутній'} (${getUser?.first_name ? getUser?.first_name : ''} ${getUser?.last_name ? getUser?.last_name : ''}; ${getUser?.phone})\n\nchat_id: ${getUser?.chat_id} | module_id:${findModule?._id} | practical:${Number(callback_3)-1}`,
                            { parse_mode: 'HTML', protect_content: true }
                        );

                        for(const message of message_id){
                            if(message)
                                await ctx.telegram.forwardMessage(
                                    '-1002452517593',
                                    chat_id,
                                    message
                                ).catch((e)=>{});
                        }

                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' });
                    }
                }

                const findTaskModule = findModule?.task_id?.length;

                const practiceButtons = findTaskModule >= 1
                    ? Array.from({ length: findTaskModule }, (_, i) => {
                        return Markup.button.callback(`Практичне завдання №${i + 1} ${findUserProgress?.task_data[i]?.length > 1 || findUserProgress?.task_data[i] === true ? `${findUserProgress?.task_data[i] === true ? '✅' : '⌛' }` : ''}`, `${findUserProgress?.task_data[i]?.length > 1 ? `not_load` : `practice-${findModule?._id}-${i + 1}`}`);
                    })
                    : [];

                const practiceButtonRows = practiceButtons.map(button => [button]);

                if(findModule?.photo){
                    return ctx.sendPhoto({ source:`./uploads/module/${findModule?.photo}`},{
                        protect_content: true,
                        caption: findModule?.message,
                        ...Markup.inlineKeyboard([
                            findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${findModule?._id}`)],
                            findModule?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${findModule?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                            ...practiceButtonRows,
                        ]),
                    }).then(async (response) => {
                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                    });
                } else {
                    return ctx.replyWithHTML(
                        findModule?.message,
                        {
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${findModule?._id}`)],
                                findModule?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${findModule?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                ...practiceButtonRows,
                                // [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${findModule?._id}`)],
                                // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                            ]),
                        }
                    ).then(async (response) => {
                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                    });
                }

                ctx.answerCbQuery('')
                break;
            }
            case 'decline_sent_module_practical': {
                await ctx.telegram.forwardMessage(
                    '-1002452517593',
                    ctx.message.chat.id,
                    ctx.message.message_id
                );
                ctx.answerCbQuery('')
                break;
            }
            case 'get_module_file_button': {
                ctx.deleteMessage().catch((e)=>{})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})

                const findModule = await Module.findOne({_id: callback_2})

                if(findModule?.video?.length){
                    for(const objectModule of findModule?.video){
                        const galleryItem = await Gallery.findOne({_id:objectModule})
                        await ctx.replyWithVideo(galleryItem?.file_id,{
                            caption: galleryItem?.title,
                            protect_content: true,
                            ... Markup.keyboard([
                                [await getFillingText('resources_button'),await getFillingText('help_button')],
                            ]).resize()
                        })
                    }
                }

                if(findModule?.other_files?.length){
                    for(const objectModule of findModule?.other_files){

                        await ctx.sendDocument({source: `./uploads/module/${objectModule}`},{
                            protect_content: true
                        }).catch((e)=>{})
                    }
                }

                const module_item = findModule

                const findCurrentProgress =  await UserProgress.findOne({chat_id, module_id: callback_2})
                if(!findCurrentProgress)
                    await UserProgress.create({chat_id, module_id: callback_2, material:true})

                const findUserProgress =  await UserProgress.findOne({chat_id, module_id: callback_2})

                const findTaskModule = module_item?.task_id?.length;

                const practiceButtons = findTaskModule >= 1
                    ? Array.from({ length: findTaskModule }, (_, i) => {
                        return Markup.button.callback(`Практичне завдання №${i + 1} ${findUserProgress?.task_data[i]?.length > 1 || findUserProgress?.task_data[i] === true ? `${findUserProgress?.task_data[i] === true ? '✅' : '⌛' }` : ''}`, `${findUserProgress?.task_data[i]?.length > 1 ? `not_load` : `practice-${module_item?._id}-${i + 1}`}`);

                    })
                    : [];

                const practiceButtonRows = practiceButtons.map(button => [button]);

                if(module_item?.photo){
                    return ctx.sendPhoto({ source:`./uploads/module/${module_item?.photo}`},{
                        protect_content: true,
                        caption: module_item?.message,
                        ...Markup.inlineKeyboard([
                            findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                            module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                            ...practiceButtonRows, // Spread the practice buttons
                            // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                        ]),
                    }).then(async (response) => {
                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                    });
                } else {
                    ctx.replyWithHTML(
                        module_item?.message,
                        {
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                ...practiceButtonRows, // Spread the practice buttons
                                // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                            ]),
                        }
                    ).then(async (response) => {
                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                    });
                }

                ctx.answerCbQuery('')
                break;
            }
            case 'next_module_button':

                await UserProgress.updateOne({chat_id, module_id: callback_2}, {confirm:true})

                ctx.deleteMessage().catch((e)=>{})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})

                const findModule = await Module.find({})

                if(findModule?.length){
                    let i = 0
                    for(const module_item of findModule){

                        const findUserProgress = await UserProgress.findOne({chat_id, module_id: module_item?._id})

                        if(findUserProgress?.confirm){
                            i++
                        } else{

                            dayjs.extend(utc);
                            dayjs.extend(timezone);
                            dayjs.extend(isSameOrBefore);

                            const currentDate = dayjs().tz('Europe/Kiev');

                            const databaseDate = dayjs(module_item?.date).tz('Europe/Kiev');

                            if (databaseDate.isSameOrBefore(currentDate)) {
                                const findTaskModule = module_item?.task_id?.length;

                                const practiceButtons = findTaskModule >= 1
                                    ? Array.from({ length: findTaskModule }, (_, i) => {
                                        return Markup.button.callback(`Практичне завдання №${i + 1} ${findUserProgress?.task_data[i]?.length > 1 || findUserProgress?.task_data[i] === true ? `${findUserProgress?.task_data[i] === true ? '✅' : '⌛' }` : ''}`, `${findUserProgress?.task_data[i]?.length > 1 ? `not_load` : `practice-${module_item?._id}-${i + 1}`}`);

                                    })
                                    : [];

                                const practiceButtonRows = practiceButtons.map(button => [button]);

                                if(module_item?.task_id?.length && findUserProgress?.task && module_item?.test_id && findUserProgress?.test
                                    || !module_item?.task_id?.length && !findUserProgress?.task && module_item?.test_id && findUserProgress?.test){

                                    if(module_item?.photo){
                                        return ctx.sendPhoto({ source:`./uploads/module/${module_item?.photo}`},{
                                            protect_content: true,
                                            caption: module_item?.message,
                                            ...Markup.inlineKeyboard([
                                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows, // Spread the practice buttons
                                                [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${module_item?._id}`)],
                                            ]),
                                        }).then(async (response) => {
                                            await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                        });
                                    }

                                    return ctx.replyWithHTML(
                                        module_item?.message,
                                        {
                                            protect_content: true,
                                            ...Markup.inlineKeyboard([
                                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows,
                                                [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${module_item?._id}`)],
                                                // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                            ]),
                                        }
                                    ).then(async (response) => {
                                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                    });
                                } else {

                                    if(module_item?.photo){
                                        return ctx.sendPhoto({ source:`./uploads/module/${module_item?.photo}`},{
                                            protect_content: true,
                                            caption: module_item?.message,
                                            ...Markup.inlineKeyboard([
                                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows, // Spread the practice buttons
                                            ]),
                                        }).then(async (response) => {
                                            await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                        });
                                    }

                                    return ctx.replyWithHTML(
                                        module_item?.message,
                                        {
                                            protect_content: true,
                                            ...Markup.inlineKeyboard([
                                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows, // Spread the practice buttons
                                                // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                            ]),
                                        }
                                    ).then(async (response) => {
                                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                    });
                                }
                            } else {
                                const messageText = await getFillingText('module_close_time_text')

                                let result = messageText
                                    .replace(/\{open_date\}/g, dayjs(databaseDate).format('DD.MM HH:MM'))

                                return ctx.replyWithHTML(
                                    result,
                                    {
                                        protect_content: true,
                                        ...Markup.inlineKeyboard([
                                            // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                        ]),
                                    }
                                ).then(async (response) => {
                                    await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                });
                            }


                        }
                    }
                }

                ctx.answerCbQuery('')
                break;

            case 'back_to_main_module': {
                ctx.deleteMessage().catch((e) => {})
                ctx.deleteMessage(await getLastTwoMessage(chat_id)).catch((e) => {})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const module_item = await Module.findOne({_id: callback_2})

                const findUserProgress = await UserProgress.findOne({chat_id, module_id: module_item?._id})

                if(module_item?.task_id?.length && findUserProgress?.task && module_item?.test_id && findUserProgress?.test
                || !module_item?.task_id?.length && !findUserProgress?.task && module_item?.test_id && findUserProgress?.test){
                    console.log('tut')
                }

                const findTaskModule = module_item?.task_id?.length;

                const practiceButtons = findTaskModule >= 1
                    ? Array.from({length: findTaskModule}, (_, i) => {
                        return Markup.button.callback(`Практичне завдання №${i + 1} ${findUserProgress?.task_data[i]?.length > 1 || findUserProgress?.task_data[i] === true ? `${findUserProgress?.task_data[i] === true ? '✅' : '⌛' }` : ''}`, `${findUserProgress?.task_data[i]?.length > 1 ? `not_load` : `practice-${module_item?._id}-${i + 1}`}`);
                    })
                    : [];

                const practiceButtonRows = practiceButtons.map(button => [button]);

                if(module_item?.task_id?.length && findUserProgress?.task && module_item?.test_id && findUserProgress?.test
                    || !module_item?.task_id?.length && !findUserProgress?.task && module_item?.test_id && findUserProgress?.test){

                    if(module_item?.photo){
                        return ctx.sendPhoto({ source:`./uploads/module/${module_item?.photo}`},{
                            protect_content: true,
                            caption: module_item?.message,
                            ...Markup.inlineKeyboard([
                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                ...practiceButtonRows, // Spread the practice buttons
                                [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${callback_2}`)],
                            ]),
                        }).then(async (response) => {
                            await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                        });
                    } else{
                        return ctx.replyWithHTML(
                            module_item?.message,
                            {
                                protect_content: true,
                                ...Markup.inlineKeyboard([
                                    findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                    module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                    ...practiceButtonRows,
                                    [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${callback_2}`)],
                                    // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                ]),
                            }
                        ).then(async (response) => {
                            await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                        });
                    }


                } else {
                    if(module_item?.photo){
                        return ctx.sendPhoto({ source:`./uploads/module/${module_item?.photo}`},{
                            protect_content: true,
                            caption: module_item?.message,
                            ...Markup.inlineKeyboard([
                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                ...practiceButtonRows, // Spread the practice buttons
                                // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                            ]),
                        }).then(async (response) => {
                            await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                        });
                    } else {
                        return ctx.replyWithHTML(
                            module_item?.message,
                            {
                                protect_content: true,
                                ...Markup.inlineKeyboard([
                                    findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                    module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                    ...practiceButtonRows, // Spread the practice buttons
                                    // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                ]),
                            }
                        ).then(async (response) => {
                            await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                        });
                    }
                }


                ctx.answerCbQuery('')
                break;
            }
            case 'get_module_test_button': {

                ctx.deleteMessage().catch((e) => {})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const module_item = await Module.findOne({_id: callback_2})
                const findTest = await Testing.findOne({_id: module_item?.test_id})

                const questionText = await getFillingText('question_form_text')

                const letters = ["<b>A</b>", "<b>B</b>", "<b>C</b>", "<b>D</b>"];

                const formattedAnswer = findTest?.questions[0]?.choices
                    .map((question, index) => `${letters[index]}. ${question}`)
                    .join("\n");

                let result = questionText
                    .replace(/\{question\}/g, findTest?.questions[0]?.question)
                    .replace(/\{answer\}/g, formattedAnswer);

                const button_letters = ["A", "B", "C", "D"];

                const amountTest = findTest?.questions[0]?.choices?.length || 0;
                const answerButtons = [];
                for (let i = 0; i < amountTest; i += 2) {
                    const row = [
                        Markup.button.callback(`${button_letters[i]}`, `answer-${callback_2}-0-${i}`)
                    ];
                    if (i + 1 < amountTest) {
                        row.push(Markup.button.callback(`${button_letters[i + 1]}`, `answer-${callback_2}-0-${i + 1}`));
                    }
                    answerButtons.push(row);
                }
                // const amountTest = findTest?.questions?.length

                ctx.replyWithHTML(
                    result,
                    {
                        protect_content: true,
                        ...Markup.inlineKeyboard([
                            ...answerButtons,
                            [Markup.button.callback(await getFillingText('back_to_main_module'), `back_to_main_module-${callback_2}`)]
                        ]),
                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id, action: ''})
                });

                ctx.answerCbQuery('')
                break;
            }
            case 'answer': {

                ctx.deleteMessage().catch((e) => {})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const module_item = await Module.findOne({_id: callback_2})
                const findTest = await Testing.findOne({_id: module_item?.test_id})

                const amountQuestion = findTest?.questions?.length

                const findUserProgress =  await UserProgress.findOne({chat_id, module_id: callback_2})
                if(!findUserProgress)
                    await UserProgress.create({chat_id, module_id: callback_2, test: true})
                else
                    await UserProgress.updateOne({chat_id, module_id: callback_2},{test: true})

                if(amountQuestion === (Number(callback_3)+1)){

                    if(findTest?.questions[Number(callback_3)]?.correctAnswer === Number(callback_4)){

                        ctx.deleteMessage(await getLastTwoMessage(chat_id)).catch((e) => {})

                        await UserProgress.updateOne(
                            { chat_id, module_id: callback_2 },
                            { $inc: { point: 1 } }
                        );

                        await User.updateOne(
                            { chat_id },
                            { $inc: { points: 1 } }
                        );

                        const button_letters = ["A", "B", "C", "D"];

                        let messageText = await getFillingText('answer_correct_text')
                        messageText = messageText.replace(/\{user_answer\}/g, `${button_letters[findTest?.questions[Number(callback_3)]?.correctAnswer]}`)

                        await ctx.replyWithHTML(
                            messageText,
                            {
                                protect_content: true
                            }
                        ).then(async (response) => {
                            await User.updateOne({ chat_id }, { last_two_message: response?.message_id, action: '' })
                        });

                    } else {
                        ctx.deleteMessage(await getLastTwoMessage(chat_id)).catch((e) => {})
                        const button_letters = ["A", "B", "C", "D"];

                        let messageText = await getFillingText('answer_declined_text')
                        messageText = messageText.replace(/\{correct_answer\}/g, `${button_letters[findTest?.questions[Number(callback_3)]?.correctAnswer]} - ${findTest?.questions[Number(callback_3)]?.choices[Number(findTest?.questions[Number(callback_3)]?.correctAnswer)]}`)

                        await ctx.replyWithHTML(
                            messageText,
                            {
                                protect_content: true
                            }
                        ).then(async (response) => {
                            await User.updateOne({ chat_id }, { last_two_message: response?.message_id, action: '' })
                        });
                    }

                    const getPointUser = await UserProgress.findOne(
                        { chat_id, module_id: callback_2 }
                    );

                    const finishText = module_item?.task_id?.length ? await getFillingText('finish_test_point_text') : await getFillingText('finish_next_test_point_text')

                    let result = finishText
                        .replace(/\{point\}/g, `${getPointUser?.point}/${amountQuestion}`)

                    await ctx.replyWithHTML(
                        result,
                        {
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                module_item?.task_id?.length ? [Markup.button.callback(await getFillingText('back_to_main_module'), `back_to_main_module-${callback_2}`)] : [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${module_item?._id}`)],
                            ]),
                        }
                    ).then(async (response) => {
                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                    });


                } else{

                    if(Number(findTest?.questions[Number(callback_3)]?.correctAnswer) === Number(callback_4)){

                        ctx.deleteMessage(await getLastTwoMessage(chat_id)).catch((e) => {})

                        await UserProgress.updateOne(
                            { chat_id, module_id: callback_2 },
                            { $inc: { point: 1 } }
                        );

                        await User.updateOne(
                            { chat_id },
                            { $inc: { points: 1 } }
                        );

                        const button_letters = ["A", "B", "C", "D"];

                        let messageText = await getFillingText('answer_correct_text')
                        messageText = messageText.replace(/\{user_answer\}/g, `${button_letters[(findTest?.questions[Number(callback_3)]?.correctAnswer)]}`)

                        await ctx.replyWithHTML(
                            messageText,
                            {
                                protect_content: true
                            }
                        ).then(async (response) => {
                            await User.updateOne({ chat_id }, { last_two_message: response?.message_id, action: '' })
                        });

                    } else {

                        ctx.deleteMessage(await getLastTwoMessage(chat_id)).catch((e) => {})
                        const button_letters = ["A", "B", "C", "D"];

                        let messageText = await getFillingText('answer_declined_text')
                        messageText = messageText.replace(/\{correct_answer\}/g, `${button_letters[findTest?.questions[Number(callback_3)]?.correctAnswer]} - ${findTest?.questions[Number(callback_3)]?.choices[Number(findTest?.questions[Number(callback_3)]?.correctAnswer)]}`)

                        await ctx.replyWithHTML(
                            messageText,
                            {
                                protect_content: true
                            }
                        ).then(async (response) => {
                            await User.updateOne({ chat_id }, { last_two_message: response?.message_id, action: '' })
                        });
                    }

                    const questionText = await getFillingText('question_form_text')

                    const letters = ["<b>A</b>", "<b>B</b>", "<b>C</b>", "<b>D</b>"];

                    const formattedAnswer = findTest?.questions[Number(callback_3)+1]?.choices
                        .map((question, index) => `${letters[index]}. ${question}`)
                        .join("\n");

                    let result = questionText
                        .replace(/\{question\}/g, findTest?.questions[Number(callback_3)+1]?.question)
                        .replace(/\{answer\}/g, formattedAnswer);

                    const button_letters = ["A", "B", "C", "D"];

                    const amountTest = findTest?.questions[Number(callback_3)+1]?.choices?.length || 0;
                    const answerButtons = [];
                    for (let i = 0; i < amountTest; i += 2) {
                        const row = [
                            Markup.button.callback(`${button_letters[i]}`, `answer-${callback_2}-${Number(callback_3)+1}-${i}`)
                        ];
                        if (i + 1 < amountTest) {
                            row.push(Markup.button.callback(`${button_letters[i + 1]}`, `answer-${callback_2}-${Number(callback_3)+1}-${i + 1}`));
                        }
                        answerButtons.push(row);
                    }

                    ctx.replyWithHTML(
                        result,
                        {
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                ...answerButtons
                            ]),
                        }
                    ).then(async (response) => {
                        await User.updateOne({chat_id}, {last_message: response?.message_id, action: ''})
                    });

                }

                ctx.answerCbQuery('')

                break;
            }
            case 'start_learning_button' :{
                ctx.deleteMessage().catch((e)=>{})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})

                const findModule = await Module.find({})

                if(findModule?.length){
                    let i = 0
                    for(const module_item of findModule){

                        const findUserProgress = await UserProgress.findOne({chat_id, module_id: module_item?._id})

                        if(findUserProgress?.confirm){
                            i++
                        } else{

                            dayjs.extend(utc);
                            dayjs.extend(timezone);
                            dayjs.extend(isSameOrBefore);

                            const currentDate = dayjs().tz('Europe/Kiev');

                            const databaseDate = dayjs(module_item?.date).tz('Europe/Kiev');

                            if (databaseDate.isSameOrBefore(currentDate)) {
                                const findTaskModule = module_item?.task_id?.length;

                                const practiceButtons = findTaskModule >= 1
                                    ? Array.from({ length: findTaskModule }, (_, i) => {
                                        return Markup.button.callback(`Практичне завдання №${i + 1} ${findUserProgress?.task_data[i]?.length > 1 || findUserProgress?.task_data[i] === true ? `${findUserProgress?.task_data[i] === true ? '✅' : '⌛' }` : ''}`, `${findUserProgress?.task_data[i]?.length > 1 ? `not_load` : `practice-${module_item?._id}-${i + 1}`}`);
                                    })
                                    : [];

                                const practiceButtonRows = practiceButtons.map(button => [button]);

                                if(module_item?.task_id?.length && findUserProgress?.task && module_item?.test_id && findUserProgress?.test
                                    || !module_item?.task_id?.length && !findUserProgress?.task && module_item?.test_id && findUserProgress?.test){

                                    if(module_item?.photo){
                                        return ctx.sendPhoto({ source:`./uploads/module/${module_item?.photo}`},{
                                            protect_content: true,
                                            caption: module_item?.message,
                                            ...Markup.inlineKeyboard([
                                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows, // Spread the practice buttons
                                                [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${module_item?._id}`)],
                                            ]),
                                        }).then(async (response) => {
                                            await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                        });
                                    }

                                    return ctx.replyWithHTML(
                                        module_item?.message,
                                        {
                                            protect_content: true,
                                            ...Markup.inlineKeyboard([
                                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows,
                                                [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${module_item?._id}`)],
                                                // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                            ]),
                                        }

                                    ).then(async (response) => {
                                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                    });
                                } else {

                                    if(module_item?.photo){
                                        return ctx.sendPhoto({ source:`./uploads/module/${module_item?.photo}`},{
                                            protect_content: true,
                                            caption: module_item?.message,
                                            ...Markup.inlineKeyboard([
                                                findUserProgress?.material ? [] : [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows, // Spread the practice buttons
                                                // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                            ]),
                                        }).then(async (response) => {
                                            await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                        });
                                    }

                                    return ctx.replyWithHTML(
                                        module_item?.message,
                                        {
                                            protect_content: true,
                                            ...Markup.inlineKeyboard([
                                                findUserProgress?.material ? [] :  [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows, // Spread the practice buttons
                                                // [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                            ]),
                                        }
                                    ).then(async (response) => {
                                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                    });

                                }
                            } else {
                                const messageText = await getFillingText('module_close_time_text')

                                let result = messageText
                                    .replace(/\{open_date\}/g, dayjs(databaseDate).format('DD.MM HH:MM'))

                                return ctx.replyWithHTML(
                                    result,
                                    {
                                        protect_content: true,
                                        ...Markup.inlineKeyboard([
                                            [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                        ]),
                                    }
                                ).then(async (response) => {
                                    await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                });
                            }
                        }
                    }
                }
                break
            }
            case 'practice': {

                ctx.deleteMessage().catch((e) => {})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const module_item = await Module.findOne({_id: callback_2})


                const findPractical = await Practical.findOne({_id: module_item?.task_id[Number(callback_3)-1]})

                ctx.replyWithHTML(
                    findPractical?.message, {
                        protect_content: true,
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback(await getFillingText('sent_practical_task_button'), `send_practical-${callback_2}-${callback_3}`)],
                            [Markup.button.callback(await getFillingText('back_to_main_module'), `back_to_main_module-${callback_2}`)],
                        ]),

                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id, action:''})
                });

                ctx.answerCbQuery('')

                break;
            }
            case 'send_practical': {

                ctx.deleteMessage().catch((e) => {})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const findUserProgress = await UserProgress.findOne({chat_id, module_id: callback_2})
                let task_data = []

                if (findUserProgress?.task_data)
                    task_data = [...findUserProgress?.task_data]


                    task_data[Number(callback_3)-1] = ''

                await UserProgress.updateOne({chat_id, module_id: callback_2}, {task_data})

                ctx.replyWithHTML(
                await getFillingText('success_sent_practical'), {
                        protect_content: true,
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback(await getFillingText('back_to_practical_button'), `practice-${callback_2}-${callback_3}`)],
                        ]),

                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id, action:`getPractical-${callback_2}-${callback_3}`})
                });

                ctx.answerCbQuery('')

                break;
            }
            case 'get_module_test_button':

                // callback

                // const findUserProgress = await UserProgress.find({chat_id, module_id: module_item?._id})
                ctx.deleteMessage().catch((e) => {
                })
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {
                })

                ctx.replyWithHTML(
                    await getFillingText('test_start_text'),
                    {
                        protect_content: true,
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback(await getFillingText('start_test_button'), `test_start-${callback_2}`)],
                            [Markup.button.callback(await getFillingText('back_to_main_module'), `back_to_main_module-${callback_2}`)],
                        ]),
                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id, action: ''})
                });

                ctx.answerCbQuery('')
                break;

            case 'back_to_main_menu':
                ctx.deleteMessage().catch((e) => {
                })
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {
                })
                // await setUserType({chat_id, type_user: callback.replace("start_", "")})
                ctx.replyWithHTML(
                    await getFillingText('module_message'), {
                        protect_content: true,
                        ...Markup.keyboard([
                            [ await getFillingText('resources_button'),await getFillingText('help_button')],
                        ]).resize()

                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id})
                });
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


async function sendUserMessages (id){
    try {
        let counter = 0

        const findMailing = await Mailing.findOne({_id:id})

        if(findMailing){

            await Mailing.updateOne({_id: id}, {
                start_send: true
            })

            const findUsers = await User.distinct('chat_id',{user_ban:false, ban:false})

            if(findUsers){
                if(!findMailing?.file){
                    for(const user of findUsers){
                        const sending = await bot.telegram.sendMessage(user, findMailing?.message, {
                            parse_mode: 'HTML',
                            protect_content: true,
                            ... Markup.keyboard([
                                [await getFillingText('resources_button'),await getFillingText('help_button')],
                            ]).resize()
                        })

                        if (sending?.chat?.id) {
                            counter++
                        }
                    }
                } else if(isImageOrVideo(findMailing?.file) === 'image'){
                    for(const user of findUsers){
                        const sending = await bot.telegram.sendPhoto(user, `${process.env.API_URL}/uploads/mailing/${findMailing?.file}`, {
                            parse_mode: 'HTML',
                            caption:`${findMailing?.message}`,
                            protect_content: true,
                            ... Markup.keyboard([
                                [await getFillingText('resources_button'),await getFillingText('help_button')],
                            ]).resize()
                        })

                        if (sending?.chat?.id) {
                            counter++
                        }
                    }
                } else if(isImageOrVideo(findMailing?.file) === 'video'){
                    for(const user of findUsers){
                        const sending = await bot.telegram.sendVideo(user, `${process.env.API_URL}/uploads/mailing/${findMailing?.file}`, {
                            parse_mode: 'HTML',
                            caption:`${findMailing?.message}`,
                            protect_content: true,
                            ... Markup.keyboard([
                                [await getFillingText('resources_button'),await getFillingText('help_button')],
                            ]).resize()
                        })

                        if (sending?.chat?.id) {
                            counter++
                        }
                    }
                } else {
                    const sending = await bot.telegram.sendMessage(user, findMailing?.message, {
                        parse_mode: 'HTML',
                        protect_content: true,
                        ... Markup.keyboard([
                            [ await getFillingText('resources_button'),await getFillingText('help_button')],
                        ]).resize()
                    })

                    if (sending?.chat?.id) {
                        counter++
                    }
                }

                await Mailing.updateOne({_id:id}, {
                    sending_users: counter,
                    confirm_send:true
                })
            } else {
                await Mailing.updateOne({_id:id}, {
                    sending_users: counter,
                    confirm_send: true
                })
            }
        }

        function isImageOrVideo(fileName) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
            const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.webm'];

            const fileExtension = fileName.split('.').pop().toLowerCase();

            if (imageExtensions.includes(`.${fileExtension}`)) {
                return 'image';
            } else if (videoExtensions.includes(`.${fileExtension}`)) {
                return 'video';
            } else {
                return 'unknown';
            }
        }
    } catch (e){
        console.error(e)
    }
}

module.exports.bot = bot
module.exports.sendUserMessages = sendUserMessages