import {Spin} from "antd";

import {LoadingOutlined} from "@ant-design/icons";

const PageLoaderAsync = () => {
    return (
        <div className="loader_component">
            <LoadingOutlined
                style={{
                    color: 'rgba(255,139,0,1)',
                    fontSize: 36,
                }}
                spin
            />
        </div>
    )
}

export default PageLoaderAsync