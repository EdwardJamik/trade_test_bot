import React, {useEffect, useState} from 'react';
import { PlusOutlined} from '@ant-design/icons';
import {FloatButton, List, message} from 'antd';

import './practicalList.css'
import {Link} from "react-router-dom";
import axios from "axios";
import {url} from "../../Config.jsx";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const PracticalList = () => {

    const [list, setList] = useState([{title:'Test',amount:1},{title:'Test',amount:3},{title:'test',amount:6},{title:'test',amount:2}]);

    const getPractical = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/practical/all`);

            if (data?.practical) {
                setList(data?.practical)
            }
        } catch (error) {
            console.error("Помилка завантаження практичних завдань:", error);
            message.error("Помилка завантаження практичних завдань");
        } finally {
        }
    };

    const removeItemPractical = async (id) => {
        try {
            const { data } = await axios.post(`${url}/api/v1/practical/remove/${id}`);

            if (data?.practical) {
                setList(data?.practical)

                if(data?.success)
                    message.success('Практичне завдання успішно видалено');
            }
        } catch (error) {
            console.error("Помилка завантаження практичного завдання:", error);
        } finally {
        }
    };


    useEffect(() => {
        getPractical();
    }, []);

    return (
        <div className="list">

                <h2>Практичні завдання</h2>
            <div className="items">
                <>
                    <List
                        className="demo-loadmore-list"
                        itemLayout="horizontal"
                        dataSource={list}
                        renderItem={(item) => (

                            <List.Item
                                actions={[
                                    <Link to={`/practical/${item?._id}`} key="list-loadmore-edit"
                                          style={{color: 'white'}}>Редагувати</Link>,
                                    <button key="list-loadmore-more" style={{
                                        color: '#960019',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                            onClick={()=>removeItemPractical(item?._id)}
                                    >Видалити</button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={<a href="https://ant.design" style={{ color: 'white' }}>{item?.title}</a>}
                                    description={<span style={{ color: 'white' }}>Питань: {item?.questions?.length} | Створено: {dayjs(item?.createdAt).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm')} | Редаговано: {dayjs(item?.updatedAt).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm')} </span>}
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
                href={'/practical/create'}
                className="custom-float-btn"
                icon={<PlusOutlined style={{color:'#C99C48'}}/>}
            />
        </div>
    );
};

export default PracticalList;