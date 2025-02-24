import axios from "axios";
import React, { useState } from "react";
import {url} from "../../Config";
import {Alert, Button, Input, Modal, Select} from "antd";
import {EditOutlined} from "@ant-design/icons";


export default function UserForm({ getUsers }) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roots, setRoots] = useState([]);
    const [warning, setWarning] = useState([]);


    async function saveUser() {
        try {
            const userData = {
                email: email,
                password: password,
                roots: roots
            };


            const create_user = await axios.post(`${url}/api/v1/admin/register`, userData, {withCredentials: true});
            const data = create_user.data

            if(data.confirm)
            {
                setOpen(!open);
                setEmail('')
                setPassword('')
                setWarning('')
            } else{
                setWarning(data.errorMessage)
            }

        } catch (err) {
            console.error(err);
        }
    }

    const options = [{label: 'Наповнення',value:'0'},{label: 'Тести',value:'1'},{label: 'Модулі',value:'2'},{label: 'Практичні',value:'3'},{label: 'Відеотека',value:'4'},{label: 'Користувачі',value:'5'},{label: 'Розсилка',value:'6'}];

    const showModalEdit = async () => {
        setOpen(!open);
        setEmail('')
        setPassword('')
        setWarning('')
    };

    const handleChange = (value) => {
        setRoots(value)
    };

    return (
        <div className="container w-50">
            <h4 style={{    color: '#C99C48',
                fontSize: '28px',
                fontWeight: '600'}}>
                Користувачі системи
            </h4>
            <Button key='create_button' onClick={()=>{showModalEdit()}} className="create_button" type="primary" icon={<EditOutlined />} >Створити</Button>
            <Modal
                title={`Створення нового користувача системи`}
                open={open}
                key='ok1'
                closable={false}
                footer={[<Button key="disabled" className="button_continue" onClick={()=>showModalEdit()}>
                    Відмінити
                </Button>,
                    <Button key="save" className="button_continue" onClick={()=>saveUser()}>
                        Створити
                    </Button>
                ]}
            >
                <form>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Пошта</label>
                        <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value) }} className="form-control" id="email"/>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Пароль</label>
                        <Input type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} className="form-control" id="password"/>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="roots" className="form-label">Рівні доступу</label>
                    <Select
                        mode="tags"
                        style={{
                            width: '100%',
                        }}
                        id="roots"
                        placeholder="Доступ"
                        onChange={handleChange}
                        options={options}
                    />
                    </div>
                    <div>
                        {warning !== '' && <Alert className='alert_message' message={warning} type="error" />}
                    </div>
                </form>
            </Modal>

        </div>
    )
}
