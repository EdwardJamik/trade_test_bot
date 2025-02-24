import axios from "axios";
import React, {useEffect, useRef, useState} from "react";
import UserForm from './UserForm.jsx';
import { url } from "../../Config";
import "./userPage.css";
import {Button, Input, Space, Table} from "antd";
import {SearchOutlined} from "@ant-design/icons";
import Highlighter from "react-highlight-words";


export default function UserPage() {
    const [users, setUsers] = useState([]);

    async function getUsers() {
        const userList = await axios.get(`${url}/api/v1/admin/userList/`, {withCredentials: true});
        setUsers(userList.data);
    }

    useEffect(() => {
        getUsers();
    }, [users]);

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

    const deleteUsers = async (id) => {
        const user = {
            id: id
        }
        const userDeleted = await axios.post(`${url}/api/v1/admin/deleteUser/`, user, {withCredentials: true});
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
    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: '20%',
            ...getColumnSearchProps('chat_id'),
        },
        {
            title: 'Створено',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '15%',
        },
        {
            title: 'Доступ',
            dataIndex: 'entree',
            key: 'entree',
            width: '15%',
            render: (entree) => (
                <>
                    {entree.length &&
                        <>
                            {entree[0] ? ` | Наповнення` : ''}
                            {entree[1] ? ` | Тести` : ''}
                            {entree[2] ? ` | Модулі` : ''}
                            {entree[3] ? ` | Практичні` : ''}
                            {entree[4] ? ` | Відеотека` : ''}
                            {entree[5] ? ` | Користувачі` : ''}
                            {entree[6] ? ` | Розсилка` : ''}
                            {entree[7] ? ` | Адміністратори` : ''}
                        </>

                    }
                    {!entree.length && <></>}

                </>
            ),

        },
        {
            title: 'Створено',
            dataIndex: '_id',
            key: '_id',
            width: '5%',
            render: (_id) => <Button type="primary" onClick={() => deleteUsers(_id)} block>Видалити</Button>,
        },
    ];

    return (
        <div className="user">
            <UserForm getUsers={getUsers}/>
            <div style={{height: 700, width: '100%'}}>
                <Table className='usersList' columns={columns} dataSource={users}/>
            </div>
        </div>
    )
}
