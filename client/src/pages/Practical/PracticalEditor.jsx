import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import { PlusOutlined } from '@ant-design/icons';
import {
    Button,
    Form,
    Input,
    message,
    Upload,
} from 'antd';
import axios from "axios";
import {url} from "../../Config.jsx";

const { TextArea } = Input;

const PracticalEditor = () => {
    const { id } = useParams();
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleChange = ({ fileList }) => {
        setFileList(fileList.slice(-1));
    };

    const getPractical = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/practical/${id}`);

            if (data?.practical) {
                form.setFieldsValue({
                    title: data.practical.title,
                    message: data.practical.message,
                });

                if (data.practical.photo) {
                    const photoFile = {
                        uid: '-1',
                        name: 'practical-photo',
                        status: 'done',
                        url: `${url}/uploads/practical/${data.practical.photo}`,
                        existing: true,
                        serverPath: data.practical.photo
                    };
                    setFileList([photoFile]);
                }

            }
        } catch (error) {
            console.error("Помилка завантаження практичного завдання:", error);
            message.error("Помилка завантаження практичного завдання");
        } finally {
        }
    };

    useEffect(() => {
        if (id && id !== 'create') {
            getPractical();
        }
    }, [id, form]);

    const onFinish = async (values) => {
        try {
            const formData = new FormData();

            Object.keys(values).forEach((key) => {
                if (key === 'date') {
                    formData.append(key, values[key].format());
                } else if (key !== 'photo') {
                    formData.append(key, values[key]);
                }
            });

            if (fileList[0]?.originFileObj) {
                formData.append("photo", fileList[0].originFileObj);
            } else if (fileList[0]?.existing) {
                formData.append("existing_photo", fileList[0].serverPath);
            }

            const endpoint = id === 'create'
                ? `${url}/api/v1/practical/create`
                : `${url}/api/v1/practical/update/${id}`;

            const { data } = await axios.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (data?.success) {
                message.success(id === 'create' ? 'Практичне завдання створено' : 'Практичне завдання оновлено');
                setTimeout(() => {
                    navigate(`/practical/${data?.id || id}`);
                }, 1000);
            }
        } catch (error) {
            console.error("Помилка:", error);
            message.error("Помилка при збереженні практичного завдання");
        }
    };

    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    return (
        <div>
            <h2>{id === 'create' ? 'Створення нового практичного завдання' : 'Редагування практичного завдання'}</h2>
            <div className="practical_content">
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
                            <h4>Фото завдання</h4>
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
                            <h4>Назва практичного завдання</h4>
                            <Form.Item
                                name="title"
                                style={{width: '100%'}}
                                rules={[{required: true, message: "Введіть назву практичного завдання"}]}
                            >
                                <Input/>
                            </Form.Item>
                        </div>
                    </div>

                    <h4>Завдання</h4>
                    <Form.Item
                        name='message'
                        rules={[{required: true, message: "Введіть завдання"}]}
                    >
                        <TextArea rows={4}/>
                    </Form.Item>

                    <Form.Item style={{width: '100%'}}>
                        <Button
                            type="primary"
                            className='create_button'
                            htmlType="submit"
                            style={{width: "100%"}}
                        >
                            {id === 'create' ? 'Створити практичну' : 'Змінити практичну'}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default PracticalEditor;