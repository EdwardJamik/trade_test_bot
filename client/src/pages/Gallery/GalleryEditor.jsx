import React, {useEffect} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {
    Button,
    Form,
    Input,
    message,
} from 'antd';
import axios from "axios";
import {url} from "../../Config.jsx";


const GalleryEditor = () => {
    const { id } = useParams();
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const getPractical = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/gallery/${id}`);

            if (data?.video) {
                form.setFieldsValue({
                    title: data.video.title,
                });

            }
        } catch (error) {
            console.error("Помилка завантаження відеотеки:", error);
            message.error("Помилка завантаження відеотеки");
        } finally {
        }
    };

    useEffect(() => {
            getPractical();
    }, [id, form]);

    const onFinish = async (values) => {
        try {
            const endpoint = `${url}/api/v1/gallery/update/${id}`;

            const { data } = await axios.post(endpoint, {title: values?.title},{withCredentials: true});

            if (data?.success) {
                message.success('Відео оновлено');
                setTimeout(() => {
                    navigate(`/videolibraries/${data?.id || id}`);
                }, 1000);
            }
        } catch (error) {
            console.error("Помилка:", error);
            message.error("Помилка при оновленні відео");
        }
    };

    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    return (
        <div>
            <h2>Редагування відео</h2>
            <div className="practical_content">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    // initialValues={{
                    //     variant: 'filled',
                    // }}
                >
                    <div style={{display: 'flex', gap: '20px', width: '100%'}}>
                        <div style={{width: '100%'}}>
                            <h4>Назва відео</h4>
                            <Form.Item
                                name="title"
                                style={{width: '100%'}}
                                rules={[{required: true, message: "Введіть назву практичного завдання"}]}
                            >
                                <Input/>
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
                          Змінити
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default GalleryEditor;