import {Button, Card, Col, Row, Statistic} from "antd";
import axios from "axios";
import {url} from "../../Config.jsx";
import {useEffect, useState} from "react";
import * as XLSX from "xlsx";

export default function Home() {

  const [data, setData] = useState([]);

  async function getStatistic() {

      const {data} = await axios.get(
          `${url}/api/v1/admin/callRequestCountHome`, {withCredentials: true}
      );
    return setData(data)
  }

  useEffect(() => {
    getStatistic();
  }, []);


  const count = [
      {
          title: "Загальна кількість користувачів телеграм/вайбер",
          badge: ['Tg:','Viber:','Разом:'],
          h: data?.stat_1 ? data?.stat_1[0] : 0,
          d: data?.stat_1 ? data?.stat_1[1] : 0,
          m: data?.stat_1 ? data?.stat_1[2] : 0
      },
      {
          title: "Кількість нових користувачів в телеграм/вайбер",
          badge: ['24h:','7d:','1M:'],
          h: data?.stat_2 ? data?.stat_2[0] : 0,
          d: data?.stat_2 ? data?.stat_2[1] : 0,
          m: data?.stat_2 ? data?.stat_2[2] : 0
      },
      {
          title: "Кількість активних користувачів телеграм/вайбер",
          badge: ['24h:','7d:','1M:'],
          h: data?.stat_3 ? data?.stat_3[0] : 0,
          d: data?.stat_3 ? data?.stat_3[1] : 0,
          m: data?.stat_3 ? data?.stat_3[2] : 0
      },
      {
          title: "Кількість розсилок: відправлених/доставлених",
          badge: ['24h:','7d:','1M:'],
          h: data?.stat_4 ? data?.stat_4[0] : 0,
          d: data?.stat_4 ? data?.stat_4[1] : 0,
          m: data?.stat_4 ? data?.stat_4[2] : 0
      },
      {
          title: "Кількість переходів по посиланням",
          badge: ['24h:','7d:','1M:'],
          h: data?.stat_5 ? data?.stat_5[0] : 0,
          d: data?.stat_5 ? data?.stat_5[1] : 0,
          m: data?.stat_5 ? data?.stat_5[2] : 0
      },
      {
          title: "Кількість запитів до менеджера",
          badge: ['24h:','7d:','1M:'],
          h: data?.stat_6 ? data?.stat_6[0] : 0,
          d: data?.stat_6 ? data?.stat_6[1] : 0,
          m: data?.stat_6 ? data?.stat_6[2] : 0
      },
      {
          title: "Кількість запитів на персональний підбір.",
          badge: ['24h:','7d:','1M:'],
          h: data?.stat_7 ? data?.stat_7[0] : 0,
          d: data?.stat_7 ? data?.stat_7[1] : 0,
          m: data?.stat_7 ? data?.stat_7[2] : 0
      },
      {
          title: "Кількість записів на семінари",
          badge: ['24h:','7d:','1M:'],
          h: data?.stat_8 ? data?.stat_8[0] : 0,
          d: data?.stat_8 ? data?.stat_8[1] : 0,
          m: data?.stat_8 ? data?.stat_8[2] : 0
      }

  ];

    const exportToExcel = async () => {
        let myArray;
        const requestList = await axios.get(`${url}/api/v1/admin/callRequestCountHome/`, {withCredentials: true});
        myArray = requestList.data;

        const headers = [
            'Загальна кількість користувачів телеграм/вайбер',
            'Кількість нових користувачів в телеграм/вайбер',
            'Кількість активних користувачів телеграм/вайбер',
            'Кількість розсилок: відправлених/доставлених',
            'Кількість переходів по посиланням',
            'Кількість запитів до менеджера',
            'Кількість запитів на персональний підбір',
            'Кількість записів на семінари'
        ];

        const dataWithoutId = data.stat_1.map((_, index) => ({
            stat_1: index === 0 ? `Tg: ${data.stat_1[index]}` : index === 1 ? `Viber: ${data.stat_1[index]}` : `Разом: ${data.stat_1[index]}`,
            stat_2: index === 0 ? `24h: ${data.stat_2[index]}` : index === 1 ? `7d: ${data.stat_2[index]}` : `1M: ${data.stat_2[index]}`,
            stat_3: index === 0 ? `24h: ${data.stat_3[index]}` : index === 1 ? `7d: ${data.stat_3[index]}` : `1M: ${data.stat_3[index]}`,
            stat_4: index === 0 ? `24h: ${data.stat_4[index]}` : index === 1 ? `7d: ${data.stat_4[index]}` : `1M: ${data.stat_4[index]}`,
            stat_5: index === 0 ? `24h: ${data.stat_5[index]}` : index === 1 ? `7d: ${data.stat_5[index]}` : `1M: ${data.stat_5[index]}`,
            stat_6: index === 0 ? `24h: ${data.stat_6[index]}` : index === 1 ? `7d: ${data.stat_6[index]}` : `1M: ${data.stat_6[index]}`,
            stat_7: index === 0 ? `24h: ${data.stat_7[index]}` : index === 1 ? `7d: ${data.stat_7[index]}` : `1M: ${data.stat_7[index]}`,
            stat_8: index === 0 ? `24h: ${data.stat_8[index]}` : index === 1 ? `7d: ${data.stat_8[index]}` : `1M: ${data.stat_8[index]}`,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataWithoutId);

        const now = new Date();
        const formattedDate = now.toLocaleDateString('uk-UA');
        const formattedTime = now.toLocaleTimeString('uk-UA').replace(/:/g, '.');

        const fileName = `Аналітика_${formattedDate}_${formattedTime}.xlsx`;

        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Аналітика_${formattedDate}_${formattedTime}`);

        XLSX.writeFile(workbook, fileName);
    }

  return (
      <>
        {/*<div className="layout-content">*/}
        {/*    <div style={{display:'flex', width:'100%', marginBottom:'10px'}}>*/}
        {/*        <Button onClick={()=>exportToExcel()} style={{marginLeft:'auto'}} type='primary'>Завантажити аналітику</Button>*/}

        {/*    </div>*/}
        {/*  <Row className="rowgap-vbox" gutter={[24, 0]}>*/}
        {/*    {count.map((c, index) => (*/}
        {/*        <Col*/}
        {/*            key={index}*/}
        {/*            xs={24}*/}
        {/*            sm={24}*/}
        {/*            md={12}*/}
        {/*            lg={12}*/}
        {/*            xl={6}*/}
        {/*            className="mb-24"*/}
        {/*        >*/}
        {/*          <Card bordered={false} className="criclebox ">*/}
        {/*            <div className="number">*/}
        {/*              <Row align="middle" gutter={[24, 0]}>*/}
        {/*                <Col xs={24}>*/}
        {/*                  <span>{c.title}</span>*/}
        {/*                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px'}}>*/}
        {/*                        <Statistic style={{margin:'0 4px'}} value={c.h} prefix={c.badge[0]} />*/}
        {/*                        <Statistic style={{margin:'0 4px'}} value={c.d} prefix={c.badge[1]} />*/}
        {/*                        <Statistic style={{margin:'0 4px'}} value={c.m} prefix={c.badge[2]} />*/}
        {/*                    </div>*/}
        {/*                </Col>*/}
        {/*              </Row>*/}
        {/*            </div>*/}
        {/*          </Card>*/}
        {/*        </Col>*/}
        {/*    ))}*/}
        {/*  </Row>*/}
        {/*</div>*/}
      </>

  )
}
