import React, {useEffect, useState} from 'react';
import {List, message} from 'antd';
import './moduleList.css'
import {Link} from "react-router-dom";
import { PlusOutlined} from '@ant-design/icons';
import { FloatButton } from 'antd';
import axios from "axios";
import {url} from "../../Config.jsx";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const Modules = () => {

    const [list, setList] = useState([{title: 'Test', amount: 1}, {title: 'Test', amount: 3}, {
        title: 'test',
        amount: 6
    }, {title: 'test', amount: 2}]);



    const getModule = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/module/all`);

            if (data?.module) {
                setList(data?.module)
            }
        } catch (error) {
            console.error("Помилка завантаження модуля:", error);
            message.error("Помилка завантаження модуля");
        } finally {
        }
    };

    const removeItemModule = async (id) => {
        try {
            const { data } = await axios.post(`${url}/api/v1/module/remove/${id}`);

            if (data?.module) {
                setList(data?.module)

                if(data?.success)
                    message.success('Модуль успішно видалено');
            }
        } catch (error) {
            console.error("Помилка завантаження модуля:", error);
        } finally {
        }
    };


    useEffect(() => {
            getModule();
    }, []);

    return (
        <div className="list">

            <h2>Модулі</h2>
            <div className="items">
                <>
                    <List
                        className="demo-loadmore-list"
                        itemLayout="horizontal"
                        dataSource={list}
                        renderItem={(item) => (

                            <List.Item
                                actions={[
                                    <Link to={`/module/${item?._id}`} key="list-loadmore-edit"
                                          style={{color: 'white'}}>Редагувати</Link>,
                                    <button key="list-loadmore-more" style={{
                                        color: '#960019',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onClick={()=>removeItemModule(item?._id)}
                                    >Видалити</button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={<a href="https://ant.design" style={{color: 'white'}}>{item?.title}</a>}
                                    description={<span
                                        style={{color: 'white'}}>
                                          Тест: {item?.test_id !== undefined && item?.test_id !== 'undefined' ? '✅' : '❌'} | Практичне: {item?.task_id !== undefined && item?.task_id !== 'undefined' && item?.task_id?.length ? '✅' : '❌'} | Старт: {dayjs(item?.date).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm')} | Створено: {dayjs(item?.createdAt).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm')} | Редаговано: {dayjs(item?.updatedAt).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm')} </span>}
                                />
                            </List.Item>
                        )}
                    />
                </>
            </div>
            <FloatButton
                shape="circle"
                type="primary"
                style={{ insetInlineEnd: 60, color: '#000' }}
                href={'/module/create'}
                className="custom-float-btn"
                icon={<PlusOutlined style={{color:'#C99C48'}}/>}
            />

        </div>
    );
};

export default Modules;