import React, { useRef, useState, useEffect } from 'react';
import DraggableList from "react-draggable-list";
import { Button, Collapse, Form, Input, message, Radio, Upload, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {useNavigate, useParams} from "react-router-dom";
import {url} from "../../Config.jsx";
import axios from "axios";
import dayjs from "dayjs";

const { Panel } = Collapse;

const touchIcon = [<svg fill="#fff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" enableBackground="new 0 0 52 52">
    <path d="M20,4c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S17.8,4,20,4z M32,4c2.2,0,4,1.8,4,4 s-1.8,4-4,4s-4-1.8-4-4S29.8,4,32,4z M20,16c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S17.8,16,20,16z M32,16c2.2,0,4,1.8,4,4 s-1.8,4-4,4s-4-1.8-4-4S29.8,16,32,16z M20,28c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S17.8,28,20,28z M32,28c2.2,0,4,1.8,4,4 s-1.8,4-4,4s-4-1.8-4-4S29.8,28,32,28z M20,40c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S17.8,40,20,40z M32,40c2.2,0,4,1.8,4,4 s-1.8,4-4,4s-4-1.8-4-4S29.8,40,32,40z"></path>
</svg>];

const initialData = [
    {
        id: 1,
        question: '',
        question_img: '',
        choices: ['Відповідь 1', 'Відповідь 2', 'Відповідь 3', 'Відповідь 4'],
        answer: null,
        fileList: []
    }
];

const TestEditor = () => {
    const [list, setList] = useState(initialData);
    const { id } = useParams();
    const containerRef = useRef();
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const _onListChange = (newList) => {
        setList(newList);
    };

    const addNewQuestion = () => {
        // Зберігаємо поточні значення форми
        const currentFormValues = form.getFieldsValue();

        // Створюємо нове питання
        const newQuestion = {
            id: Math.max(...list.map(item => item.id)) + 1,
            question: '',
            question_img: '',
            choices: ['Відповідь 1', 'Відповідь 2', 'Відповідь 3', 'Відповідь 4'],
            answer: null,
            fileList: []
        };

        // Оновлюємо список, зберігаючи поточні значення
        setList(prevList => [...prevList, newQuestion]);

        // Відновлюємо значення форми для існуючих питань
        setTimeout(() => {
            const newFormValues = {};
            Object.keys(currentFormValues).forEach(key => {
                if (key !== `choices-${newQuestion.id}` && key !== `correctAnswer-${newQuestion.id}`) {
                    newFormValues[key] = currentFormValues[key];
                }
            });
            form.setFieldsValue(newFormValues);
        }, 0);
    };

    const updateQuestionFileList = (questionId, newFileList) => {
        setList(prevList =>
            prevList.map(item =>
                item.id === questionId
                    ? { ...item, fileList: newFileList }
                    : item
            )
        );
    };

    const getModule = async () => {
        try {
            const { data } = await axios.get(`${url}/api/v1/testing/${id}`);

            if (data?.module) {
                const { title, questions } = data.module;

                // Встановлюємо заголовок тесту
                form.setFieldValue('title_test', title);

                // Підготовка питань з файлами для стану
                const questionsWithFiles = questions.map(question => {
                    let fileList = [];
                    if (question.photo) {
                        fileList = [{
                            uid: `-${question.id}`, // унікальний id для antd Upload
                            name: question.photo, // ім'я файлу
                            status: 'done',
                            url: `${url}/uploads/testing/${question.photo}` // URL для перегляду
                        }];
                    }

                    return {
                        id: question.id,
                        fileList,
                        choices: question.choices,
                        answer: question.correctAnswer
                    };
                });

                // Оновлюємо стан списку питань
                setList(questionsWithFiles);

                // Встановлюємо значення для кожного питання
                questions.forEach(question => {
                    // Встановлюємо текст питання
                    form.setFieldValue(`question-${question.id}`, question.question);

                    // Встановлюємо варіанти відповідей
                    form.setFieldValue(`choices-${question.id}`, question.choices);

                    // Встановлюємо правильну відповідь
                    form.setFieldValue(`correctAnswer-${question.id}`, question.correctAnswer);
                });
            }
        } catch (error) {
            console.error("Помилка завантаження модуля:", error);
            message.error("Помилка завантаження модуля");
        }
    };

    useEffect(() => {
        if (id && id !== 'create') {
            getModule();
        }
    }, [id]);

    const onFinish = async (values) => {
        try {
            const formData = new FormData();

            formData.append('title', values?.title_test);

            list.forEach((item, index) => {
                // Додаємо фото якщо воно є
                if (item.fileList?.[0]?.originFileObj) {
                    formData.append(`question_photo_${item.id}`, item.fileList[0].originFileObj);
                }

                // Додаємо інші дані питання
                const questionData = {
                    id: item.id,
                    question: values[`question-${item.id}`],
                    choices: values[`choices-${item.id}`],
                    correctAnswer: values[`correctAnswer-${item.id}`],
                    // Додаємо флаг що показує чи потрібно зберегти старе фото
                    keepPhoto: item.fileList?.length > 0 && !item.fileList[0]?.originFileObj
                };

                formData.append(`question_${item.id}`, JSON.stringify(questionData));
            });

            const endpoint = id === 'create'
                ? `${url}/api/v1/testing/create`
                : `${url}/api/v1/testing/update/${id}`;

            const { data } = await axios.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (data?.success) {
                message.success(id === 'create' ? 'Тест створено' : 'Тест оновлено');
                setTimeout(() => {
                    navigate(`/tests/${data?.id || id}`);
                }, 1000);
            }

        } catch (error) {
            console.error("Error:", error);
            message.error("Error saving test");
        }
    };

    const Item = ({ item, dragHandleProps }) => {
        const { onMouseDown, onTouchStart } = dragHandleProps;
        const [localChoices, setLocalChoices] = useState(item.choices);
        const [choices, setChoices] = useState(item.choices);

        useEffect(() => {
            // Встановлюємо початкові значення тільки якщо поле ще не має значення
            const currentChoices = form.getFieldValue(`choices-${item.id}`);
            if (!currentChoices) {
                form.setFieldValue(`choices-${item.id}`, item.choices);
            }
        }, [item.id]);


        const handlePhotoChange = ({ fileList }) => {
            updateQuestionFileList(item.id, fileList);
        };

        const beforeUpload = (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('You can only upload image files!');
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                message.error('Image must smaller than 2MB!');
            }
            return false; // Prevent automatic upload
        };

        return (
            <div className="item-wrapper" style={{ margin: '4px 0' }}>
                <div style={{
                    border: "1px solid #C99C48",
                    borderRadius: '8px',
                    backgroundColor: '#191919',
                    padding: '2px 6px',
                    width: '100%',
                }}>
                    <div
                        className="dragHandle"
                        style={{
                            color: '#fff',
                            width: "20px",
                            height: "20px",
                            cursor: 'pointer',
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            document.body.style.overflow = "hidden";
                            onTouchStart(e);
                        }}
                        onMouseDown={(e) => {
                            document.body.style.overflow = "hidden";
                            onMouseDown(e);
                        }}
                        onTouchEnd={() => document.body.style.overflow = "visible"}
                        onMouseUp={() => document.body.style.overflow = "visible"}
                    >
                        {touchIcon}
                    </div>

                    <Collapse
                        className="custom-collapse"
                        bordered={false}
                        defaultActiveKey={['1']}
                        style={{ backgroundColor: '#191919' }}
                    >
                        <Panel
                            header={<span style={{ color: "#fff" }}>{`Питання ${item.id}`}</span>}
                            key="1"
                        >
                            <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                                <Form.Item
                                    label="Фото"
                                    name={`photo-${item.id}`}
                                >
                                    <Upload
                                        listType="picture-card"
                                        fileList={item.fileList}
                                        beforeUpload={beforeUpload}
                                        onChange={handlePhotoChange}
                                        maxCount={1}
                                    >
                                        {item.fileList.length >= 1 ? null : (
                                            <button style={{border: 0, background: "none"}} type="button">
                                                <PlusOutlined/>
                                                <div style={{marginTop: 8}}>Upload</div>
                                            </button>
                                        )}
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Питання"
                                    name={`question-${item.id}`}
                                    rules={[{ required: true, message: "Введіть запитання" }]}
                                    style={{ width: '100%' }}
                                >
                                    <Input />
                                </Form.Item>
                            </div>

                            <Form.List
                                name={`choices-${item.id}`}
                                initialValue={item.choices}
                            >
                                {(fields, { add, remove }) => {
                                    const updatedChoices = fields.map(field => form.getFieldValue(`choices-${item.id}`)?.[field.name] || '');
                                    if (JSON.stringify(updatedChoices) !== JSON.stringify(choices)) {
                                        setChoices(updatedChoices);
                                    }

                                    return (
                                        <>
                                            {fields.map((field, index) => {
                                                const label = String.fromCharCode(65 + index);
                                                return (
                                                    <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                        <span>{label}.</span>
                                                        <Form.Item
                                                            {...field}
                                                            rules={[{ required: true, message: 'Please enter the choice' }]}
                                                        >
                                                            <Input placeholder={`Choice ${label}`} />
                                                        </Form.Item>
                                                        {fields.length > 2 && (
                                                            <MinusCircleOutlined onClick={() => {
                                                                remove(field.name);
                                                                form.setFieldValue(`correctAnswer-${item.id}`, null);
                                                            }} />
                                                        )}
                                                    </Space>
                                                );
                                            })}
                                            {fields.length < 4 && (
                                                <Form.Item>
                                                    <Button
                                                        onClick={() => add()}
                                                        icon={<PlusOutlined />}
                                                    >
                                                        Add Choice
                                                    </Button>
                                                </Form.Item>
                                            )}
                                        </>
                                    );
                                }}
                            </Form.List>

                            {choices.length > 0 && (
                                <Form.Item
                                    name={`correctAnswer-${item.id}`}
                                    label="Відповідь"
                                    rules={[{ required: true, message: 'Please select the correct answer' }]}
                                >
                                    <Radio.Group>
                                        {choices.map((_, index) => {
                                            if (_ !== '') {
                                                const label = String.fromCharCode(65 + index);
                                                return <Radio key={label} value={index}>{label}</Radio>;
                                            }
                                            return null;
                                        })}
                                    </Radio.Group>
                                </Form.Item>
                            )}
                        </Panel>
                    </Collapse>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div ref={containerRef} style={{ touchAction: "pan-y", padding: '10px 0' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h2>{id === 'create' ? 'Створення нового тесту' : 'Редагування тесту'}</h2>
                    <Button
                        type="primary"
                        onClick={addNewQuestion}
                        icon={<PlusOutlined/>}
                    >
                        Додати питання
                    </Button>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Назва тесту"
                        name={`title_test`}
                        rules={[{ required: true, message: "Введіть запитання" }]}
                        style={{ width: '100%' }}
                    >
                        <Input />
                    </Form.Item>
                    <DraggableList
                        itemKey="id"
                        template={Item}
                        list={list}
                        onMoveEnd={_onListChange}
                        container={() => containerRef.current}
                    />

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{ width: "100%" }}
                        >
                            {id === 'create' ? 'Створити тест' : 'Оновити тест'}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default TestEditor;