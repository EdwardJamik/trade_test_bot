import "./telegramUsers.css"

import TelegramUsersList from "./TelegramUsersList.jsx";
import React, {useEffect, useState} from "react";
import Export from "./Export.jsx";
import axios from "axios";
import {url} from "../../Config";

export default function TelegramUsers() {

    async function getUpdatedTelegram() {
        const requestListAccept = await axios.get(`${url}/api/v1/admin/updateDateTelegram/`, {withCredentials: true});

        return true
    }

    useEffect(() => {
        getUpdatedTelegram();
    },[]);

    return (
        <div className="telegram_users">
            <h3>Користувачі Telegram</h3>
            <div className="request_type">
               <Export/>
            </div>
            <TelegramUsersList/>
        </div>
    )
}
