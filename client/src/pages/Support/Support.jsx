import {
    Row,
    Col,
    Card,
    Table,
    Button,
    Space,
    Input
} from "antd";

import {useEffect, useRef, useState} from "react";
import axios from "axios";
import {url} from "../../Config.jsx";
import dayjs from "dayjs";
import Highlighter from "react-highlight-words";
import {SearchOutlined} from "@ant-design/icons";
import {Link} from "react-router-dom";


function Support() {

    const [data, setData] = useState([])

    useEffect(() => {
        const getReserved = async () => {
            const {data} = await axios.get(
                `${url}/api/v1/admin/getChats`,
                {},
                {withCredentials: true}
            );
            setData(data)
        }
        getReserved()
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
            title: "Користувач",
            dataIndex: "chat_id",
            key: "chat_id",
            align:'center',
            ...getColumnSearchProps('chat_id'),
            render: (_,record) =>
                <>
                    Клієнт: {record.userFirstName} ({record.chat_id}) <br/>Менеджер: {record.support_chat_id !== 'null' ? record.support_chat_id : 'Відхилено користувачем'}<br/>
                </>,
        },
        {
            title: "Дата",
            key: "updatedAt",
            dataIndex: "updatedAt",
            align:'center',
            render: ( updatedAt) => {
                return dayjs(updatedAt).format('HH:mm:ss DD.MM.YYYY')
            },
            sorter: (a, b) => dayjs(a.updatedAt).unix() - dayjs(b.updatedAt).unix(),
        },
        {
            title: "",
            key: "_id",
            dataIndex: "_id",
            align:'center',
            width:'10%',
            render: (_id) =>
                <div style={{display:'flex'}}>
                    <Link type='primary' to={`/chat/${_id}`}>Переглянути чат</Link>
                </div>
            ,
        },
    ];

    return (
        <>
            <div className="tabled">
                <Row gutter={[24, 0]}>
                    <Col xs="24" xl={24}>
                        <Card
                            bordered={false}
                            className="criclebox Reservationpace mb-24"
                        >
                            <div className="table-responsive">
                                <Table
                                    columns={columns}
                                    dataSource={data}
                                    className="ant-border-space"
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
}

export default Support;
