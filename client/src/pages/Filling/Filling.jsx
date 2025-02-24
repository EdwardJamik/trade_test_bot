import React, {useEffect, useState} from 'react'
import "./filling.css"

import axios from "axios";
import {url} from "../../Config.jsx";
import {Input, message,Button} from "antd";
const { TextArea } = Input;

export default function Filling() {

    const [filling, setFilling] = useState([]);

    async function getFilling() {
        const fillingList = await axios.get(`${url}/api/v1/filling/all/`, {withCredentials: true});
        setFilling(fillingList.data);
    }

    useEffect(() => {
        getFilling();
    }, []);

    async function onUpdated() {
        try {
            await axios.post(`${url}/api/v1/filling/update`, filling, {withCredentials: true});
            message.success(`Збережено`);
        } catch (err) {
            console.error(err);
        }
    }

    const onChange = (e) => {
            filling[e.target.name].filling =  e.target.value;
    };

    return (
        <div className="filling">
            <h3>Редагування тексту відповідей</h3>
            {filling.map((review, i) => (
                <div key={i} style={{height:'100%'}}>
                    {review?.type === 'button' ?
                        <Input name={i} onChange={onChange} rootClassName="textarea__filling" style={{
                        display:"block",
                        height: 32,
                        resize: 'none',
                    }} id='url' defaultValue={review.filling} />
                        :
                        <TextArea
                        rootClassName="textarea__filling"
                        showCount
                        maxLength={4096}
                        style={{
                            display:"block",
                            height: 200,
                            resize: 'none',
                        }}
                        id={review._id}
                        name={i}
                        defaultValue={review.filling}
                        onChange={onChange}
                        placeholder="disable resize"
                        className="answer_textarea"
                    />}
                </div>
            ))}
            <div className="fixed_container">
                <Button className='button__save' onClick={()=>onUpdated()} type="primary">Зберегти</Button>
            </div>
        </div>
    )
}
