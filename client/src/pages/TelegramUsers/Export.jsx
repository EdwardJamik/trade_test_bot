import React, {useEffect, useState} from 'react';
import { Button, Dropdown, Space } from 'antd';
import axios from "axios";
import {url} from "../../Config";
import * as XLSX from "xlsx";

function Export() {

    const [data, setData] = useState([]);

    async function getUpdatedTelegram() {
        const countTelegramUsers = await axios.get(`${url}/api/v1/admin/countUsers/`, {withCredentials: true});
        setData(countTelegramUsers.data.tg)
    }

    useEffect(() => {
        getUpdatedTelegram();
    },[]);

    const exportToExcel = async () => {
        let myArray;
            const requestList = await axios.get(`${url}/api/v1/admin/telegramUsers/`, {withCredentials: true});
            myArray = requestList.data;


        const headers = ['Номер телефону','chat_id','Username','Тип месенджеру','Створено', 'Остання взаємодія','Ім`я та Прізвище','Місто','Тип акаунту','Запросив'];
        const dataWithoutId = myArray.map(item => {
            const { _id,first_name,__v,ban,action, ...rest } = item;
            return rest;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataWithoutId);
        worksheet['A1'] = { v: headers[0] };
        worksheet['B1'] = { v: headers[1] };
        worksheet['C1'] = { v: headers[2] };
        worksheet['D1'] = { v: headers[3] };
        worksheet['E1'] = { v: headers[4] };
        worksheet['F1'] = { v: headers[5] };
        worksheet['G1'] = { v: headers[6] };
        worksheet['H1'] = { v: headers[7] };
        worksheet['I1'] = { v: headers[8] };
        worksheet['J1'] = { v: headers[9] };

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Користувачі Telegram');

        XLSX.writeFile(workbook, 'TelegramUsers.xlsx');
    }

    const items = [
        {
            key: '1',
            label: (
                <buton onClick={()=>{exportToExcel()}}>
                    Завантажити все
                </buton>
            ),
        },
    ];

    return (
        <Space direction="vertical">
            <Space wrap>
                <Dropdown
                    menu={{
                        items,
                    }}
                    placement="bottom"
                >
                    <Button>Завантажити Excel</Button>
                </Dropdown><>| Загальна кількість: {data}</>
            </Space>

        </Space>
    );
}

export default Export;