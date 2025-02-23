const {Telegraf, Markup} = require("telegraf");
const { v4: uuidv4 } = require('uuid');
const {getRegisteredUser,getUserPhone, setUserType} = require("../util/getUser");
const User = require("../models/user.model");
const Gallery = require("../models/gallery.model");
const UserProgress = require("../models/progress.model");
const Module = require("../models/module.model");
const Testing = require("../models/testing.model");
const {getLastMessage} = require("../util/lastMessage");
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
                            [await getFillingText('modules_button'), await getFillingText('resources_button')],
                            [await getFillingText('help_button')],
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
                [await getFillingText('modules_button'), await getFillingText('resources_button')],
                [await getFillingText('help_button')],
            ]).resize()
        }
    ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });
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
        ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });
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
        ).then(async (response) => { await User.updateOne({ chat_id }, { last_message: response?.message_id, action:'' }) });
    } else if (getMessageCode === 'modules_button') {
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
                                return Markup.button.callback(`Здати практичну ${i + 1}`, `practice_${i + 1}`);
                            })
                            : [];

                        const practiceButtonRows = practiceButtons.map(button => [button]);

                        if(module_item?.task_id?.length && findUserProgress?.task && module_item?.test_id && findUserProgress?.test
                            || !module_item?.task_id?.length && !findUserProgress?.task && module_item?.test_id && findUserProgress?.test){
                            return ctx.replyWithHTML(
                                module_item?.message,
                                {
                                    protect_content: true,
                                    ...Markup.inlineKeyboard([
                                        [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                        module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                        ...practiceButtonRows,
                                        [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${module_item?._id}`)],
                                        [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                    ]),
                                }
                            ).then(async (response) => {
                                await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                            });
                        } else {
                            return ctx.replyWithHTML(
                                module_item?.message,
                                {
                                    protect_content: true,
                                    ...Markup.inlineKeyboard([
                                        [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                        module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                        ...practiceButtonRows, // Spread the practice buttons
                                        [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
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
    }
});

bot.on('video', async (ctx) => {
    try {
        const video = ctx.message.video;
        const chat_id = ctx.message.from.id;

        const name_video = `Video ${dayjs().format('DD.MM.YYYY HH:mm')}`

        ctx.replyWithHTML(
            `Відео успішно збережено в бібліотеці: ${name_video}\n\n<b>Не видаляйте відео із чата!!!</b>\n\nЩоб завантажити відео, введіть команду знову!`,{
                protect_content: true
            }
        ).then(async (response) => { await User.updateOne({ chat_id }, { action: '' }) });

        await Gallery.create({file_id:video?.file_id,chat_id,title: name_video})
    } catch (e) {
        console.error(e)
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
            case 'get_module_file_button': {
                ctx.deleteMessage().catch((e)=>{})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e)=>{})

                const findModule = await Module.findOne({_id: callback_2})

                if(findModule?.video?.length){
                    for(const objectModule of findModule?.video){
                        const galleryItem = await Gallery.findOne({_id:objectModule})
                        ctx.replyWithVideo(galleryItem?.file_id,{
                            caption: galleryItem?.title,
                            protect_content: true,
                            ... Markup.keyboard([
                                [await getFillingText('modules_button'), await getFillingText('resources_button')],
                                [await getFillingText('help_button')],
                            ]).resize()
                        })
                    }
                }

                const module_item = findModule
                const findUserProgress = await UserProgress.findOne({chat_id, module_id: module_item?._id})

                ctx.replyWithHTML(
                    await getFillingText('get_module_other_file_text'),
                    {
                        protect_content: true,
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                            module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                            // ...practiceButtonRows, // Spread the practice buttons
                            [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                        ]),
                    }
                ).then(async (response) => {
                    await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                });

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
                                        return Markup.button.callback(`Здати практичну ${i + 1}`, `practice_${i + 1}`);
                                    })
                                    : [];

                                const practiceButtonRows = practiceButtons.map(button => [button]);

                                if(module_item?.task_id?.length && findUserProgress?.task && module_item?.test_id && findUserProgress?.test
                                    || !module_item?.task_id?.length && !findUserProgress?.task && module_item?.test_id && findUserProgress?.test){
                                    return ctx.replyWithHTML(
                                        module_item?.message,
                                        {
                                            protect_content: true,
                                            ...Markup.inlineKeyboard([
                                                [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows,
                                                [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${module_item?._id}`)],
                                                [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                                            ]),
                                        }
                                    ).then(async (response) => {
                                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                                    });
                                } else {
                                    return ctx.replyWithHTML(
                                        module_item?.message,
                                        {
                                            protect_content: true,
                                            ...Markup.inlineKeyboard([
                                                [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                                ...practiceButtonRows, // Spread the practice buttons
                                                [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
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

                ctx.answerCbQuery('')
                break;

            case 'back_to_main_module': {
                ctx.deleteMessage().catch((e) => {})
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
                        return Markup.button.callback(`Здати практичну ${i + 1}`, `practice_${i + 1}`);
                    })
                    : [];

                const practiceButtonRows = practiceButtons.map(button => [button]);

                if(module_item?.task_id?.length && findUserProgress?.task && module_item?.test_id && findUserProgress?.test
                    || !module_item?.task_id?.length && !findUserProgress?.task && module_item?.test_id && findUserProgress?.test){
                    return ctx.replyWithHTML(
                        module_item?.message,
                        {
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                ...practiceButtonRows,
                                [Markup.button.callback(await getFillingText('next_module_button'), `next_module_button-${callback_2}`)],
                                [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                            ]),
                        }
                    ).then(async (response) => {
                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                    });
                } else {
                    return ctx.replyWithHTML(
                        module_item?.message,
                        {
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback(await getFillingText('get_module_file_button'), `get_module_file_button-${module_item?._id}`)],
                                module_item?.test_id && !findUserProgress?.test ? [Markup.button.callback(await getFillingText('get_module_test_button'), `get_module_test_button-${module_item?._id}`)] : [Markup.button.callback(await getFillingText('test_confirm_button'), 'test_confirm_button')],
                                ...practiceButtonRows, // Spread the practice buttons
                                [Markup.button.callback(await getFillingText('back_to_main_menu'), 'back_to_main_menu')],
                            ]),
                        }
                    ).then(async (response) => {
                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                    });
                }


                ctx.answerCbQuery('')
                break;
            }
            case 'test_start': {

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
                        Markup.button.callback(`${button_letters[i]}`, `answer-${callback_2}-0-${i + 1}`)
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
                            ...answerButtons
                        ]),
                    }
                ).then(async (response) => {
                    await User.updateOne({chat_id}, {last_message: response?.message_id, action: ''})
                });

                await UserProgress.create({chat_id, module_id: callback_2,test: true})

                ctx.answerCbQuery('')
                break;
            }
            case 'answer': {

                ctx.deleteMessage().catch((e) => {})
                ctx.deleteMessage(await getLastMessage(chat_id)).catch((e) => {})

                const module_item = await Module.findOne({_id: callback_2})
                const findTest = await Testing.findOne({_id: module_item?.test_id})

                const amountQuestion = findTest?.questions?.length

                if(amountQuestion === (Number(callback_3)+1)){

                    if(findTest?.questions[Number(callback_3)]?.correctAnswer === Number(callback_4)){
                        await UserProgress.updateOne(
                            { chat_id, module_id: callback_2 },
                            { $inc: { point: 1 } }
                        );
                    }

                    const getPointUser = await UserProgress.findOne(
                        { chat_id, module_id: callback_2 }
                    );
                    const finishText = await getFillingText('finish_test_point_text')

                    let result = finishText
                        .replace(/\{point\}/g, getPointUser?.point)

                    ctx.replyWithHTML(
                        result,
                        {
                            protect_content: true,
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback(await getFillingText('back_to_main_module'), `back_to_main_module-${callback_2}`)],
                            ]),
                        }
                    ).then(async (response) => {
                        await User.updateOne({ chat_id }, { last_message: response?.message_id, action: '' })
                    });


                } else{

                    if(findTest?.questions[Number(callback_3)]?.correctAnswer === Number(callback_4)){
                        await UserProgress.updateOne(
                            { chat_id, module_id: callback_2 },
                            { $inc: { point: 1 } }
                        );
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
                            Markup.button.callback(`${button_letters[i]}`, `answer-${callback_2}-${Number(callback_3)+1}-${i + 1}`)
                        ];
                        if (i + 1 < amountTest) {
                            row.push(Markup.button.callback(`${button_letters[i + 1]}`, `answer-${callback_2}-${Number(callback_3)+1}-${i + 1}`));
                        }
                        answerButtons.push(row);
                    }

                    // const amountTest = findTest?.questions?.length

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
                            [await getFillingText('modules_button'), await getFillingText('resources_button')],
                            [await getFillingText('help_button')],
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