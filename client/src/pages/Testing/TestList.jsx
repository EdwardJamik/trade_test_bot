import React, {useEffect, useState} from 'react';
import { PlusOutlined} from '@ant-design/icons';
import {FloatButton, List, message} from 'antd';

import './testList.css'
import {Link} from "react-router-dom";
import axios from "axios";
import {url} from "../../Config.jsx";


const TestList = () => {

    const [list, setList] = useState([{title:'Test',amount:1},{title:'Test',amount:3},{title:'test',amount:6},{title:'test',amount:2}]);

    const getModule = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/testing/all`);

            if (data?.tests) {
                setList(data?.tests)
            }
        } catch (error) {
            console.error("Помилка завантаження модуля:", error);
            message.error("Помилка завантаження модуля");
        } finally {
        }
    };

    const removeItemModule = async (id) => {
        try {
            const { data } = await axios.post(`${url}/api/v1/testing/remove/${id}`);

            if (data?.tests) {
                setList(data?.tests)

                if(data?.success)
                    message.success('Тест успішно видалено');
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

                <h2>Тести</h2>
            <div className="items">
                <>
                    <List
                        className="demo-loadmore-list"
                        itemLayout="horizontal"
                        dataSource={list}
                        renderItem={(item) => (

                            <List.Item
                                actions={[
                                    <Link to={`/tests/${item?._id}`} key="list-loadmore-edit"
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
                                    title={<a href="https://ant.design" style={{ color: 'white' }}>{item?.title}</a>}
                                    description={<span style={{ color: 'white' }}>Питань: {item?.amount} | Створено: {item?.amount} | Редаговано: {item?.amount} </span>}
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
                href={'/tests/create'}
                className="custom-float-btn"
                icon={<PlusOutlined style={{color:'#C99C48'}}/>}
            />
        </div>
    );
};

export default TestList;