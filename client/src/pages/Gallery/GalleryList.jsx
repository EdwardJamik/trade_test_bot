import React, {useEffect, useState} from 'react';
import {List, message} from 'antd';

import './galleryList.css'
import {Link} from "react-router-dom";
import axios from "axios";
import {url} from "../../Config.jsx";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const GalleryList = () => {

    const [list, setList] = useState([{title:'Test',amount:1},{title:'Test',amount:3},{title:'test',amount:6},{title:'test',amount:2}]);

    const getGallery = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/gallery/all`);

            if (data?.gallery) {
                setList(data?.gallery)
            }
        } catch (error) {
            console.error("Помилка завантаження відеотеки:", error);
            message.error("Помилка завантаження відеотеки");
        } finally {
        }
    };

    const removeItemGallery = async (id) => {
        try {
            const { data } = await axios.post(`${url}/api/v1/gallery/remove/${id}`);

            if (data?.gallery) {
                setList(data?.gallery)

                if(data?.success)
                    message.success('Відео успішно видалено із відеотеки');
            }
        } catch (error) {
            console.error("Помилка завантаження відеотеки:", error);
        } finally {
        }
    };


    useEffect(() => {
        getGallery();
    }, []);

    return (
        <div className="list">

            <h2>Відеотека</h2>
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
                                            onClick={()=>removeItemGallery(item?._id)}
                                    >Видалити</button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={<a href="https://ant.design" style={{ color: 'white' }}>{item?.title}</a>}
                                    description={<span style={{ color: 'white' }}>Додано: {dayjs(item?.updatedAt).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm')} </span>}
                                />
                            </List.Item>
                        )}
                    />

                </>
            </div>
        </div>
    );
};

export default GalleryList;