import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import axios from "axios";
import {url} from "../../Config.jsx";
import {message, Space, Image, Button} from "antd";
import dayjs from "dayjs";
import {
    DownloadOutlined, ZoomInOutlined, ZoomOutOutlined,
} from '@ant-design/icons';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone)

const Chat = () => {
    
    const userTimezone = dayjs.tz.guess();
    const [isData,setData] = useState([])
    const { id } = useParams();

    useEffect(() => {
        if(id){
            const getChat = async () => {
                const {data} = await axios.post(
                    `${url}/api/v1/admin/getUserChat`,
                    {id},
                    {withCredentials: true}
                );

                if(data?.chat)
                    setData(data?.chat)
                else
                    message.error(data?.eMessage)
            }
            getChat()
        }
    }, []);

    const onDownload = (url) => {
        fetch(url)
            .then((response) => response.blob())
            .then((blob) => {
                const url = URL.createObjectURL(new Blob([blob]));
                const link = document.createElement('a');
                link.href = url;
                link.download = 'image.png';
                document.body.appendChild(link);
                link.click();
                URL.revokeObjectURL(url);
            })
}
                return (
        <>
            <ul className="chat-thread" style={{overflow:'hidden'}}>
            {isData ? isData?.map((item,index) => (
                    (item?.type === 'text' &&
                        <li key={`${item.role}_${index}`} className={`support_message_${item.role}`}>{item.content}<span
                            className='time'>{dayjs(item.time).tz(userTimezone).format('HH:mm')}</span></li>
                    )
                        ||
                    (item?.type === 'document' &&
                        <li key={`${item.role}_${index}`} className={`support_message_${item.role}`}>
                            {(() => {
                                const segments = item.content.split('/');
                                const filename = segments[segments.length - 1];
                                const parts = filename.split('.');
                                const name = parts[0];
                                const extension = parts[parts.length - 1];

                                return (
                                    <div>
                                        <p>Назва файлу: {name}<br/>
                                        Розширення файлу: {extension}</p>
                                        <Button type="link" href={item.content} shape="round" icon={<DownloadOutlined />} size={0}>
                                            Download
                                        </Button>
                                    </div>
                                );
                            })()}

                            <span className='time'>{dayjs(item.time).tz(userTimezone).format('HH:mm')}</span>
                        </li>
                    )
                        ||
                    (item?.type === 'image' &&
                        <li key={`${item.role}_${index}`} className={`support_message_${item.role}`}>
                            <Image
                                width={200}
                                src={item.content}
                                preview={{
                                    toolbarRender: (
                                        _,
                                        {
                                            transform: { scale },
                                            actions: { onZoomOut, onZoomIn },
                                        },
                                    ) => (
                                        <Space size={12} className="toolbar-wrapper">
                                            <DownloadOutlined onClick={()=>onDownload(item.content)} />
                                            <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                                            <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                                        </Space>
                                    ),
                                }}
                            />
                            <span className='time'>{dayjs(item.time).tz(userTimezone).format('HH:mm')}</span></li>
                    )
                        ||
                    (item?.type === 'end' &&
                        <li key={`${item.role}_${index}`} className={`support_message_${item.role}`}>{item.content}<span
                            className='time'>{dayjs(item.time).tz(userTimezone).format('HH:mm')}</span></li>
                    )
                ))
                :
                <></>
            }
            </ul>
        </>
    );
};

export default Chat;