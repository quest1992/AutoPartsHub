export type ChinaManufacturerType =
  | 'STATE_OWNED'
  | 'PRIVATE'
  | 'JOINT_VENTURE'
  | 'SUBBRAND'
  | 'EXPORT_BRAND'
  | 'COMMERCIAL'
  | 'HISTORIC'
  | 'OTHER';

export type ChinaManufacturerIdentity = {
  slug: string;
  name: string;
  chineseName?: string;
  pinyin?: string;
  foundedYear?: number;
  parentCompany?: string;
  manufacturerType: ChinaManufacturerType;
  website?: string;
  aliases: string[];
};

const S = 'STATE_OWNED' as const;
const P = 'PRIVATE' as const;
const B = 'SUBBRAND' as const;
const E = 'EXPORT_BRAND' as const;
const J = 'JOINT_VENTURE' as const;
const H = 'HISTORIC' as const;
const C = 'COMMERCIAL' as const;

// Identity crosswalk only. Model facts still come from the pinned Wikidata
// and OpenEV snapshots. Unknown dates and websites are deliberately omitted.
export const CHINA_MANUFACTURER_IDENTITIES: ChinaManufacturerIdentity[] = [
  { slug: 'faw', name: 'FAW', chineseName: '中国一汽', pinyin: 'Zhongguo Yiqi', foundedYear: 1953, manufacturerType: S, website: 'https://www.faw.com/', aliases: ['FAW Group', 'China FAW Group'] },
  { slug: 'saic', name: 'SAIC Motor', chineseName: '上汽集团', pinyin: 'Shangqi Jituan', foundedYear: 1955, manufacturerType: S, website: 'https://www.saicmotor.com/', aliases: ['SAIC', 'Shanghai Automotive Industry Corporation'] },
  { slug: 'dongfeng', name: 'Dongfeng', chineseName: '东风汽车', pinyin: 'Dongfeng Qiche', foundedYear: 1969, manufacturerType: S, website: 'https://www.dongfeng-global.com/', aliases: ['Dongfeng Motor', 'Dongfeng Motor Corporation', 'Dongfeng Automobile Company Limited'] },
  { slug: 'changan', name: 'Changan', chineseName: '长安汽车', pinyin: "Chang'an Qiche", foundedYear: 1862, manufacturerType: S, website: 'https://www.globalchangan.com/', aliases: ['Changan Automobile', "Chang'an", 'Chana'] },
  { slug: 'baic', name: 'BAIC', chineseName: '北汽集团', pinyin: 'Beiqi Jituan', foundedYear: 1958, manufacturerType: S, website: 'https://www.baicglobal.com/', aliases: ['BAIC Group', 'BAIC Motor', 'Beijing Automotive Industry Holding'] },
  { slug: 'gac', name: 'GAC', chineseName: '广汽集团', pinyin: 'Guangqi Jituan', foundedYear: 1997, manufacturerType: S, website: 'https://www.gac.com.cn/', aliases: ['GAC Group', 'Guangzhou Automobile Group'] },
  { slug: 'jac', name: 'JAC', chineseName: '江淮汽车', pinyin: 'Jianghuai Qiche', foundedYear: 1964, manufacturerType: S, website: 'https://www.jac.com.cn/', aliases: ['JAC Group', 'Jianghuai Automobile'] },
  { slug: 'chery', name: 'Chery', chineseName: '奇瑞汽车', pinyin: 'Qirui Qiche', foundedYear: 1997, manufacturerType: S, website: 'https://www.cheryinternational.com/', aliases: ['Chery Automobile'] },
  { slug: 'great-wall', name: 'Great Wall Motor', chineseName: '长城汽车', pinyin: 'Changcheng Qiche', foundedYear: 1984, manufacturerType: P, website: 'https://www.gwm-global.com/', aliases: ['Great Wall', 'GWM'] },
  { slug: 'geely', name: 'Geely', chineseName: '吉利汽车', pinyin: 'Jili Qiche', foundedYear: 1986, manufacturerType: P, website: 'https://global.geely.com/', aliases: ['Geely Auto', 'Geely Automobile'] },
  { slug: 'byd', name: 'BYD', chineseName: '比亚迪', pinyin: 'Biyadi', foundedYear: 1995, manufacturerType: P, website: 'https://www.bydglobal.com/', aliases: ['BYD Auto', 'BYD Automobile'] },
  { slug: 'nio', name: 'NIO', chineseName: '蔚来', pinyin: 'Weilai', foundedYear: 2014, manufacturerType: P, website: 'https://www.nio.com/', aliases: ['Nio Inc.', 'Weilai'] },
  { slug: 'xpeng', name: 'XPeng', chineseName: '小鹏汽车', pinyin: 'Xiaopeng Qiche', foundedYear: 2014, manufacturerType: P, website: 'https://www.xpeng.com/', aliases: ['Xpeng Motors', 'Xiaopeng'] },
  { slug: 'li-auto', name: 'Li Auto', chineseName: '理想汽车', pinyin: 'Lixiang Qiche', foundedYear: 2015, manufacturerType: P, website: 'https://www.lixiang.com/', aliases: ['Li Xiang', 'Lixiang', 'Leading Ideal'] },
  { slug: 'leapmotor', name: 'Leapmotor', chineseName: '零跑汽车', pinyin: 'Lingpao Qiche', foundedYear: 2015, manufacturerType: P, website: 'https://www.leapmotor.com/', aliases: ['Leap Motor', 'Lingpao'] },
  { slug: 'xiaomi-auto', name: 'Xiaomi Auto', chineseName: '小米汽车', pinyin: 'Xiaomi Qiche', foundedYear: 2021, parentCompany: 'Xiaomi', manufacturerType: B, website: 'https://www.xiaomiev.com/', aliases: ['Xiaomi EV'] },
  { slug: 'zeekr', name: 'Zeekr', chineseName: '极氪', pinyin: 'Jike', foundedYear: 2021, parentCompany: 'Geely Holding', manufacturerType: B, website: 'https://www.zeekrglobal.com/', aliases: ['Ji Ke'] },
  { slug: 'avatr', name: 'Avatr', chineseName: '阿维塔', pinyin: 'Aweita', foundedYear: 2018, parentCompany: 'Changan Automobile', manufacturerType: B, website: 'https://www.avatr.com/', aliases: ['Avatr Technology'] },
  { slug: 'aito', name: 'AITO', chineseName: '问界', pinyin: 'Wenjie', foundedYear: 2021, parentCompany: 'Seres Group / HIMA', manufacturerType: B, website: 'https://aito.auto/', aliases: ['Wenjie'] },
  { slug: 'voyah', name: 'Voyah', chineseName: '岚图', pinyin: 'Lantu', foundedYear: 2020, parentCompany: 'Dongfeng Motor', manufacturerType: B, website: 'https://www.voyah.com.cn/', aliases: ['Lantu'] },
  { slug: 'im-motors', name: 'IM Motors', chineseName: '智己汽车', pinyin: 'Zhiji Qiche', foundedYear: 2020, parentCompany: 'SAIC Motor', manufacturerType: B, website: 'https://www.immotors.com/', aliases: ['IM', 'Zhiji'] },
  { slug: 'deepal', name: 'Deepal', chineseName: '深蓝汽车', pinyin: 'Shenlan Qiche', foundedYear: 2022, parentCompany: 'Changan Automobile', manufacturerType: B, website: 'https://www.deepal.com.cn/', aliases: ['Shenlan', 'Changan Deepal'] },
  { slug: 'hiphi', name: 'HiPhi', chineseName: '高合', pinyin: 'Gaohe', foundedYear: 2019, parentCompany: 'Human Horizons', manufacturerType: B, aliases: ['Gaohe'] },
  { slug: 'onvo', name: 'Onvo', chineseName: '乐道', pinyin: 'Ledao', foundedYear: 2024, parentCompany: 'NIO', manufacturerType: B, website: 'https://www.onvo.cn/', aliases: ['Ledao'] },
  { slug: 'firefly', name: 'Firefly', chineseName: '萤火虫', pinyin: 'Yinghuochong', foundedYear: 2024, parentCompany: 'NIO', manufacturerType: B, website: 'https://www.firefly.world/', aliases: [] },
  { slug: 'yangwang', name: 'Yangwang', chineseName: '仰望', pinyin: 'Yangwang', foundedYear: 2022, parentCompany: 'BYD', manufacturerType: B, website: 'https://www.yangwangauto.com/', aliases: [] },
  { slug: 'fangchengbao', name: 'Fangchengbao', chineseName: '方程豹', pinyin: 'Fangchengbao', foundedYear: 2023, parentCompany: 'BYD', manufacturerType: B, website: 'https://www.fangchengbao.com/', aliases: ['Fang Cheng Bao'] },
  { slug: 'denza', name: 'Denza', chineseName: '腾势', pinyin: 'Tengshi', foundedYear: 2010, parentCompany: 'BYD', manufacturerType: B, website: 'https://www.denza.com/', aliases: ['Tengshi'] },
  { slug: 'luxeed', name: 'Luxeed', chineseName: '智界', pinyin: 'Zhijie', foundedYear: 2023, parentCompany: 'Chery / HIMA', manufacturerType: B, aliases: ['Zhijie'] },
  { slug: 'stelato', name: 'Stelato', chineseName: '享界', pinyin: 'Xiangjie', foundedYear: 2024, parentCompany: 'BAIC / HIMA', manufacturerType: B, aliases: ['Xiangjie'] },
  { slug: 'maextro', name: 'Maextro', chineseName: '尊界', pinyin: 'Zunjie', foundedYear: 2024, parentCompany: 'JAC / HIMA', manufacturerType: B, aliases: ['Zunjie'] },
  { slug: 'arcfox', name: 'Arcfox', chineseName: '极狐', pinyin: 'Jihu', foundedYear: 2017, parentCompany: 'BAIC BluePark', manufacturerType: B, website: 'https://www.arcfox.com.cn/', aliases: ['Jihu'] },
  { slug: 'rising-auto', name: 'Rising Auto', chineseName: '飞凡汽车', pinyin: 'Feifan Qiche', foundedYear: 2021, parentCompany: 'SAIC Motor', manufacturerType: B, aliases: ['Feifan', 'R Auto'] },
  { slug: 'livan', name: 'Livan', chineseName: '睿蓝汽车', pinyin: 'Ruilan Qiche', foundedYear: 2022, parentCompany: 'Geely Holding', manufacturerType: B, aliases: ['Ruilan'] },
  { slug: 'geometry', name: 'Geometry', chineseName: '几何汽车', pinyin: 'Jihe Qiche', foundedYear: 2019, parentCompany: 'Geely Auto', manufacturerType: B, aliases: ['Geely Geometry'] },
  { slug: 'radar', name: 'Riddara', chineseName: '雷达汽车', pinyin: 'Leida Qiche', foundedYear: 2022, parentCompany: 'Geely Holding', manufacturerType: E, website: 'https://www.riddara.com/', aliases: ['Radar Auto', 'Radar'] },
  { slug: 'icar', name: 'iCAR', chineseName: 'iCAR', pinyin: 'iCAR', foundedYear: 2023, parentCompany: 'Chery', manufacturerType: B, website: 'https://www.icarglobal.com/', aliases: ['Chery iCAR'] },
  { slug: 'jetour', name: 'Jetour', chineseName: '捷途', pinyin: 'Jietu', foundedYear: 2018, parentCompany: 'Chery', manufacturerType: B, website: 'https://www.jetourglobal.com/', aliases: ['Jietu'] },
  { slug: 'exeed', name: 'Exeed', chineseName: '星途', pinyin: 'Xingtu', foundedYear: 2017, parentCompany: 'Chery', manufacturerType: B, website: 'https://www.exeedinternational.com/', aliases: ['Xingtu'] },
  { slug: 'omoda', name: 'Omoda', chineseName: '欧萌达', pinyin: 'Oumengda', foundedYear: 2022, parentCompany: 'Chery', manufacturerType: E, website: 'https://www.omodajaecoo.com/', aliases: ['Chery Omoda'] },
  { slug: 'jaecoo', name: 'Jaecoo', chineseName: '杰酷', pinyin: 'Jieku', foundedYear: 2023, parentCompany: 'Chery', manufacturerType: E, website: 'https://www.omodajaecoo.com/', aliases: ['Chery Jaecoo'] },
  { slug: 'aion', name: 'Aion', chineseName: '埃安', pinyin: 'Aian', foundedYear: 2017, parentCompany: 'GAC Group', manufacturerType: B, website: 'https://www.gac-aion.com/', aliases: ['GAC Aion'] },
  { slug: 'hyptec', name: 'Hyptec', chineseName: '昊铂', pinyin: 'Haobo', foundedYear: 2022, parentCompany: 'GAC Aion', manufacturerType: B, aliases: ['Hyper', 'GAC Hyper'] },
  { slug: 'haval', name: 'Haval', chineseName: '哈弗', pinyin: 'Hafu', foundedYear: 2013, parentCompany: 'Great Wall Motor', manufacturerType: B, website: 'https://www.haval-global.com/', aliases: [] },
  { slug: 'wey', name: 'Wey', chineseName: '魏牌', pinyin: 'Weipai', foundedYear: 2016, parentCompany: 'Great Wall Motor', manufacturerType: B, aliases: ['WEY'] },
  { slug: 'ora', name: 'Ora', chineseName: '欧拉', pinyin: 'Oula', foundedYear: 2018, parentCompany: 'Great Wall Motor', manufacturerType: B, aliases: ['GWM Ora'] },
  { slug: 'tank', name: 'Tank', chineseName: '坦克', pinyin: 'Tanke', foundedYear: 2021, parentCompany: 'Great Wall Motor', manufacturerType: B, aliases: ['GWM Tank'] },
  { slug: 'lynk-and-co', name: 'Lynk & Co', chineseName: '领克', pinyin: 'Lingke', foundedYear: 2016, parentCompany: 'Geely Auto', manufacturerType: B, website: 'https://www.lynkco.com/', aliases: ['Lynk and Co'] },
  { slug: 'zhipao', name: 'Jiyue', chineseName: '极越', pinyin: 'Jiyue', foundedYear: 2021, parentCompany: 'Geely / Baidu', manufacturerType: B, aliases: ['Ji Yue', 'Jidu'] },
  { slug: 'baojun', name: 'Baojun', chineseName: '宝骏', pinyin: 'Baojun', foundedYear: 2010, parentCompany: 'SAIC-GM-Wuling', manufacturerType: B, aliases: [] },
  { slug: 'wuling', name: 'Wuling', chineseName: '五菱', pinyin: 'Wuling', foundedYear: 1982, parentCompany: 'SAIC-GM-Wuling', manufacturerType: B, website: 'https://www.wuling.com/', aliases: ['Wuling Motors'] },
  { slug: 'roewe', name: 'Roewe', chineseName: '荣威', pinyin: 'Rongwei', foundedYear: 2006, parentCompany: 'SAIC Motor', manufacturerType: B, aliases: ['Rongwei'] },
  { slug: 'maxus', name: 'Maxus', chineseName: '上汽大通', pinyin: 'Shangqi Datong', foundedYear: 2011, parentCompany: 'SAIC Motor', manufacturerType: E, website: 'https://www.saicmaxus.com/', aliases: ['SAIC Maxus', 'LDV'] },
  { slug: 'bestune', name: 'Bestune', chineseName: '奔腾', pinyin: 'Benteng', foundedYear: 2006, parentCompany: 'FAW Group', manufacturerType: B, aliases: ['FAW Bestune', 'Besturn'] },
  { slug: 'hongqi', name: 'Hongqi', chineseName: '红旗', pinyin: 'Hongqi', foundedYear: 1958, parentCompany: 'FAW Group', manufacturerType: B, website: 'https://www.hongqi-auto.com/', aliases: ['Red Flag'] },
  { slug: 'nammi', name: 'Nammi', chineseName: '东风纳米', pinyin: 'Dongfeng Nami', foundedYear: 2023, parentCompany: 'Dongfeng Motor', manufacturerType: B, aliases: ['Dongfeng Nammi', 'Dongfeng Nano'] },
  { slug: 'm-hero', name: 'M-Hero', chineseName: '猛士', pinyin: 'Mengshi', foundedYear: 2022, parentCompany: 'Dongfeng Motor', manufacturerType: B, aliases: ['Mengshi'] },
  { slug: 'fengon', name: 'Fengon', chineseName: '东风风光', pinyin: 'Dongfeng Fengguang', parentCompany: 'Seres Group', manufacturerType: E, aliases: ['Dongfeng Fengguang', 'DFSK Glory'] },
  { slug: 'seres', name: 'Seres', chineseName: '赛力斯', pinyin: 'Sailisi', foundedYear: 2016, parentCompany: 'Seres Group', manufacturerType: B, aliases: ['Seres Auto', 'SF Motors'] },
  { slug: 'skyworth', name: 'Skyworth Auto', chineseName: '开沃汽车', pinyin: 'Kaiwo Qiche', foundedYear: 2017, manufacturerType: P, aliases: ['Skywell'] },
  { slug: 'aiways', name: 'Aiways', chineseName: '爱驰', pinyin: 'Aichi', foundedYear: 2017, manufacturerType: P, aliases: ['Aichi'] },
  { slug: 'weltmeister', name: 'Weltmeister', chineseName: '威马汽车', pinyin: 'Weima Qiche', foundedYear: 2015, manufacturerType: H, aliases: ['WM Motor', 'Weima'] },
  { slug: 'byton', name: 'Byton', chineseName: '拜腾', pinyin: 'Baiteng', foundedYear: 2017, manufacturerType: H, aliases: ['Future Mobility'] },
  { slug: 'qoros', name: 'Qoros', chineseName: '观致', pinyin: 'Guanzhi', foundedYear: 2007, manufacturerType: H, aliases: ['Guanzhi'] },
  { slug: 'haima', name: 'Haima', chineseName: '海马汽车', pinyin: 'Haima Qiche', foundedYear: 1988, manufacturerType: S, aliases: ['Haima Automobile'] },
  { slug: 'soueast', name: 'Soueast', chineseName: '东南汽车', pinyin: 'Dongnan Qiche', foundedYear: 1995, parentCompany: 'Chery', manufacturerType: B, aliases: ['Southeast Auto'] },
  { slug: 'foton', name: 'Foton', chineseName: '福田汽车', pinyin: 'Futian Qiche', foundedYear: 1996, parentCompany: 'BAIC Group', manufacturerType: C, website: 'https://www.foton-global.com/', aliases: ['Foton Motor'] },
  { slug: 'king-long', name: 'King Long', chineseName: '金龙客车', pinyin: 'Jinlong Keche', foundedYear: 1988, manufacturerType: C, aliases: ['Xiamen King Long'] },
  { slug: 'higer', name: 'Higer', chineseName: '海格客车', pinyin: 'Haige Keche', foundedYear: 1998, manufacturerType: C, aliases: ['Suzhou Higer'] },
  { slug: 'yutong', name: 'Yutong', chineseName: '宇通客车', pinyin: 'Yutong Keche', foundedYear: 1963, manufacturerType: C, website: 'https://en.yutong.com/', aliases: ['Yutong Bus'] },
  { slug: 'faw-volkswagen', name: 'FAW-Volkswagen', chineseName: '一汽-大众', pinyin: 'Yiqi Dazhong', foundedYear: 1991, parentCompany: 'FAW / Volkswagen Group', manufacturerType: J, aliases: ['FAW Volkswagen'] },
  { slug: 'saic-volkswagen', name: 'SAIC Volkswagen', chineseName: '上汽大众', pinyin: 'Shangqi Dazhong', foundedYear: 1984, parentCompany: 'SAIC / Volkswagen Group', manufacturerType: J, aliases: ['Shanghai Volkswagen'] },
  { slug: 'beijing-benz', name: 'Beijing Benz', chineseName: '北京奔驰', pinyin: 'Beijing Benchi', foundedYear: 2005, parentCompany: 'BAIC / Mercedes-Benz Group', manufacturerType: J, aliases: ['Beijing Mercedes-Benz'] },
  { slug: 'dongfeng-honda', name: 'Dongfeng Honda', chineseName: '东风本田', pinyin: 'Dongfeng Bentian', foundedYear: 2003, parentCompany: 'Dongfeng / Honda', manufacturerType: J, aliases: [] },
  { slug: 'gac-honda', name: 'GAC Honda', chineseName: '广汽本田', pinyin: 'Guangqi Bentian', foundedYear: 1998, parentCompany: 'GAC / Honda', manufacturerType: J, aliases: ['Guangqi Honda'] },
  { slug: 'saic-gm-wuling', name: 'SAIC-GM-Wuling', chineseName: '上汽通用五菱', pinyin: 'Shangqi Tongyong Wuling', foundedYear: 2002, parentCompany: 'SAIC / GM / Wuling', manufacturerType: J, aliases: ['SGMW'] },
];

export const CHINA_MANUFACTURER_ALIAS_TO_SLUG = new Map(
  CHINA_MANUFACTURER_IDENTITIES.flatMap((item) =>
    [item.name, ...item.aliases].map((alias) => [
      alias.trim().toLocaleLowerCase(),
      item.slug,
    ]),
  ),
);
