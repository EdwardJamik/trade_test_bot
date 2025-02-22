import React, {useEffect, useRef, useState} from 'react';
import {EditOutlined, SearchOutlined} from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import {Button, Input, message, Modal, Space, Table} from 'antd';
import axios from "axios";
import {url} from "../../Config";

const TelegramUsersList = () => {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);

    const [formData, setFormData] = useState({
        userFName: '',
        city: '',
        chat_id: null,
    });

    const resetFormData = () => {
        setFormData({
            userFName: '',
            city: '',
            chat_id: null,
        });
        return true;
    };

    async function getRequest() {
        const requestListAccept = await axios.get(`${url}/api/v1/admin/telegramUsers/`, {withCredentials: true});
        return setData(requestListAccept.data)
    }

    const showModal = (userFirstName,userCity,chat_id) => {
        resetFormData()
        setFormData({
            userFName: userFirstName,
            city:userCity,
            chat_id: chat_id
        })
        setOpen(!open);
        return true;
    };

    useEffect(() => {
        getRequest();
    }, [data]);

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData({
                ...formData,
                [name]: files[0],
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const userBan = async (chat_id,ban) => {
        const userData = {
            chat_id,
            ban
        }
        const requestListAccept = await axios.post(`${url}/api/v1/admin/telegramUserBan/`,userData, {withCredentials: true});
    };


    const changedUserFName = async (value,chat_id) => {
        const regex = /^[\p{L}]+ [\p{L}]+$/u;

        if(formData.userFName !== '' && formData.userFName !== undefined && regex.test(formData.userFName)){
                const userData = {
                    ...formData
                }
                const setNewName = await axios.post(`${url}/api/v1/admin/userfNameUpdate/`,userData, {withCredentials: true});
                message.success(`Змінено`);
                showModal()
        } else{
            message.warning(`Ім'я та Прізвище не може бути пустим приклад: Люмила Шевченко`);
        }
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

    const parseDateString = (dateString) => {
        const [day, month, year, time] = dateString.split(/[\s.]+/);
        const [hours, minutes] = time.split(':');
        return new Date(year, month - 1, day, hours, minutes);
    };

    const columns = [
        {
            title: 'chat_id користувача',
            dataIndex: 'chat_id',
            key: 'chat_id',
            width: '8%',
            ...getColumnSearchProps('chat_id'),
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            width: '8%',
            ...getColumnSearchProps('username'),
        },
        {
            title: 'Ім`я та Прізвище',
            dataIndex: 'userFirstName',
            key: 'userFirstName',
            width: '20%',
            ...getColumnSearchProps('userFirstName'),
        },
        {
            title: 'Місто',
            dataIndex: 'userCity',
            key: 'userCity',
            width: '20%',
            ...getColumnSearchProps('userCity'),
        },
        {
            title: 'First name',
            dataIndex: 'first_name',
            key: 'first_name',
            width: '8%',
            ...getColumnSearchProps('username'),
        },
        {
            title: 'Номер телефону',
            dataIndex: 'phone',
            key: 'phone',
            width: '8%',
            ...getColumnSearchProps('phone'),
        },
        {
            title: 'Тип акаунту',
            dataIndex: 'direction',
            key: 'direction',
            width: '8%',
            filters: [
                {
                    text: 'Косметологія',
                    value: 'Cosmetology',
                },
                {
                    text: 'Перукарство',
                    value: 'Hairdressing',
                },
                {
                    text: 'Інше',
                    value: 'Other',
                },
                {
                    text: 'Без типу',
                    value: 'NoType',
                },
            ],
            onFilter: (value, record) => {
                if (value === 'NoType') {
                    return !record.direction || record.direction.trim() === '';
                }
                return record.direction && record.direction.indexOf(value) === 0;
            },
        },
        {
            title: 'Запросив',
            dataIndex: 'invite',
            key: 'invite',
            width: '8%',
            ...getColumnSearchProps('invite'),
        },
        {
            title: 'Створено',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => parseDateString(a.createdAt) - parseDateString(b.createdAt),
            sortDirections: ['descend', 'ascend'],
            render: (text) => text.toLocaleString(),
        },
        {
            title: 'Остання реакція',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: '8%',
            sorter: (a, b) => parseDateString(a.updatedAt) - parseDateString(b.updatedAt),
            sortDirections: ['descend', 'ascend'],
            render: (text) => text.toLocaleString(),
        },
        {
            title: 'Доступ',
            dataIndex: 'ban',
            key: 'ban',
            render: (ban,chat_id) => ban ? <Button type="primary" block onClick={()=>{userBan(!ban,chat_id)}}>unBan</Button>:<Button type="text" danger onClick={()=>{userBan(!ban,chat_id)}}>Ban</Button> ,
        },
        {
            title: 'Редагування',
            render: (record) =>  <Button type="primary" block onClick={()=>showModal(record.userFirstName,record.userCity,record.chat_id)}><EditOutlined style={{fontSize:'14px'}}/></Button>,
        },
    ];



    return(
        <>
        <Modal
            title="Редагування користувача"
            open={open}
            closable={false}
            key='ok1'
            footer={[<Button key="disabled" className="button_continue" onClick={()=>showModal()}>
                Відмінити
            </Button>,
                <Button key="saved" className="button_continue" onClick={()=>changedUserFName()}>
                    Оновити
                </Button>
            ]}
        >
            <>
                <div>
                    <p>Ім'я та Прізвище</p>
                    <Input type="text" name="userFName" value={formData.userFName} onChange={handleInputChange}/>
                </div>
                <div>
                    <p>Місто</p>
                    <Input type="text" name="city" value={formData.city} onChange={handleInputChange}/>
                </div>
            </>
        </Modal>,
        <Table className='usersList' columns={columns} size="small" dataSource={data} />
        </>
    )
};
export default TelegramUsersList;