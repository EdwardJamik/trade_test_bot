import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {PlusOutlined} from '@ant-design/icons';
import {
    Button,
    Form,
    Input,
    message,
    DatePicker,
    Upload, Table
} from 'antd';
import axios from "axios";
import {url} from "../../Config.jsx";
import dayjs from "dayjs";

const { TextArea } = Input;

const ModuleEditor = () => {
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();

    const disabledDate = (current) => {
        return current && current.isBefore(dayjs(), "day");
    };

    const disabledTime = (current) => {
        if (!current) return {};

        const now = dayjs();
        const isToday = current.isSame(now, "day");

        return {
            disabledHours: () => (isToday ? [...Array(now.hour()).keys()] : []),
            disabledMinutes: (selectedHour) =>
                isToday && selectedHour === now.hour()
                    ? [...Array(now.minute()).keys()]
                    : [],
        };
    };

    const handleChange = ({ fileList }) => {
        setFileList(fileList.slice(-1));
    };

    const cancelMailing = async (id) => {
        try {
            const {data} = await axios.post(`${url}/api/v1/mailing/remove/${id}`, {},{withCredentials: true});

            if (data?.mailing) {
                if(data?.success){
                    setData(data?.mailing)
                    message.success("Розсилку успішно скасовано");
                } else{
                    setData(data?.mailing)
                    message.error("Помилка скасування");
                }
            }

        } catch (error) {
            console.error("Помилка скасування розсилки:", error);
            message.error("Помилка створення розсилки");
        } finally {
        }
    };

    const onFinish = async (values) => {
        try {
            const formData = new FormData();

            Object.keys(values).forEach((key) => {
                if (key === 'date') {
                    formData.append(key, values[key].format());
                } else if (key !== 'photo' && key !== 'other_file') {
                    formData.append(key, values[key]);
                }
            });

            if (fileList[0]?.originFileObj) {
                formData.append("photo", fileList[0].originFileObj);
            } else if (fileList[0]?.existing) {
                formData.append("existing_photo", fileList[0].serverPath);
            }

            const endpoint = `${url}/api/v1/mailing/create`

            const { data } = await axios.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (data?.success) {
                message.success('Розсилку створено');
                form.resetFields();
                setFileList([]);
                getMailing();
            }
        } catch (error) {
            console.error("Помилка:", error);
            message.error("Помилка при створенні розсилки");
        }
    };

    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    const [data, setData] = useState([]);

    const getMailing = async () => {
        try {
            const {data} = await axios.get(`${url}/api/v1/mailing/all`);

            if (data?.mailing) {
                setData(data?.mailing)
            }
        } catch (error) {
            console.error("Помилка завантаження історії розсилок:", error);
            message.error("Помилка завантаження історії розсилок");
        } finally {
        }
    };

    useEffect(() => {
        getMailing();
    }, []);

    const parseDateString = (dateString) => {
        const [day, month, year, time] = dateString.split(/[\s.]+/);
        const [hours, minutes] = time.split(':');
        return new Date(year, month - 1, day, hours, minutes);
    };

    const columns = [
        {
            title: 'Текст',
            dataIndex: 'message',
            key: 'message',
            render: (text) => text.length > 100 ? text.slice(0, 40) + '...' : text,
        },
        {
            title: 'Фото/Відео',
            dataIndex: 'file',
            key: 'file',
            render: (file) => file ? '✅' : '❌',
        },
        {
            title: 'Час розсилки',
            dataIndex: 'date',
            key: 'date',
            render: (text) => dayjs(text).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm'),
        },
        {
            title: 'Отримало',
            dataIndex: 'sending_users',
            key: 'sending_users',
            sorter: (a, b) => Number(a.sending_users) - Number(b.sending_users),
        },
        {
            title: 'Створено',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => parseDateString(a.createdAt) - parseDateString(b.createdAt),
            sortDirections: ['descend', 'ascend'],
            render: (text) => dayjs(text).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm'),
        },
        {
            title: 'Закінчено',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            sorter: (a, b) => parseDateString(a.updatedAt) - parseDateString(b.updatedAt),
            sortDirections: ['descend', 'ascend'],
            render: (text) => dayjs(text).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm'),
        },
        // {
        //     title: '',
        //     dataIndex: '_id',
        //     key: '_id',
        //     render: (_id) =>
        //         (<Button href={`/mailing/${_id}`} block>Переглянути</Button>)
        // },
        {
            title: '',
            dataIndex: '_id',
            key: '_id',
            render: (_id, record) => {
                const createdAt = dayjs(record?.date).tz("Europe/Kiev");
                const isDisabled = dayjs().tz("Europe/Kiev").diff(createdAt, "minute") ;

                return (
                    <Button
                        danger
                        disabled={isDisabled >= -2}
                        onClick={()=>cancelMailing(record?._id)}
                        block
                    >
                        Скасувати
                    </Button>
                );
            }
        }
    ];

    return (
        <div>
            <h2>Розсилка</h2>
            <div className="mailing_content">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    initialValues={{
                        variant: 'filled',
                    }}
                >
                    <div style={{display: 'flex', gap: '20px', width: '100%'}}>
                        <div>
                            <h4>Фото, відео</h4>
                            <Form.Item name="photo">
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    beforeUpload={() => false}
                                    onChange={handleChange}
                                    maxCount={1}
                                >
                                    {fileList.length >= 1 ? null : (
                                        <button style={{border: 0, background: "none"}} type="button">
                                            <PlusOutlined/>
                                            <div style={{marginTop: 8}}>Upload</div>
                                        </button>
                                    )}
                                </Upload>
                            </Form.Item>
                        </div>

                        <div style={{width: '100%'}}>
                            <h4>Текст розсилки</h4>
                            <Form.Item
                                name='message'
                                rules={[
                                    {required: true, message: "Введіть повідомлення модуля"},
                                    fileList?.length ? {
                                        max: 768,
                                        message: "Максимальна довжина 768 символів"
                                    } : {max: 4096, message: "Максимальна довжина 768 символів"}
                                ]}
                            >
                                <TextArea maxLength={fileList?.length ? 768 : 4096} showCount rows={6}/>
                            </Form.Item>
                            {fileList?.length ? <span style={{color: '#dc4446'}}>
                                    Дозволено 768 символів для розсилки з фото або відео
                                </span> : <></>}
                            <h4>Дата та час розсилки</h4>
                            <Form.Item
                                name='date'
                                style={{width: '100%'}}
                                rules={[{required: true, message: "Оберіть час відкриття модулю"}]}
                            >
                                <DatePicker
                                    style={{width: "100%"}}
                                    showTime
                                    format="DD.MM.YYYY HH:mm"
                                    disabledDate={disabledDate}
                                    disabledTime={disabledTime}
                                />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item style={{width: '100%'}}>
                        <Button
                            type="primary"
                            className='create_button'
                            htmlType="submit"
                            style={{width: "100%"}}
                        >
                            Створити розсилку
                        </Button>
                    </Form.Item>
                </Form>
            </div>

            <div className="items">
                <Table className='usersList' columns={columns} size="small" dataSource={data}/>
            </div>
        </div>
    );
};

export default ModuleEditor;