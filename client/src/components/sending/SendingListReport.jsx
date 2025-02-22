import React, {useEffect, useRef, useState} from 'react';
import { SearchOutlined } from '@ant-design/icons';

import Highlighter from 'react-highlight-words';
import {Button, Input, Modal, Space, Table} from 'antd';
import axios from "axios";
import {url} from "../../Config.jsx";
import ReactPlayer from "react-player";

const SendingListReport = () => {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState([]);
    const [dataLoad, setDataLoad] = useState([]);

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    const [formData, setFormData] = useState({
        viber:'',
        telegram: '',
        accepting_telegram: '',
        type: '',
        _id: '',
        date:'',
        content: '',
        image: '',
        watch: '',
        un_sending_telegram: '',
        createdAt:'',
        updatedAt: '',
        __v: '',
        sending_telegram: '',
    });

    async function getSendingList() {

        let {data} = await axios.get(
            `${url}/api/v1/admin/sendingList`,
            {},
            {withCredentials: true}
        );
        setData(data)

        const sendingsLoad = await axios.get(
            `${url}/api/v1/admin/sendingsListLoad`,
            {},
            {withCredentials: true}
        );
        setDataLoad(sendingsLoad.data)

        return true;
    }


    useEffect(() => {
        getSendingList();
    }, [dataLoad]);

    const showModalEdit = async () => {
        setOpen(!open);
    };

    async function sendingsView(record) {
        setOpen(!open)
        setFormData(record)
    }

    async function sendingsDeleted(id) {
        const data = {
            id:id
        }
        const sendings = await axios.post(
            `${url}/api/v1/admin/sendingsDelete`,
            {id},
            {withCredentials: true}
        );
    }


    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };
    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };
    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
            <div
                style={{
                    padding: 8,
                }}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <Input
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{
                        marginBottom: 8,
                        display: 'block',
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({
                                closeDropdown: false,
                            });
                            setSearchText(selectedKeys[0]);
                            setSearchedColumn(dataIndex);
                        }}
                    >
                        Filter
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            close();
                        }}
                    >
                        close
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined
                style={{
                    color: filtered ? '#1677ff' : undefined,
                }}
            />
        ),
        onFilter: (value, record) =>
            record[dataIndex]?.toString()?.toLowerCase()?.includes(value?.toLowerCase()),
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{
                        backgroundColor: '#ffc069',
                        padding: 0,
                    }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });

    const columns = [
        {
            title: 'Пользователей при создание',
            key: 'operation',
            width: '20%',
            render: (record) => (
                <>
                    {record.un_sending_telegram && `${record.un_sending_telegram}`}
                </>
            ),
        },
        {
            title: 'Получено',
            key: 'operation',
            width: '20%',
            render: (record) => (
                <>
                    {record.sending_telegram && `${record.sending_telegram}`}
                </>
            ),
        },
        {
            title: 'Создано',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '10%',
        },
        {
            title: 'Запланировано на',
            dataIndex: 'date',
            key: 'date',
            width: '10%',
        },
        {
            title: 'Закончено',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: '10%',
        },
        {
            title: '',
            key: 'operation',
            fixed: 'right',
            width: 10,
            render: (record) => (
                <>
                    <div className="seminar_buttons">
                        <Button onClick={()=>{sendingsView(record)}}>Детальнее</Button>
                    </div>
                </>
            ),
        },

    ];
    const columns_two = [
        {
            title: 'Запланировано на',
            dataIndex: 'date',
            key: 'date',
            width: '25%',
        },
        {
            title: 'Пользователей при создание рассылки',
            key: 'operation',
            width: '25%',
            render: (record) => (
                <>
                    {record.un_sending_telegram}
                </>
            ),
        },
        {
            title: '',
            key: 'operation',
            fixed: 'right',
            width: 10,
            render: (record) => (
                <>
                    <div className="seminar_buttons">
                        <Button style={{marginRight:'10px'}} onClick={()=>{sendingsView(record)}}>Детальнее</Button>
                        <Button onClick={()=>{sendingsDeleted(record._id)}}>Видалити</Button>
                    </div>
                </>
            ),
        },

    ];

    return (
        <>
            <h3 style={{marginTop:'40px',marginBottom:'15px'}}>Отложенная рассылка</h3>
            <Table className='sendingList' columns={columns_two} dataSource={dataLoad} />
            <h3 style={{marginTop:'20px',marginBottom:'15px'}}>Виконана розсилка</h3>
            <Table className='sendingList' columns={columns} dataSource={data} />
            <Modal
                title={`Рассылка`}
                open={open}
                key='ok1'
                closable={false}
                footer={[<Button key="disabled" className="button_continue" onClick={()=>showModalEdit()}>
                    Закрыть
                </Button>
                ]}
            >
                <form className="modal_sendings">
                    <div>
                        <p>Дата рассылки:</p>
                        {formData.date && `${formData.date}`}
                    </div>
                    <div>
                        <p>Зарегистрированных пользователей до рассылки:</p>
                        {formData.un_sending_telegram}
                    </div>
                    {formData.sending_telegram ? (
                        <div>
                            <p>Отправлено пользователям:</p>
                            {formData.sending_telegram}
                        </div>
                    ):<></>}
                    <div>
                        <p>Рассылку создано:</p>
                        {formData.createdAt && ` ${formData.createdAt}`}
                    </div>
                    {formData.updatedAt && formData.sending_end &&
                        <div>
                            <p>Рассылка окончена:</p>
                            {formData.updatedAt}
                        </div>
                    }
                    <div>
                        <p>Контент:</p>{formData.content}
                    </div>

                    {formData.watch &&
                        <div>
                            <p>Видео:</p>
                            <ReactPlayer
                                url={`${url}/sending/${formData.watch}`}
                                controls={true}
                                width="100%"
                                height="auto"
                            />
                        </div>
                    }
                    {formData.image &&
                        <div>
                            <p>Фото</p>
                            <img style={{maxWidth:'100%'}} src={`${url}/sending/`+formData.image} alt="Sending Image"/>
                        </div>
                    }

                </form>
            </Modal>
        </>

    );
};
export default SendingListReport;