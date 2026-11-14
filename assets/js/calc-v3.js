/*!
 * 一鸣出海 · V3.0 合规路径引擎（P0）
 * 覆盖：马来西亚 / 印尼 / 菲律宾 / 越南 / 泰国 × 化妆品 / 食品 / 3C 电器
 * 结构：认证项（工期·阶段·官费·检测费·服务费·法规依据）+ 条件规则 + 三档方案
 * 说明：工期按阶段取最大值累加（关键路径），费用为人民币区间，仅作初筛，正式报价以检测与官方受理为准。
 */
(function () {
  'use strict';

  var CTY = { MY: '马来西亚', ID: '印尼', PH: '菲律宾', VN: '越南', TH: '泰国' };
  var CAT = { cos: '化妆品', food: '食品', elec: '3C 电器' };
  var MODE = { ecom: '跨境电商', trade: '一般贸易', local: '本地建厂/设点' };
  var CF = { MY: 2, ID: 4, PH: 3, VN: 3, TH: 2 };
  var SUPPORTED = ['cos', 'food', 'elec'];

  var QS = {
    cos: [
      { id: 'animal', t: '配方是否含动物源成分（胶原蛋白、蜂蜡、明胶、胎盘素等）？', o: [['含', 'y'], ['不含', 'n']] },
      { id: 'claim', t: '是否有防晒 / 美白 / 祛斑 / 抗痘等功效宣称？', o: [['有', 'y'], ['无', 'n']] },
      { id: 'child', t: '是否供儿童或婴幼儿使用？', o: [['是', 'y'], ['否', 'n']] }
    ],
    food: [
      { id: 'animal', t: '是否含动物源成分（肉、水产、明胶、乳制品）？', o: [['含', 'y'], ['不含', 'n']] },
      { id: 'function', t: '是否做保健 / 功能功效宣称？', o: [['有', 'y'], ['无', 'n']] },
      { id: 'cold', t: '是否需冷链，或保质期短于 6 个月？', o: [['是', 'y'], ['否', 'n']] }
    ],
    elec: [
      { id: 'wireless', t: '是否含无线功能（蓝牙 / WiFi / 蜂窝 / RFID）？', o: [['含', 'y'], ['不含', 'n']] },
      { id: 'battery', t: '是否内置或随附锂电池？', o: [['是', 'y'], ['否', 'n']] },
      { id: 'child', t: '是否儿童玩具或母婴用途？', o: [['是', 'y'], ['否', 'n']] }
    ]
  };

  var RULES = {
    MY: {
      ent: { n: '本地主体 / 进口商落地（Sdn.Bhd. 或本地进口商）', d: 14, ph: 1, law: 'SSM 公司登记 · 进口商备案', c: { o: [0, 0], t: [0, 0], s: [2800, 5200] } },
      cats: {
        cos: {
          main: { n: 'NPRA 化妆品备案（Notification）', d: 21, ph: 2, law: 'NPRA 化妆品管制指南', c: { o: [1200, 1800], t: [2400, 4200], s: [6000, 9000] } },
          label: { n: '马来语 / 英语标签审核与重制', d: 5, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1200, 2000] } },
          rules: [
            { w: { animal: 'y' }, a: { n: '清真认证（JAKIM）', d: 45, ph: 3, tag: '强制', law: 'MS 2200 清真化妆品', c: { o: [1500, 2500], t: [2000, 3500], s: [7000, 11000] }, risk: '含动物源成分未取得清真认证，马来清关与电商上架都会被拦' } },
            { w: { claim: 'y' }, a: { n: '功效宣称支持资料与临床评估', d: 20, ph: 3, tag: '强制', law: 'NPRA 功效宣称指引', c: { o: [0, 0], t: [3000, 6000], s: [4000, 7000] }, risk: '功效宣称无依据会被要求整改，广告同步违规' } },
            { w: { child: 'y' }, a: { n: '儿童产品附加安全评估', d: 15, ph: 3, tag: '强制', c: { o: [0, 0], t: [1500, 3000], s: [2500, 4000] }, risk: '儿童类目审评更严，微生物与防腐体系要求提高' } }
          ],
          risk: '禁用成分（氢醌、汞盐）直接退回，务必先审配方再送检'
        },
        food: {
          main: { n: 'MDA 食品注册与进口准证', d: 30, ph: 2, law: 'MDA 食品法规 1985', c: { o: [900, 1500], t: [2200, 3800], s: [5500, 8000] } },
          label: { n: '马来语标签 + 营养标示审核', d: 7, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1200, 2000] } },
          rules: [
            { w: { animal: 'y' }, a: { n: '清真认证（JAKIM）与来源证明', d: 45, ph: 3, tag: '强制', law: 'MS 1500 清真食品', c: { o: [1500, 2500], t: [1800, 3200], s: [6500, 10000] }, risk: '肉源、明胶需来源证明，清真审查最严的一环' } },
            { w: { function: 'y' }, a: { n: '保健食品注册（NPRA）', d: 60, ph: 3, tag: '强制', c: { o: [1500, 2500], t: [3000, 5000], s: [9000, 14000] }, risk: '功能宣称按保健品管理，周期翻倍' } },
            { w: { cold: 'y' }, a: { n: '冷链与保质期验证', d: 10, ph: 2, tag: '强制', c: { o: [0, 0], t: [800, 1500], s: [1500, 2500] }, risk: '冷链产品需提供运输温度验证方案' } }
          ],
          risk: '肉源、明胶等成分需出口国官方证明，缺失会卡在口岸'
        },
        elec: {
          main: { n: 'SIRIM 认证 + COA 证书', d: 30, ph: 2, law: 'ST 电气设备批准指南', c: { o: [1800, 2600], t: [4500, 7000], s: [7000, 10000] } },
          label: { n: 'SIRIM 标签申购与说明书审核', d: 5, ph: 2, c: { o: [300, 600], t: [0, 0], s: [800, 1500] } },
          rules: [
            { w: { wireless: 'y' }, a: { n: 'MCMC 无线型号核准', d: 30, ph: 3, tag: '强制', law: 'MCMC 技术准则', c: { o: [1500, 2400], t: [3500, 5500], s: [5000, 8000] }, risk: '带无线模块未做 MCMC，SIRIM 证书也上不了架' } },
            { w: { battery: 'y' }, a: { n: '锂电池 UN38.3 与运输鉴定', d: 12, ph: 2, tag: '强制', c: { o: [0, 0], t: [2500, 4200], s: [1500, 2600] }, risk: '无 UN38.3 报告无法空运与海运订舱' } },
            { w: { child: 'y' }, a: { n: '玩具安全标准 MS EN71 检测', d: 15, ph: 3, tag: '强制', c: { o: [0, 0], t: [2200, 3800], s: [2500, 4000] }, risk: '儿童玩具另需机械物理与化学迁移测试' } }
          ],
          risk: '无线产品需 SIRIM 与 MCMC 双证，频段与功率先确认再送样'
        }
      }
    },
    ID: {
      ent: { n: '本地持牌主体（PT + API-U 进口商）', d: 15, ph: 1, law: 'OSS-RBA 主体登记', c: { o: [0, 0], t: [0, 0], s: [3500, 6500] } },
      cats: {
        cos: {
          main: { n: 'BPOM 化妆品备案（Notification）', d: 45, ph: 2, law: 'BPOM 化妆品注册法规', c: { o: [1500, 2200], t: [2800, 4500], s: [7000, 11000] } },
          label: { n: '印尼语标签审核与重制', d: 7, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1200, 2200] } },
          rules: [
            { w: { animal: 'y' }, a: { n: 'BPJPH 清真认证', d: 60, ph: 3, tag: '强制', law: 'UU 33/2014 清真产品保障', c: { o: [2000, 3200], t: [2500, 4200], s: [8000, 13000] }, risk: '2026 年起分阶段强制，未取得清真认证无法清关' } },
            { w: { claim: 'y' }, a: { n: '功效 / 临床支持资料', d: 25, ph: 3, tag: '强制', c: { o: [0, 0], t: [3500, 6500], s: [4500, 7500] }, risk: '功效宣称超范围会被要求整改并下架' } },
            { w: { child: 'y' }, a: { n: '儿童化妆品附加安全评估', d: 18, ph: 3, tag: '强制', c: { o: [0, 0], t: [1800, 3200], s: [2800, 4500] }, risk: '儿童类目配方与防腐体系限制更严' } }
          ],
          risk: '成分与标签是两道硬门槛，配方含禁用成分直接退回'
        },
        food: {
          main: { n: 'BPOM ML 食品注册', d: 45, ph: 2, law: 'BPOM 加工食品注册法规', c: { o: [1800, 2800], t: [2800, 4600], s: [8000, 12000] } },
          label: { n: '印尼语标签与 ML 登记号标示', d: 7, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1200, 2200] } },
          rules: [
            { w: { animal: 'y' }, a: { n: 'BPJPH 清真认证（强制）', d: 60, ph: 3, tag: '强制', law: 'BPJPH 清真产品保障', c: { o: [2000, 3200], t: [2500, 4200], s: [8000, 13000] }, risk: '猪肉源成分无法取得清真认证，市场准入受限' } },
            { w: { function: 'y' }, a: { n: '保健食品（SK）注册', d: 90, ph: 3, tag: '强制', c: { o: [2500, 4000], t: [4000, 7000], s: [12000, 18000] }, risk: '保健食品注册周期长，务必先做配方可行性评估' } },
            { w: { cold: 'y' }, a: { n: '冷链与保质期验证', d: 10, ph: 2, tag: '强制', c: { o: [0, 0], t: [800, 1500], s: [1500, 2500] }, risk: '冷链产品需运输温度记录方案' } }
          ],
          risk: '未取得清真认证的进口食品将无法清关，周期要预留足'
        },
        elec: {
          main: { n: 'SNI 强制认证 + 工厂审核', d: 45, ph: 2, law: 'SNI 强制认证目录', c: { o: [2200, 3200], t: [5000, 8000], s: [9000, 13000] } },
          label: { n: '印尼语说明书与 SNI 标志', d: 5, ph: 2, c: { o: [300, 600], t: [0, 0], s: [900, 1600] } },
          rules: [
            { w: { wireless: 'y' }, a: { n: 'SDPPI 无线型号核准', d: 30, ph: 3, tag: '强制', law: 'SDPPI 无线设备规定', c: { o: [1800, 2800], t: [3000, 5000], s: [5500, 8500] }, risk: '无线产品缺 SDPPI 会被口岸扣留' } },
            { w: { battery: 'y' }, a: { n: '锂电池 UN38.3 与运输鉴定', d: 12, ph: 2, tag: '强制', c: { o: [0, 0], t: [2500, 4200], s: [1500, 2600] }, risk: '无 UN38.3 无法订舱' } },
            { w: { child: 'y' }, a: { n: '玩具 SNI 强制认证', d: 25, ph: 3, tag: '强制', c: { o: [1500, 2400], t: [3000, 5000], s: [4500, 7500] }, risk: '玩具属强制 SNI 目录，无证不得销售' } }
          ],
          risk: 'SNI 为强制认证，无证货物会在口岸被扣留'
        }
      }
    },
    PH: {
      ent: { n: '本地进口商 FDA LTO 执照', d: 20, ph: 1, law: 'FDA LTO 制度', c: { o: [1200, 2000], t: [0, 0], s: [5000, 9000] } },
      cats: {
        cos: {
          main: { n: 'FDA 化妆品通报（CPN）', d: 30, ph: 2, law: 'FDA 化妆品通报规则', c: { o: [900, 1500], t: [2200, 3800], s: [5500, 8500] } },
          label: { n: '英文标签合规审核', d: 5, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1000, 1800] } },
          rules: [
            { w: { animal: 'y' }, a: { n: '动物源成分来源证明', d: 10, ph: 3, tag: '强制', c: { o: [0, 0], t: [1200, 2200], s: [1800, 3000] }, risk: '动物源成分需出口国卫生证明，菲律宾无清真强制但进口商会查' } },
            { w: { claim: 'y' }, a: { n: '功效宣称支持资料', d: 20, ph: 3, tag: '强制', c: { o: [0, 0], t: [3000, 5500], s: [4000, 6500] }, risk: '宣称无依据会被 FDA 要求撤回并下架' } },
            { w: { child: 'y' }, a: { n: '儿童产品附加要求', d: 15, ph: 3, tag: '强制', c: { o: [0, 0], t: [1500, 3000], s: [2500, 4000] }, risk: '儿童类目需额外安全评估' } }
          ],
          risk: '必须由持 LTO 的本地进口商申报，无 LTO 无法递交'
        },
        food: {
          main: { n: 'FDA CPR 食品注册', d: 45, ph: 2, law: 'FDA CPR 注册制度', c: { o: [1200, 2000], t: [2500, 4200], s: [6500, 10000] } },
          label: { n: '营养成分标签审核', d: 7, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1000, 1800] } },
          rules: [
            { w: { animal: 'y' }, a: { n: '农业部 BAI 动物源许可', d: 30, ph: 3, tag: '强制', law: 'BAI 动物源产品规定', c: { o: [1200, 2000], t: [1800, 3200], s: [4000, 7000] }, risk: '含动物蛋白需 BAI 相关许可，否则无法清关' } },
            { w: { function: 'y' }, a: { n: '保健食品宣称评估', d: 25, ph: 3, tag: '强制', c: { o: [0, 0], t: [3000, 5500], s: [5000, 8000] }, risk: '功能性宣称需支持文献，审评周期波动大' } },
            { w: { cold: 'y' }, a: { n: '冷链验证', d: 10, ph: 2, tag: '强制', c: { o: [0, 0], t: [800, 1500], s: [1500, 2500] }, risk: '冷链产品需运输温度记录' } }
          ],
          risk: 'CPR 注册以公司为主体，无 LTO 无法递交'
        },
        elec: {
          main: { n: 'BPS PS 许可 / ICC 清关许可', d: 35, ph: 2, law: 'BPS 强制产品清单', c: { o: [1800, 2800], t: [4000, 6500], s: [7000, 10000] } },
          label: { n: '英文说明书与警示标示', d: 5, ph: 2, c: { o: [0, 0], t: [0, 0], s: [900, 1600] } },
          rules: [
            { w: { wireless: 'y' }, a: { n: 'NTC 无线型号核准', d: 25, ph: 3, tag: '强制', law: 'NTC 设备核准规则', c: { o: [1500, 2400], t: [3000, 5000], s: [5000, 8000] }, risk: '无线产品缺 NTC 无法合法销售' } },
            { w: { battery: 'y' }, a: { n: '锂电池 UN38.3 与运输鉴定', d: 12, ph: 2, tag: '强制', c: { o: [0, 0], t: [2500, 4200], s: [1500, 2600] }, risk: '无 UN38.3 无法订舱' } },
            { w: { child: 'y' }, a: { n: '玩具安全检测', d: 15, ph: 3, tag: '强制', c: { o: [0, 0], t: [2000, 3500], s: [2500, 4000] }, risk: '儿童玩具需额外机械与化学测试' } }
          ],
          risk: '未列管产品可走自愿认证，先查 BPS 强制目录'
        }
      }
    },
    VN: {
      ent: { n: '越南持牌申报主体 / 进口商', d: 18, ph: 1, law: '企业登记 + 进口商备案', c: { o: [0, 0], t: [0, 0], s: [3000, 5500] } },
      cats: {
        cos: {
          main: { n: '化妆品信息公报（CPNP 式备案）', d: 30, ph: 2, law: '卫生部化妆品管理通告', c: { o: [1000, 1600], t: [2400, 4000], s: [5500, 8500] } },
          label: { n: '越南语标签审核与重制', d: 7, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1100, 1900] } },
          rules: [
            { w: { animal: 'y' }, a: { n: '动物源成分声明与证明', d: 10, ph: 3, tag: '强制', c: { o: [0, 0], t: [1000, 2000], s: [1500, 2600] }, risk: '动物源成分需来源声明，部分成分需检疫证明' } },
            { w: { claim: 'y' }, a: { n: '功效宣称依据文件', d: 20, ph: 3, tag: '强制', c: { o: [0, 0], t: [3000, 5500], s: [4000, 6500] }, risk: '宣称无依据会被公报驳回' } },
            { w: { child: 'y' }, a: { n: '儿童产品安全评估', d: 15, ph: 3, tag: '强制', c: { o: [0, 0], t: [1500, 3000], s: [2500, 4000] }, risk: '儿童类目配方限制更严格' } }
          ],
          risk: '未完成国家公报即销售属违规，上线前必须拿到公报号'
        },
        food: {
          main: { n: '食品安全自检与标准公布', d: 30, ph: 2, law: '食品安全法（越南）', c: { o: [800, 1400], t: [2200, 3800], s: [5000, 8000] } },
          label: { n: '越南语标签与辅助标签', d: 7, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1100, 1900] } },
          rules: [
            { w: { animal: 'y' }, a: { n: '动物检疫与卫生证书', d: 20, ph: 3, tag: '强制', law: '动物检疫规定', c: { o: [600, 1200], t: [1500, 2800], s: [2500, 4200] }, risk: '含动物源成分需出口国官方检疫证书' } },
            { w: { function: 'y' }, a: { n: '保健食品注册', d: 90, ph: 3, tag: '强制', c: { o: [2000, 3200], t: [4000, 7000], s: [12000, 18000] }, risk: '保健食品注册周期最长的一档，需提前排期' } },
            { w: { cold: 'y' }, a: { n: '冷链与保质期验证', d: 10, ph: 2, tag: '强制', c: { o: [0, 0], t: [800, 1500], s: [1500, 2500] }, risk: '冷链产品需温度记录方案' } }
          ],
          risk: '自检报告须由认可第三方实验室出具，国内报告常不被接受'
        },
        elec: {
          main: { n: 'MIC / QCVN 合规认证', d: 40, ph: 2, law: 'QCVN 技术法规', c: { o: [1800, 2800], t: [4500, 7000], s: [7500, 11000] } },
          label: { n: '越南语说明书与合规标志', d: 5, ph: 2, c: { o: [300, 600], t: [0, 0], s: [900, 1600] } },
          rules: [
            { w: { wireless: 'y' }, a: { n: 'MIC 无线型号核准', d: 30, ph: 3, tag: '强制', law: 'MIC 无线设备规定', c: { o: [1500, 2500], t: [3000, 5000], s: [5000, 8000] }, risk: '带无线功能需同时满足 RF 与 EMC 标准' } },
            { w: { battery: 'y' }, a: { n: '锂电池 UN38.3 与运输鉴定', d: 12, ph: 2, tag: '强制', c: { o: [0, 0], t: [2500, 4200], s: [1500, 2600] }, risk: '无 UN38.3 无法订舱' } },
            { w: { child: 'y' }, a: { n: '玩具 QCVN 3:2019 检测', d: 20, ph: 3, tag: '强制', c: { o: [0, 0], t: [2200, 3800], s: [2800, 4500] }, risk: '儿童玩具属强制技术法规范围' } }
          ],
          risk: 'QCVN 标准更新频繁，送检前先确认现行版本'
        }
      }
    },
    TH: {
      ent: { n: '泰国本地进口商 / 申报主体', d: 15, ph: 1, law: 'DBD 登记 + 进口商备案', c: { o: [0, 0], t: [0, 0], s: [2800, 5200] } },
      cats: {
        cos: {
          main: { n: '泰国 FDA 化妆品通报', d: 25, ph: 2, law: '化妆品法 B.E. 2558', c: { o: [900, 1500], t: [2200, 3800], s: [5000, 8000] } },
          label: { n: '泰语标签审核与重制', d: 7, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1100, 1900] } },
          rules: [
            { w: { animal: 'y' }, a: { n: '动物源成分来源证明', d: 10, ph: 3, tag: '强制', c: { o: [0, 0], t: [1000, 2000], s: [1500, 2600] }, risk: '动物源成分需来源说明，泰国无清真强制但渠道会问' } },
            { w: { claim: 'y' }, a: { n: '功效宣称支持资料', d: 20, ph: 3, tag: '强制', c: { o: [0, 0], t: [3000, 5200], s: [4000, 6500] }, risk: '宣称超范围会被要求整改并撤广告' } },
            { w: { child: 'y' }, a: { n: '儿童产品附加评估', d: 15, ph: 3, tag: '强制', c: { o: [0, 0], t: [1500, 3000], s: [2500, 4000] }, risk: '儿童类目配方限制更严' } }
          ],
          risk: '通报制相对宽松，但含特殊成分仍需逐项评估'
        },
        food: {
          main: { n: '泰国 FDA 食品注册（Or.9 / Or.10）', d: 35, ph: 2, law: '食品法 B.E. 2522', c: { o: [1000, 1700], t: [2400, 4000], s: [6000, 9000] } },
          label: { n: '泰语标签与食品序列号', d: 7, ph: 2, c: { o: [0, 0], t: [0, 0], s: [1100, 1900] } },
          rules: [
            { w: { animal: 'y' }, a: { n: '畜牧厅动物源许可', d: 30, ph: 3, tag: '强制', law: '畜牧厅进口许可', c: { o: [1000, 1800], t: [1800, 3200], s: [4000, 7000] }, risk: '含动物源成分需畜牧厅许可，否则无法清关' } },
            { w: { function: 'y' }, a: { n: '保健食品注册', d: 90, ph: 3, tag: '强制', c: { o: [2200, 3600], t: [4000, 7000], s: [12000, 18000] }, risk: '保健食品注册周期长，宜与配方开发并行' } },
            { w: { cold: 'y' }, a: { n: '冷链与保质期验证', d: 10, ph: 2, tag: '强制', c: { o: [0, 0], t: [800, 1500], s: [1500, 2500] }, risk: '冷链产品需温度记录方案' } }
          ],
          risk: '特定食品需查管制清单，进口配额可能受限'
        },
        elec: {
          main: { n: 'TISI 强制认证 + 工厂审查', d: 45, ph: 2, law: 'TISI 强制标准', c: { o: [2200, 3200], t: [5000, 8000], s: [9000, 13000] } },
          label: { n: 'TISI 标志与泰语说明书', d: 5, ph: 2, c: { o: [300, 600], t: [0, 0], s: [900, 1600] } },
          rules: [
            { w: { wireless: 'y' }, a: { n: 'NBTC 无线型号核准', d: 30, ph: 3, tag: '强制', law: 'NBTC 无线设备规定', c: { o: [1500, 2500], t: [3000, 5000], s: [5000, 8000] }, risk: '无线模块需 NBTC 核准，与 TISI 分开申请' } },
            { w: { battery: 'y' }, a: { n: '锂电池 UN38.3 与运输鉴定', d: 12, ph: 2, tag: '强制', c: { o: [0, 0], t: [2500, 4200], s: [1500, 2600] }, risk: '无 UN38.3 无法订舱' } },
            { w: { child: 'y' }, a: { n: '玩具 TIS 检测', d: 20, ph: 3, tag: '强制', c: { o: [0, 0], t: [2200, 3800], s: [2800, 4500] }, risk: '儿童玩具属 TIS 强制范围' } }
          ],
          risk: 'TISI 需工厂审查，务必提前排现场审核档期'
        }
      }
    }
  };

  var TIERS = {
    min: { k: 'min', name: '极简合规', desc: '只做强制项；标签配套与平台资料自办，最快拿到准入', sm: 0.9, fm: 1 },
    std: { k: 'std', name: '标准通关', desc: '强制 + 平台要求，证书齐全可直接上架', sm: 1, fm: 1 },
    fast: { k: 'fast', name: '加速上市', desc: '关键环节并行 + 加急排期，用预算换时间', sm: 1.4, fm: 0.72 }
  };

  var state = { country: '', product: '', mode: '', ans: {}, tier: 'std', combo: null };

  function money(n) {
    n = Math.round(n);
    if (n >= 10000) {
      var w = n / 10000;
      return (w >= 10 ? Math.round(w) : w.toFixed(1).replace(/\.0$/, '')) + ' 万';
    }
    return n.toLocaleString('zh-CN');
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function build() {
    var cfg = RULES[state.country].cats[state.product];
    var items = [];
    items.push({ n: RULES[state.country].ent.n, d: RULES[state.country].ent.d, ph: 1, tag: '前置', law: RULES[state.country].ent.law, c: RULES[state.country].ent.c, risk: '' });
    items.push(Object.assign({ tag: '强制' }, cfg.main));
    if (cfg.label) items.push(Object.assign({ tag: '配套' }, cfg.label));
    (cfg.rules || []).forEach(function (r) {
      var hit = true;
      for (var k in r.w) { if (state.ans[k] !== r.w[k]) { hit = false; break; } }
      if (hit) items.push(Object.assign({}, r.a));
    });
    if (state.mode === 'ecom') {
      items.push({ n: '平台资质核验（Shopee / TikTok Shop 上传证书）', d: 3, ph: 3, tag: '平台', c: { o: [0, 0], t: [0, 0], s: [0, 0] }, risk: '无证上架会被平台下架并扣分', law: '平台合规要求' });
    }
    if (state.mode === 'local') {
      items.push({ n: '工厂审查 / 本地生产许可', d: 25, ph: 3, tag: '强制', c: { o: [1200, 2200], t: [0, 0], s: [6000, 10000] }, risk: '本地生产需现场审查，排期受官方档期影响', law: '本地生产许可' });
    }
    return items;
  }

  function calc(tierKey) {
    var t = TIERS[tierKey];
    var items = build().filter(function (it) {
      return !(tierKey === 'min' && (it.tag === '平台' || it.tag === '配套'));
    });
    var phase = { 1: 0, 2: 0, 3: 0 }, cost = { o: [0, 0], t: [0, 0], s: [0, 0] }, hard = 0;
    items.forEach(function (it) {
      var d = it.d || 0;
      phase[it.ph || 3] = Math.max(phase[it.ph || 3], d);
      var c = it.c || { o: [0, 0], t: [0, 0], s: [0, 0] };
      cost.o[0] += c.o[0]; cost.o[1] += c.o[1];
      cost.t[0] += c.t[0]; cost.t[1] += c.t[1];
      cost.s[0] += c.s[0]; cost.s[1] += c.s[1];
      if (it.tag === '强制') hard++;
    });
    var days = phase[1] + phase[2] + phase[3];
    days = Math.round(days * t.fm);
    var sv = [Math.round(cost.s[0] * t.sm), Math.round(cost.s[1] * t.sm)];
    var totalMin = cost.o[0] + cost.t[0] + sv[0];
    var totalMax = cost.o[1] + cost.t[1] + sv[1];
    var lv = Math.min(5, Math.max(1, Math.round((items.length + CF[state.country]) / 2.2)));
    var end = new Date(Date.now() + days * 864e5);
    return {
      items: items, days: days, phase: phase, tier: t,
      cost: { official: cost.o, test: cost.t, service: sv, min: totalMin, max: totalMax },
      hard: hard, lv: lv, endMonth: (end.getMonth() + 1) + ' 月'
    };
  }

  function stars(n) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '☆';
    return s;
  }

  function renderQuestions() {
    var qs = QS[state.product];
    return '<div class="v3-block"><div class="v3-block-h"><b>再回答 3 个问题，方案精度提升</b><span class="v3-skip" id="v3skip">跳过直接看方案 →</span></div>'
      + '<div class="v3-qs">' + qs.map(function (q) {
        return '<div class="v3-q"><div class="v3-q-t">' + esc(q.t) + '</div><div class="v3-opts">'
          + q.o.map(function (o) {
            var on = state.ans[q.id] === o[1] ? ' on' : '';
            return '<button type="button" class="v3-opt' + on + '" data-q="' + q.id + '" data-v="' + o[1] + '">' + esc(o[0]) + '</button>';
          }).join('') + '</div></div>';
      }).join('') + '</div></div>';
  }

  function renderSummary(r) {
    return '<div class="v3-sum">'
      + '<div class="v3-sum-i"><span>认证项</span><b>' + r.items.length + ' 项</b></div>'
      + '<div class="v3-sum-i"><span>关键路径</span><b class="hot">' + r.days + ' 天 / 约 ' + Math.round(r.days / 7) + ' 周</b></div>'
      + '<div class="v3-sum-i"><span>费用区间</span><b>¥' + money(r.cost.min) + '–' + money(r.cost.max) + '</b></div>'
      + '<div class="v3-sum-i"><span>合规难度</span><b><i class="v3-star">' + stars(r.lv) + '</i></b></div>'
      + '</div>'
      + '<div class="v3-eta">按今天签约估算，最快 <b>' + r.endMonth + '</b> 可上架；比笼统的「2–5 个月」更能排产。</div>';
  }

  function renderTabs(active) {
    return '<div class="v3-tabs">' + ['min', 'std', 'fast'].map(function (k) {
      var t = TIERS[k], r = calc(k);
      return '<button type="button" class="v3-tab' + (k === active ? ' on' : '') + '" data-tier="' + k + '">'
        + '<span class="v3-tab-n">' + t.name + '</span>'
        + '<span class="v3-tab-m">' + r.days + ' 天 · ¥' + money(r.cost.min) + ' 起</span></button>';
    }).join('') + '</div>';
  }

  function renderDetail(r) {
    var rows = r.items.map(function (it) {
      var c = it.c || { o: [0, 0], t: [0, 0], s: [0, 0] };
      var fee = c.o[0] + c.t[0] + c.s[0];
      var feeTxt = fee > 0 ? '¥' + money(fee) + '–' + money(c.o[1] + c.t[1] + c.s[1]) : '已含 / 无额外费用';
      return '<tr><td><b>' + esc(it.n) + '</b>' + (it.law ? '<em>' + esc(it.law) + '</em>' : '') + '</td>'
        + '<td><span class="v3-tag t-' + (it.tag === '强制' ? 'must' : it.tag === '平台' ? 'plat' : it.tag === '前置' ? 'pre' : 'sup') + '">' + esc(it.tag) + '</span></td>'
        + '<td>' + it.d + ' 天</td><td>' + feeTxt + '</td></tr>';
    }).join('');
    var ph = r.phase, tot = ph[1] + ph[2] + ph[3] || 1;
    var bar = [1, 2, 3].map(function (p) {
      var w = Math.max(8, Math.round(ph[p] / tot * 100));
      var name = { 1: '主体前置', 2: '检测与备案', 3: '官审与收尾' }[p];
      return '<div class="v3-bar" style="flex:' + w + '"><span>' + name + '<b>' + ph[p] + ' 天</b></span></div>';
    }).join('');
    return '<div class="v3-tier-desc">' + esc(r.tier.desc) + '</div>'
      + '<table class="v3-table"><thead><tr><th>认证 / 动作</th><th>属性</th><th>工期</th><th>费用区间</th></tr></thead><tbody>' + rows + '</tbody></table>'
      + '<div class="v3-time"><div class="v3-time-h">阶段排期<b>' + r.days + ' 天</b></div><div class="v3-bars">' + bar + '</div></div>'
      + '<div class="v3-cost"><span>官方费 ¥' + money(r.cost.official[0]) + '–' + money(r.cost.official[1]) + '</span><span>检测费 ¥' + money(r.cost.test[0]) + '–' + money(r.cost.test[1]) + '</span><span>服务费 ¥' + money(r.cost.service[0]) + '–' + money(r.cost.service[1]) + '</span></div>';
  }

  function renderRisks() {
    var cfg = RULES[state.country].cats[state.product];
    var list = [cfg.risk];
    (cfg.rules || []).forEach(function (r) {
      var hit = true;
      for (var k in r.w) { if (state.ans[k] !== r.w[k]) { hit = false; break; } }
      if (hit && r.a.risk) list.push(r.a.risk);
    });
    return '<div class="v3-block v3-riskbox"><div class="v3-block-h"><b>卡点预警</b><span>' + list.length + ' 条</span></div><ul>'
      + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
  }

  function renderBody() {
    var r = calc(state.tier);
    return renderSummary(r)
      + renderQuestions()
      + '<div class="v3-block"><div class="v3-block-h"><b>三档方案对比</b><span>点档位切换</span></div>'
      + renderTabs(state.tier) + renderDetail(r) + '</div>'
      + renderRisks()
      + '<div class="v3-block v3-lead"><div class="v3-block-h"><b>领取完整方案书（PDF）</b><span>含认证清单 · 排期表 · 费用明细</span></div>'
      + '<div class="v3-form"><input id="v3mail" type="email" placeholder="your@email.com" autocomplete="email"><input id="v3tel" type="tel" placeholder="手机 / 微信（选填）"><button type="button" id="v3send">发送方案书</button></div>'
      + '<div class="v3-tip" id="v3tip">提交后销售会在 1 个工作小时内联系你核对细节；也可直接打印本页留存。</div></div>'
      + '<div class="v3-foot"><span>方案编号 ' + state.code + '</span><button type="button" class="v3-print" id="v3print">打印 / 存为 PDF</button></div>'
      + '<div class="v3-disc">本方案为初筛评估：工期按各阶段关键路径估算，费用为人民币区间，最终以检测报告、官方受理与正式报价为准。</div>';
  }

  function mount() {
    var el = document.getElementById('ymv3');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'ymv3';
    el.className = 'ymv3';
    el.innerHTML = '<div class="ymv3-mask" data-close="1"></div><div class="ymv3-panel">'
      + '<div class="ymv3-head"><div><div class="ymv3-kicker">V3.0 合规路径引擎</div><h3 id="v3title"></h3></div>'
      + '<button type="button" class="ymv3-close" id="v3close" aria-label="关闭">×</button></div>'
      + '<div class="ymv3-body" id="v3body"></div></div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var t = e.target;
      var hit = function (sel) { return t.closest ? t.closest(sel) : null; };
      if (t.getAttribute('data-close') || hit('#v3close')) { close(); return; }
      if (hit('#v3skip')) { state.ans = {}; paint(); return; }
      var opt = hit('.v3-opt');
      if (opt) {
        var q = opt.getAttribute('data-q'), v = opt.getAttribute('data-v');
        state.ans[q] = state.ans[q] === v ? undefined : v;
        state.combo = build();
        paint(); return;
      }
      var tab = hit('.v3-tab');
      if (tab) { state.tier = tab.getAttribute('data-tier'); paint(); return; }
      if (hit('#v3print')) { document.body.classList.add('v3-printing'); window.print(); setTimeout(function () { document.body.classList.remove('v3-printing'); }, 800); return; }
      if (hit('#v3send')) { send(); return; }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    return el;
  }

  function paint() {
    var r = calc(state.tier);
    document.getElementById('v3title').innerHTML = esc(CTY[state.country]) + ' · ' + esc(CAT[state.product]) + ' · ' + esc(MODE[state.mode])
      + '<span class="v3-code">' + state.code + '</span>';
    document.getElementById('v3body').innerHTML = renderBody();
    var body = document.querySelector('.ymv3-body');
    if (body) body.scrollTop = 0;
    paintDash(r);
  }

  function paintDash(r) {
    var d = document.getElementById('dashboard-mockup');
    if (!d) return;
    var items = r.items.slice(0, 6);
    d.innerHTML = '<div class="dash-cert-title">合规路径 | <span class="cert-name">' + esc(state.combo[1].n) + '</span></div>'
      + '<div class="dash-line">Status: <span class="text-green">' + r.items.length + ' 项认证 · 关键路径 ' + r.days + ' 天</span></div>'
      + '<div class="dash-progress-item"><div class="progress-bar"><div class="progress-fill" style="width:' + Math.min(96, 40 + r.items.length * 8) + '%"></div></div></div>'
      + '<ul class="dash-process-list">' + items.map(function (it, i) {
        return '<li class="dash-process-item" style="animation-delay:' + (i * 0.1) + 's"><span class="process-num">' + (i + 1) + '</span><span>' + esc(it.n) + '</span></li>';
      }).join('') + '</ul>'
      + '<div class="dash-grid"><div class="grid-box">CODE: V3-' + state.country + '-' + state.product.toUpperCase() + '</div><div class="grid-box">' + r.hard + ' 项强制</div><div class="grid-box text-green">' + r.days + ' 天</div></div>';
  }

  function send() {
    var mail = (document.getElementById('v3mail').value || '').trim();
    var tel = (document.getElementById('v3tel').value || '').trim();
    var tip = document.getElementById('v3tip');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      tip.className = 'v3-tip err'; tip.textContent = '请填写正确的邮箱，方案书将发送至此邮箱。'; return;
    }
    var r = calc(state.tier);
    var payload = {
      '提交类型': '方案书申请',
      '国家': CTY[state.country],
      '类目': CAT[state.product],
      '经营模式': MODE[state.mode],
      '认证组合': r.items.map(function (i) { return i.n; }).join(' + '),
      '方案档位': r.tier.name,
      '关键路径': r.days + ' 天，预计 ' + r.endMonth + ' 可上架',
      '费用区间': '¥' + money(r.cost.min) + '–' + money(r.cost.max),
      '方案编号': state.code,
      '邮箱': mail,
      '手机/微信': tel,
      '来源页面': location.pathname + location.search
    };
    tip.className = 'v3-tip'; tip.textContent = '正在提交…';
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (res) { return res.json(); })
      .then(function (j) {
        if (j && j.ok) { tip.className = 'v3-tip ok'; tip.innerHTML = '已收到，方案编号 <b>' + state.code + '</b>。我们会在 1 个工作小时内把 PDF 方案书发到 ' + esc(mail) + '。'; }
        else { tip.className = 'v3-tip err'; tip.textContent = '提交失败，请稍后重试或直接联系微信 klingsport。'; }
      })
      .catch(function () { tip.className = 'v3-tip err'; tip.textContent = '网络异常，请稍后重试或直接联系微信 klingsport。'; });
  }

  function open(el) {
    el.classList.add('show');
    document.body.style.overflow = 'hidden';
    paint();
  }
  function close() {
    var el = document.getElementById('ymv3');
    if (el) el.classList.remove('show');
    document.body.style.overflow = '';
  }

  window.YMCalcV3 = {
    supported: function (c, p) { return !!RULES[c] && SUPPORTED.indexOf(p) > -1; },
    open: function (country, product, mode) {
      if (!this.supported(country, product)) return false;
      state.country = country; state.product = product; state.mode = mode || 'ecom';
      state.ans = {}; state.tier = 'std';
      var d = new Date(), mm = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
      state.code = 'YM' + d.getFullYear() + mm + dd + '-' + country + product.toUpperCase();
      state.combo = build();
      var el = mount();
      open(el);
      return true;
    },
    close: close
  };
})();
