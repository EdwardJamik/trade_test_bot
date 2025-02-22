import React, {useState} from 'react';
import {EditOutlined, EllipsisOutlined, PlusOutlined, SettingOutlined} from '@ant-design/icons';
import {FloatButton, List} from 'antd';
const data = [
    {
        title: 'Ant Design Title 1',
    },
    {
        title: 'Ant Design Title 2',
    },
    {
        title: 'Ant Design Title 3',
    },
    {
        title: 'Ant Design Title 4',
    },
];
import './testList.css'
import {Link} from "react-router-dom";
const actions = [
    <EditOutlined key="edit" />,
    <SettingOutlined key="setting" />,
    <EllipsisOutlined key="ellipsis" />,
];

const TestList = () => {

    const [list, setList] = useState([{title:'Test',amount:1},{title:'Test',amount:3},{title:'test',amount:6},{title:'test',amount:2}]);

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
                                    <Link  to={'/tests/125125'}   key="list-loadmore-edit" style={{ color: 'white' }}>Редагувати</Link>,
                                    <button key="list-loadmore-more" style={{ color: '#960019', backgroundColor:'transparent', border:'none',cursor:'pointer' }}>Видалити</button>
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