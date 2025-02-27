import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import { PlusOutlined } from '@ant-design/icons';
import {
    Button,
    Form,
    Input,
    message,
    DatePicker,
    Select,
    Upload,
} from 'antd';
import axios from "axios";
import {url} from "../../Config.jsx";
import dayjs from "dayjs";

const { TextArea } = Input;

const ModuleEditor = () => {
    const { id } = useParams();
    const [fileList, setFileList] = useState([]);
    const [otherFileList, setOtherFileList] = useState([]);
    const [isVideoList, setVideoList] = useState([]);
    const [isTestList, setTestList] = useState([]);
    const [isTaskList, setTaskList] = useState([]);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [existingFiles, setExistingFiles] = useState([]);

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

    const handleChangeOtherFiles = ({ fileList }) => {
        setOtherFileList(fileList);
        form.setFieldsValue({ other_file: fileList });
    };

    const getModule = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/module/${id}`);

            if (data?.module) {
                form.setFieldsValue({
                    title: data.module.title,
                    message: data.module.message,
                    test_id: data.module.test_id,
                    task_id: data.module.task_id,
                    video: data.module.video,
                    date: dayjs(data.module.date),
                    link_module: data.module.link_module
                });

                if (data.module.photo) {
                    const photoFile = {
                        uid: '-1',
                        name: 'module-photo',
                        status: 'done',
                        url: `${url}/uploads/module/${data.module.photo}`,
                        existing: true,
                        serverPath: data.module.photo
                    };
                    setFileList([photoFile]);
                }

                if (data.module.other_files && data.module.other_files.length > 0) {
                    const otherFiles = data.module.other_files.map((file, index) => ({
                        uid: `${index + 1}`,
                        name: file.split('/').pop(),
                        status: 'done',
                        url: `${url}/uploads/module/${file}`,
                        existing: true,
                        serverPath: file
                    }));
                    setOtherFileList(otherFiles);
                    setExistingFiles(otherFiles);
                    form.setFieldsValue({ other_file: otherFiles });
                }
            }
        } catch (error) {
            console.error("Помилка завантаження модуля:", error);
            message.error("Помилка завантаження модуля");
        } finally {
        }
    };

    const getData = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/module/data`);

            if (data?.success) {
                setVideoList(data?.video)
                setTaskList(data?.task)
                setTestList(data?.test)
            }
        } catch (error) {
            console.error("Помилка завантаження модуля:", error);
            message.error("Помилка завантаження модуля");
        } finally {
        }
    };

    useEffect(() => {
        if (id && id !== 'create') {
            getModule();
        }

        getData()
    }, [id, form]);

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

            const existingFilePaths = [];
            otherFileList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append("other_file", file.originFileObj);
                } else if (file.existing) {
                    existingFilePaths.push(file.serverPath);
                }
            });

            if (existingFilePaths.length > 0) {
                formData.append("existing_files", JSON.stringify(existingFilePaths));
            }

            const endpoint = id === 'create'
                ? `${url}/api/v1/module/create`
                : `${url}/api/v1/module/update/${id}`;

            const { data } = await axios.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (data?.success) {
                message.success(id === 'create' ? 'Модуль створено' : 'Модуль оновлено');
                setTimeout(() => {
                    navigate(`/module/${data?.id || id}`);
                }, 1000);
            }
        } catch (error) {
            console.error("Помилка:", error);
            message.error("Помилка при збереженні модуля");
        }
    };

    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    const validateOtherFiles = (_, value) => {
        if (!value && otherFileList.length === 0) {
            return Promise.reject(new Error('Додайте файли для модуля'));
        }
        return Promise.resolve();
    };

    return (
        <div>
            <h2>{id === 'create' ? 'Створення нового модуля' : 'Редагування модуля'}</h2>
            <div className="module_content">
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
                            <h4>Фото модуля</h4>
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
                            <h4>Заголовок модуля</h4>
                            <Form.Item
                                name="title"
                                style={{width: '100%'}}
                                rules={[{required: true, message: "Введіть заголовок модуля"}]}
                            >
                                <Input/>
                            </Form.Item>
                            <h4>Дата та час доступу до модуля</h4>
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

                    <h4>Повідомлення модуля</h4>
                    <Form.Item
                        name='message'
                        rules={[{required: true, message: "Введіть повідомлення модуля"}]}
                    >
                        <TextArea rows={4}/>
                    </Form.Item>
                    <h4>Посилання для практичних</h4>
                    <Form.Item
                        name="link_module"
                        style={{width: '100%'}}
                        rules={[{required: true, message: "Посилання для практичних"}]}
                    >
                        <Input/>
                    </Form.Item>
                    <h4>Оберіть тестування для модуля</h4>
                    <Form.Item name='test_id'>
                        <Select
                            size={'middle'}
                            placeholder="Оберіть тест"
                            style={{
                                width: '100%',
                            }}
                            allowClear
                            options={isTestList}
                        />
                    </Form.Item>

                    <h4>Оберіть практичне завдання модуля</h4>
                    <Form.Item name='task_id'>
                        <Select
                            mode="tags"
                            size={'middle'}
                            placeholder="Оберіть практичне завдання"
                            style={{
                                width: '100%',
                            }}
                            defaultValue={[]}

                            options={isTaskList}
                        />
                    </Form.Item>

                    <h4>Оберіть відео із відеотеки</h4>
                    <Form.Item name='video'>
                        <Select
                            mode="tags"
                            size={'middle'}
                            placeholder="Оберіть відео"
                            style={{
                                width: '100%',
                            }}
                            options={isVideoList}
                        />
                    </Form.Item>

                    <h4>Файли модуля (фото, pdf)</h4>
                    <Form.Item
                        name='other_file'
                        // rules={[{validator: validateOtherFiles}]}
                    >
                        <Upload
                            listType="picture-card"
                            fileList={otherFileList}
                            beforeUpload={() => false}
                            onChange={handleChangeOtherFiles}
                        >
                            <button
                                style={{
                                    border: 0,
                                    background: 'none',
                                }}
                                type="button"
                            >
                                <PlusOutlined/>
                                <div style={{marginTop: 8}}>
                                    Upload
                                </div>
                            </button>
                        </Upload>
                    </Form.Item>

                    <Form.Item style={{width: '100%'}}>
                        <Button
                            type="primary"
                            className='create_button'
                            htmlType="submit"
                            style={{width: "100%"}}
                        >
                            {id === 'create' ? 'Створити новий модуль' : 'Змінити'}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default ModuleEditor;