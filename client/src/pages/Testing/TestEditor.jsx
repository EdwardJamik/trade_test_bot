import React, { useRef, useState, useEffect } from 'react';
import DraggableList from "react-draggable-list";
import { Button, Collapse, Form, Input, message, Radio, Upload, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

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
        answer: null
    }
];

const TestEditor = () => {
    const [list, setList] = useState(initialData);
    const { id } = useParams();
    const containerRef = useRef();
    const [form] = Form.useForm();

    const _onListChange = (newList) => {
        setList(newList);
    };

    const addNewQuestion = () => {
        const newQuestion = {
            id: Math.max(...list.map(item => item.id)) + 1,
            question: '',
            question_img: '',
            choices: ['Відповідь 1', 'Відповідь 2', 'Відповідь 3', 'Відповідь 4'],
            answer: null
        };
        setList([...list, newQuestion]);
    };

    const onFinish = async (values) => {
        try {

            const questions = list.map((item) => {
                const questionData = {
                    id: item.id,
                    question: values[`question-${item.id}`],
                    photo: values[`photo-${item.id}`]?.[0]?.originFileObj,
                    choices: values[`choices-${item.id}`],
                    correctAnswer: values[`correctAnswer-${item.id}`]
                };
                return questionData;
            });

            const questionsList = {
                title: values?.title_test,
                questions
            }

            console.log('Formatted Questions:', questionsList);

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
            form.setFieldValue(`choices-${item.id}`, item.choices);
        }, [item.id]);

        const onChoiceChange = (value, index) => {
            const newChoices = [...localChoices];
            newChoices[index] = value;
            setLocalChoices(newChoices);
            form.setFieldValue(`choices-${item.id}`, newChoices);
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
                                        beforeUpload={() => false}
                                        maxCount={1}
                                    >
                                        <button style={{ border: 0, background: "none" }} type="button">
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                        </button>
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