import React from 'react';
import {Button, Collapse, DatePicker, Form, Input, Select, Upload} from 'antd';

import './toucher.css'
import {PlusOutlined} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";

const touchIcon = [<svg fill="#fff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" enableBackground="new 0 0 52 52"><path d="M20,4c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S17.8,4,20,4z M32,4c2.2,0,4,1.8,4,4 s-1.8,4-4,4s-4-1.8-4-4S29.8,4,32,4z M20,16c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S17.8,16,20,16z M32,16c2.2,0,4,1.8,4,4 s-1.8,4-4,4s-4-1.8-4-4S29.8,16,32,16z M20,28c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S17.8,28,20,28z M32,28c2.2,0,4,1.8,4,4 s-1.8,4-4,4s-4-1.8-4-4S29.8,28,32,28z M20,40c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S17.8,40,20,40z M32,40c2.2,0,4,1.8,4,4 s-1.8,4-4,4s-4-1.8-4-4S29.8,40,32,40z"></path></svg>]
const Panel = Collapse.Panel;
const Toucher = (item, itemSelected, dragHandleProps) => {
    const {onMouseDown, onTouchStart} = dragHandleProps;
    const [form] = Form.useForm();

    return (
        <div style={{
            border: "1px solid #C99C48",
            borderRadius: '8px',
            color: '#fff',
            backgroundColor: '#191919',
            background: '#191919',
            display: "flex",
            userSelect: "none",
            alignItems: 'center',
            padding: '2px 6px',
        }}>
            <div
                className="disable-select dragHandle"
                style={{
                    fontWeight: "600",
                    color: '#fff',
                    width: "20px",
                    height: "20px",
                    cursor: 'pointer'
                }}
                onTouchStart={(e) => {
                    e.preventDefault();
                    console.log("touchStart");
                    // e.target.style.backgroundColor = "blue";
                    document.body.style.overflow = "hidden";
                    onTouchStart(e);
                }}
                onMouseDown={(e) => {
                    console.log("mouseDown");
                    document.body.style.overflow = "hidden";
                    onMouseDown(e);
                }}
                onTouchEnd={(e) => {
                    // e.target.style.backgroundColor = "black";
                    document.body.style.overflow = "visible";
                }}
                onMouseUp={() => {
                    document.body.style.overflow = "visible";
                }}
            >{touchIcon}</div>

            <Collapse className="custom-collapse" bordered={false} defaultActiveKey={['0']} style={{color: '#fff',  width:'100%', backgroundColor: '#191919'}}>
                <Panel
                    header={<span style={{ color: "#fff" }}>{`${item.id} ${item.title}`}</span>}
                    key="1"
                    forceRender={true}
                >
                    <div
                        className="disable-select"
                        style={{
                            borderRadius: '8px',
                            margin: "4px",
                            padding: "10px",
                            display: "flex",
                            userSelect: "none",
                            color: '#fff',
                        }}
                    >
                        <div
                            style={{
                                fontWeight: "600",
                                color: '#fff',
                                width: "20px",
                                height: "20px",
                                cursor: 'pointer'
                            }}
                        >
                            {item.id}

                            <Form
                                // form={form}
                                layout="vertical"
                                // onFinish={onFinish}
                                // onFinishFailed={onFinishFailed}
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
                                                // fileList={fileList}
                                                beforeUpload={() => false}
                                                // onChange={handleChange}
                                                maxCount={1}
                                            >
                                                {/*{fileList.length >= 1 ? null : (*/}
                                                    <button style={{border: 0, background: "none"}} type="button">
                                                        <PlusOutlined/>
                                                        <div style={{marginTop: 8}}>Upload</div>
                                                    </button>
                                                {/*)}*/}
                                            </Upload>
                                        </Form.Item>
                                    </div>

                                    <div style={{width: '100%'}}>
                                        <h4>Заголовок модулю</h4>
                                        <Form.Item
                                            name="title"
                                            style={{width: '100%'}}
                                            rules={[{required: true, message: "Введіть заголовок модулю"}]}
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
                                                style={{ width: "100%" }}
                                                showTime
                                                format="DD.MM.YYYY HH:mm"
                                                // disabledDate={disabledDate}
                                                // disabledTime={disabledTime}
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

                                <h4>Оберіть тестування для модуля</h4>
                                <Form.Item name='test_id'>
                                    <Select>
                                        <Select.Option value="demo">Demo</Select.Option>
                                    </Select>
                                </Form.Item>

                                <h4>Оберіть практичне завдання модуля</h4>
                                <Form.Item name='task_id'>
                                    <Select>
                                        <Select.Option value="demo">Demo</Select.Option>
                                    </Select>
                                </Form.Item>

                                <h4>Файли модуля (відео, фото, pdf)</h4>
                                <Form.Item
                                    name='other_file'
                                    // rules={[{ validator: validateOtherFiles }]}
                                >
                                    <Upload
                                        listType="picture-card"
                                        // fileList={otherFileList}
                                        beforeUpload={() => false}
                                        // onChange={handleChangeOtherFiles}
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
                                        {/*{id === 'create' ? 'Створити новий модуль' : 'Змінити'}*/}
                                    </Button>
                                </Form.Item>
                            </Form>

                        </div>

                    </div>
                </Panel>
            </Collapse>
        </div>
    );
};

export default Toucher;