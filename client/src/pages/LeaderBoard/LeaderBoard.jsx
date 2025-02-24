import React, {useEffect, useRef, useState} from 'react';
import {EditOutlined, PlusOutlined, SearchOutlined} from '@ant-design/icons';
import {Button, FloatButton, Input, List, message, Modal, Space, Table} from 'antd';

import axios from "axios";
import {url} from "../../Config.jsx";
import Highlighter from "react-highlight-words";

import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const LeaderBoard = () => {

    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);

    const getUsers = async () => {
        try {
            const {data} = await axios.get(`${url}/api/v1/users/leader`);

            if (data?.users) {
                setData(data?.users)
            }
        } catch (error) {
            console.error("Помилка завантаження користувачів:", error);
            message.error("Помилка завантаження користувачів");
        } finally {
        }
    };

    useEffect(() => {
        getUsers();
    }, []);

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

    const userBan = async (ban,chat_id) => {
        try {

            const {data} = await axios.post(`${url}/api/v1/users/ban`, {ban,chat_id},{withCredentials: true});

            if (data?.users) {
                if(data?.success){
                    setData(data?.users)
                    message.success(ban ? "Користувача заблоковано" : "Користувача розблоковано");
                } else{
                    message.error("Помилка блокування");
                }
            }
        } catch (error) {
            console.error("Помилка блокування:", error);
            message.error("Помилка блокування");
        } finally {
        }
    };

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters, close}) => (
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
                        icon={<SearchOutlined/>}
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
            title: 'Бали',
            dataIndex: 'points',
            key: 'points',
            align:'center',
            sorter: (a, b) => Number(a.points) - Number(b.points),
            render: (text) => <h2 style={{fontSize:'20px'}}>{text}</h2>,
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            align:'center',
            ...getColumnSearchProps('username'),
        },
        {
            title: 'First name',
            dataIndex: 'first_name',
            key: 'first_name',
            align:'center',
            ...getColumnSearchProps('first_name'),
        },
        {
            title: 'Last name',
            dataIndex: 'last_name',
            key: 'last_name',
            align:'center',
            ...getColumnSearchProps('last_name'),
        },
        {
            title: 'Номер телефону',
            dataIndex: 'phone',
            key: 'phone',
            align:'center',
            ...getColumnSearchProps('phone'),
        }
    ];


    return (
        <div className="list">

            <h2>Користувачі</h2>
            <div className="items">
                <Table className='usersList' columns={columns} size="small" dataSource={data}/>
            </div>
        </div>
    )
};

export default LeaderBoard;