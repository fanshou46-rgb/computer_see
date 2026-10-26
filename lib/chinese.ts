/** 中文术语与教学解读。英文原文保留在原始目录与详情的“英文资料”中。 */
const entries = `
Desktop computer=台式电脑
Desktop PC=台式机
Motherboard=主板
Chassis frame=机箱框架
Side panels=侧板
Side panel=侧板
Front panel=机箱前面板
Front I/O panel=前置接口面板
Front I/O=前置接口
Dust filters=防尘网
Dust filter=防尘网
Top panel=机箱顶板
Power supply shroud=电源仓罩
PSU shroud=电源仓罩
2.5-inch drive tray=2.5 英寸硬盘托架
Board standoffs=主板铜柱
Standoff=固定支柱
Rear I/O aperture=后置接口开口
I/O shield=接口挡板
Graphics card=独立显卡
Power supply unit=电源
Power supply=电源
Power cabling=供电线缆
Processor cooler=CPU 散热器
Liquid cooler=一体式水冷
Case fans=机箱风扇
2.5-inch SATA SSD=2.5 英寸 SATA 固态硬盘
Mainboard substrate=主板 PCB 基板
Processor socket=CPU 插座
Central processing unit=中央处理器
Memory slots=内存插槽
Kingston FURY Beast DDR5 modules=Kingston FURY Beast DDR5 内存
Chipset=芯片组
UEFI firmware flash=UEFI 固件闪存
CMOS battery=CMOS 电池
PCIe ×16 slots=PCIe ×16 插槽
PCIe ×1 slots=PCIe ×1 插槽
M.2 sockets=M.2 插座
NVMe solid-state drive=NVMe 固态硬盘
M.2 thermal covers=M.2 散热盖
Processor voltage regulator=CPU 稳压电路
VRM heatsinks=供电电路散热片
24-pin board power connector=主板 24-pin 供电接口
Processor power connectors=CPU 供电接口
SATA ports=SATA 接口
Rear I/O stack=后置接口组
Network controller=网络控制器
Audio codec=音频编解码器
Sensor and fan controller=传感器与风扇控制器
Fan headers=风扇接口
Front-panel headers=前面板排针
Module circuit board=内存模组 PCB
DDR5 DRAM packages=DDR5 DRAM 封装颗粒
SPD hub=SPD 集线器
Decoupling capacitors=去耦电容
Edge contacts=金手指触点
Thermal pads=导热垫
Heat spreader, front=正面散热马甲
Heat spreader, back=背面散热马甲
Power management IC=电源管理芯片
Regulator inductors=稳压电感
Mold compound=塑封材料
DDR5 SDRAM die=DDR5 SDRAM 裸片
Centre bond pads=中央键合焊盘
Die attach=裸片粘接层
Package substrate=封装基板
Bond wires=键合线
Slot encapsulant=开槽封装填充材料
Solder balls=焊球
Banks=存储体
Bank group I/O=存储体组输入输出
Command and address input=命令与地址输入
Mode registers=模式寄存器
Refresh control=刷新控制
On-die ECC=片内纠错电路
Prefetch and data path=预取与数据通路
Data I/O=数据输入输出
ZQ calibration and termination=ZQ 校准与端接
Mats=存储子阵列
Local sense amplifiers=局部感应放大器
Sub-wordline drivers=子字线驱动器
Global wordlines=全局字线
Global bitlines=全局位线
Global row decoder=全局行译码器
Global sense amplifiers=全局感应放大器
Column decoder=列译码器
Bank control=存储体控制
Storage capacitors=存储电容
Access transistors=访问晶体管
Wordlines=字线
Bitlines=位线
Cell plate=存储电容公共极板
Wordline drivers=字线驱动器
Precharge and equalise=预充电与均衡电路
Sense amplifiers=感应放大器
Column select switches=列选择开关
Local I/O lines=局部输入输出线
Kingston FURY Beast DDR4=Kingston FURY Beast DDR4 内存
DDR4 DRAM packages=DDR4 DRAM 封装颗粒
SPD EEPROM=SPD 参数存储器
Command bus termination=命令总线端接
DDR4 SDRAM die=DDR4 SDRAM 裸片
Delay-locked loop=延迟锁定环
TUF Gaming 850W Gold housing=TUF Gaming 850W Gold 电源外壳
Supply fan=电源风扇
Supply board=电源电路板
Mains inlet and switch=交流输入与开关
Mains filter=交流输入滤波器
Bridge rectifier=桥式整流器
Power factor correction=功率因数校正
Bulk capacitor=大容量储能电容
Primary switching devices=初级开关器件
Main transformer=主变压器
Switching heatsinks=开关器件散热片
Secondary rectification=次级整流电路
Minor rail converters=辅助电压转换器
Output capacitors=输出滤波电容
Supervisor and control=监控与控制电路
Modular output panel=模组线输出面板
Exhaust grille=排风格栅
TUF Gaming 750W Bronze housing=TUF Gaming 750W Bronze 电源外壳
Fixed cable harness=固定线束
Fan frame=风扇框架
Anti-vibration pads=减振垫
Impeller=叶轮
Rotor magnet=转子磁体
Stator and windings=定子与绕组
Bearing and shaft=轴承与转轴
Driver board=驱动电路板
Fan lead=风扇连接线
Coldplate=散热底座
Thermal compound=导热介质
Heat pipes=热管
Fin stack=散热鳍片组
Top cover=顶盖
Cooler fan=散热器风扇
Fan clips=风扇固定夹
Mounting hardware=安装固定件
Radiator=水冷排
Radiator fans=冷排风扇
Pump and water block=水泵与冷头
Pump impeller=水泵叶轮
Coldplate and microfins=冷板与微鳍片
Tubing=水冷管路
Coolant=冷却液
Fittings=管路接头
Core complex die=计算核心裸片
Zen 5 core=Zen 5 核心
Shared L3 cache=共享三级缓存
I/O die=输入输出裸片
DDR5 memory controllers=DDR5 内存控制器
PCI Express root complex=PCIe 根复合体
I/O-die fabric=输入输出裸片互连
Display engine=显示引擎
USB and platform I/O=USB 与平台输入输出
Compute tile=计算模块
Performance core=性能核心
Efficient core=能效核心
Shared cache=共享缓存
SoC tile=SoC 模块
Graphics tile=图形模块
I/O extender tile=输入输出扩展模块
PCI Express interfaces=PCIe 接口
Thunderbolt interfaces=雷电接口
Die-to-die interface=芯粒间接口
Clock and signal conditioning=时钟与信号调理
Foveros base tile=Foveros 基底模块
SSD base tray=SSD 底壳
SSD cover=SSD 外盖
SSD controller board=SSD 控制电路板
Flash controller=闪存控制器
NAND flash packages=NAND 闪存封装
SSD DRAM cache=SSD DRAM 缓存
SATA data connector=SATA 数据接头
SATA power connector=SATA 电源接头
M.2 circuit board=M.2 电路板
NVMe flash controller=NVMe 闪存控制器
3D NAND flash packages=3D NAND 闪存封装
NVMe DRAM cache=NVMe DRAM 缓存
M-key edge contacts=M-key 金手指
M.2 retaining screw=M.2 固定螺丝
Structural frame=结构框架
Axial fans=轴流风扇
Heatsink assembly=散热器总成
Vapor chamber=均热板
Backplate=背板
Printed circuit board=印刷电路板
GB202 GPU package=GB202 GPU 封装
GDDR7 memory=GDDR7 显存
VRM inductors / chokes=供电电感
Capacitors=电容
PCIe edge connector=PCIe 金手指
Power connector=电源接头
GB202 architecture=GB202 架构
Graphics Processing Cluster=图形处理簇 GPC
L2 cache=二级缓存
Memory controllers=内存控制器
Texture Processing Cluster=纹理处理簇 TPC
Raster engine=光栅化引擎
Raster operations=光栅操作单元
PolyMorph engine=几何处理引擎
Streaming Multiprocessor=流式多处理器 SM
CUDA execution resources=CUDA 执行资源
Tensor cores=张量核心
Ray tracing core=光线追踪核心
Texture units=纹理单元
Warp schedulers=线程束调度器
Register files=寄存器文件
L1 cache / shared memory=一级缓存与共享内存
Load / store units=加载与存储单元
Special function units=特殊函数单元
Thermal interface pads=导热界面垫
Heat transport pipes=传热管
Switching power stages=开关功率级
Ceramic decoupling capacitors=陶瓷去耦电容
Surface-mount resistors=贴片电阻
Assembly fasteners=装配固定件
Display mounting bracket=显示接口挡板
Exposed GPU die=GPU 裸片
BGA solder connections=BGA 焊接连接
GPU thermal interface=GPU 导热界面
GPU retention spring=GPU 固定弹片
Mounting standoffs=安装支柱
Multiphase PWM controllers=多相 PWM 控制器
VBIOS flash memory=显卡固件闪存
Current-sense shunts=电流采样分流器
Power monitoring IC=功耗监测芯片
Temperature sensing ICs=温度传感芯片
Reference clock crystal=参考时钟晶振
Fan wiring harnesses=风扇线束
Brushless fan motors=无刷风扇电机
Input protection fuses=输入保护保险丝
ESD protection arrays=静电保护阵列
Auxiliary voltage regulators=辅助稳压器
Board test points=电路板测试点
DisplayPort connectors=DisplayPort 接口
HDMI connector=HDMI 接口
NVENC video encoders=NVENC 视频编码器
NVDEC video decoders=NVDEC 视频解码器
PCIe host interface=PCIe 主机接口
Command front end=命令前端
NITRO+ shroud=NITRO+ 外罩
AeroCurve fans=AeroCurve 风扇
Heatsink fin stack=散热鳍片组
Composite heat pipes=复合热管
GPU and memory baseplate=GPU 与显存散热底座
VRM contact plates=供电接触板
Steel support frame=钢制支撑框架
MagniPlate backplate=MagniPlate 背板
Backplate magnets=背板磁体
ARGB light strip=ARGB 灯带
GPU retention bracket=GPU 固定支架
Navi 48 GPU package=Navi 48 GPU 封装
Exposed Navi 48 die=Navi 48 裸片
GDDR6 memory=GDDR6 显存
VRM chokes=供电电感
Integrated power stages=集成功率级
Multiphase controllers=多相控制器
Polymer capacitors=聚合物电容
12V-2x6 power socket=12V-2x6 供电插座
ARGB header=ARGB 接口
DisplayPort outputs=DisplayPort 输出
HDMI outputs=HDMI 输出
Navi 48 architecture=Navi 48 架构
Shader engine=着色器引擎
Infinity Cache=Infinity Cache 缓存
Command processor=命令处理器
Media engines=媒体引擎
Radiance Display Engine=Radiance 显示引擎
Compression engines=压缩引擎
MP0 microcontroller=MP0 微控制器
Workgroup processor=工作组处理器
Rasterizer=光栅化单元
Primitive unit=图元单元
Render backends=渲染后端
Render assist units=渲染辅助单元
Compute unit=计算单元
Shared memory=共享内存
Scheduler units=调度单元
FMA arithmetic logic unit=融合乘加运算单元
FMA/INT arithmetic logic unit=乘加与整数运算单元
Matrix accelerators=矩阵加速器
Transcendental logic units=超越函数运算单元
Ray accelerator=光线追踪加速器
Ray accelerator L0 cache=光追零级缓存
Vector general-purpose registers=向量通用寄存器
Scalar general-purpose registers=标量通用寄存器
Scalar unit=标量单元
Scalar cache=标量缓存
Shader instruction cache=着色器指令缓存
Texture load/store units=纹理加载存储单元
Limited Edition shroud=Limited Edition 外罩
Fin stacks=鳍片组
Copper cold plate=铜制散热底座
Flow-through backplate=贯通气流背板
Illuminated Arc logo=发光 Arc 标志
BMG-G21 GPU package=BMG-G21 GPU 封装
Exposed BMG-G21 die=BMG-G21 裸片
Multiphase controller=多相控制器
8-pin power connector=8-pin 电源接头
HDMI output=HDMI 输出
Fan header=风扇接口
Fan wiring harness=风扇线束
Temperature sensing IC=温度传感芯片
BMG-G21 architecture=BMG-G21 架构
Render slice=渲染切片
Multi-format transcoders=多格式转码器
GDDR6 memory interface=GDDR6 显存接口
Xe-core=Xe 核心
Pixel backends=像素后端
Texture samplers=纹理采样器
Xe vector engine=Xe 向量引擎
Ray tracing unit=光线追踪单元
L1 cache=一级缓存
Shared local memory=共享局部内存
SIMD16 arithmetic logic units=SIMD16 算术逻辑单元
XMX matrix engine=XMX 矩阵引擎
Hardware threads=硬件线程
General-purpose registers=通用寄存器
Extended math unit=扩展数学单元
Three-way co-issue=三路并行发射
Bottom cover=底盖
Keyboard and palm rest=键盘与掌托
Touchpad=触摸板
Display hinges=屏幕转轴
Legion display=Legion 屏幕
Legion system board=Legion 主板
Legion cooling=Legion 散热组件
Legion battery=Legion 电池
Speaker assemblies=扬声器组件
Enclosure fasteners=外壳固定件
I/O daughterboards and flex links=接口子板与柔性连接
Surface-mount support circuitry=贴片辅助电路
Board mounting screws=主板固定螺丝
SO-DIMM sockets and retention clips=SO-DIMM 插槽与固定弹片
Blower housings and ducts=风扇外壳与风道
Thermal interfaces=导热界面
Thermal-module fasteners=散热组件固定件
Battery carrier and mounting tabs=电池支架与安装耳
Optical diffuser stack=光学扩散层
Display timing and driver board=屏幕时序与驱动电路板
Display mounting hardware=屏幕固定件
System PCB=系统电路板
Voltage regulation=电压调节电路
External I/O=外部接口
Wireless networking=无线网络组件
Legion M.2 SSD=Legion M.2 固态硬盘
Centrifugal blowers=离心风扇
Heat-pipe assembly=热管组件
Exhaust fin stacks=排风鳍片组
Contact plates=导热接触板
Pouch cells=软包电芯
Battery management=电池管理电路
Battery connector=电池接口
Display lid=屏幕外盖
LCD panel=液晶面板
LED backlight=LED 背光
Camera module=摄像头模组
Display cable=屏幕连接线
M.2 substrate=M.2 基板
NAND flash=NAND 闪存
NVMe controller=NVMe 控制器
M.2 connector=M.2 接头
Force Touch trackpad=Force Touch 触摸板
Liquid Retina XDR display=Liquid Retina XDR 显示屏
MacBook logic board=MacBook 逻辑主板
MacBook cooling=MacBook 散热组件
MacBook battery=MacBook 电池
MacBook flash storage=MacBook 闪存存储
Mini-LED backlight=Mini-LED 背光
Logic-board region=逻辑主板区域
Connection to Apple Silicon=Apple 芯片连接
DDR4 SO-DIMM=DDR4 SO-DIMM 内存
Dedicated GDDR6=独立 GDDR6 显存
Zen 3 CPU cores=Zen 3 CPU 核心
Integrated Radeon graphics=集成 Radeon 显卡
Memory and I/O interfaces=内存与输入输出接口
Streaming multiprocessors=流式多处理器
GDDR6 interface=GDDR6 接口
GPU cache=GPU 缓存
Graphics front end=图形前端
M1 Pro CPU=M1 Pro 中央处理器
M1 Pro GPU=M1 Pro 图形处理器
Unified memory=统一内存
Neural Engine=神经网络引擎
Media engine=媒体引擎
I/O and storage=输入输出与存储
Performance cores=性能核心
Efficiency cores=能效核心
Shared memory access=共享内存访问
GPU cores=GPU 核心
Unified-memory access=统一内存访问
Instruction fetch=指令取指
Instruction decode=指令译码
Execution resources=执行资源
Registers=寄存器
Memory access=内存访问
Thread scheduling=线程调度
Parallel arithmetic=并行运算
Working registers=工作寄存器
Texture sampling=纹理采样
SO-DIMM PCB=SO-DIMM 电路板
DDR4 FBGA packages=DDR4 FBGA 封装
SO-DIMM contacts=SO-DIMM 触点
Module identification=模组识别电路
Shared DRAM pool=共享 DRAM 内存池
CPU access=CPU 访问通路
GPU access=GPU 访问通路
Memory interconnect=内存互连
DRAM memory banks=DRAM 存储体
Row decoder=行译码器
Column selection=列选择
Access transistor=访问晶体管
Storage capacitor=存储电容
Wordline=字线
Bitline=位线
Refresh operation=刷新操作
SO-DIMM decoupling components=SO-DIMM 去耦器件
SSD controller cache=SSD 控制器缓存
Tensor Cores=张量核心
FBGA solder joints=FBGA 焊点
Protective mold compound=保护塑封材料
Package interconnect=封装互连
DDR4 DRAM die=DDR4 DRAM 裸片
Cell subarrays=存储单元子阵列
Row decoding=行译码
Global data path=全局数据通路
Chassis=机箱结构
Cooling=散热
Board=电路板
Power=供电
Memory=内存
Storage=存储
Compute=计算
Graphics=图形
Assembly=完整装配
Assembled=完整装配
Dissection=分步拆解
Inventory=零件展开
Bank=存储体
DRAM package=DRAM 封装
DRAM die=DRAM 裸片
CPU cooler=CPU 散热器
Case fan=机箱风扇
Laptops=笔记本
Frame=框架
Fan=风扇
Front=正面
Back=背面
Top=顶部
Perspective=透视
All=全部
On=开启
Off=关闭
`;
const dictionary = new Map(
  entries
    .trim()
    .split('\n')
    .map((row) => {
      const i = row.indexOf('=');
      return [row.slice(0, i), row.slice(i + 1)] as [string, string];
    }),
);
export function zh(text: string): string {
  return dictionary.get(text) ?? text;
}
/** 针对功能类别编写中文解读；原始逐条英文解说另存，便于查阅原文。 */
const roles: [RegExp, string, string][] = [
  [
    /Desktop computer/i,
    '电脑由计算、内存、持久存储、供电、散热与输入输出等部分组成。',
    '运行程序时由多个部件协作，主板提供它们之间的重要连接。',
  ],
  [
    /Motherboard|system board|logic board/i,
    '主板由 PCB、处理器与内存连接、扩展接口、稳压和控制电路等组成。',
    '为部件提供电气连接和支撑，连接信号与供电；具体布局随型号变化。',
  ],
  [
    /Central processing unit|AMD Ryzen|Intel Core|Apple M1 Pro/i,
    '处理器执行程序指令，内部包括计算核心、缓存和相应接口资源。',
    '与内存及其他设备交换数据，完成程序控制和运算；逻辑图不代表实际芯片版图。',
  ],
  [
    /GeForce|Radeon RX|Arc B580|Graphics card/i,
    '独立显卡包含 GPU、显存、供电电路、PCB、显示接口和散热总成。',
    '通过主板扩展连接参与并行计算与图形处理，再从显示接口输出画面。',
  ],
  [
    /solid-state drive|SATA SSD/i,
    '固态硬盘由控制器、NAND 闪存和电路板等组成，断电后仍可保留数据。',
    '保存系统、程序和文件。M.2 NVMe 与 SATA 设备采用不同的连接方式。',
  ],
  [
    /Power supply unit/i,
    '电源把交流输入转换为电脑使用的直流供电，并通过不同接头送到各部件。',
    '为主板、CPU、显卡和存储等供电。装机练习只操作外部连接和固定件。',
  ],
  [
    /cache/i,
    '缓存保存近期或常用的数据、指令，减少访问较远存储层次的等待。',
    '在容量、延迟和共享范围之间取得平衡；缓存不是长期保存文件的硬盘。',
  ],
  [
    /sense amplif/i,
    '感应放大器检测位线上的微小电压变化，将其放大为可用的数字信号。',
    '参与 DRAM 的读出与数据恢复；这里展示的是逻辑关系，不是芯片制造版图。',
  ],
  [
    /row decod/i,
    '行译码电路根据地址选择对应的一行存储单元。',
    '驱动相应字线，让目标存储单元参与读写。',
  ],
  [
    /column|colsel/i,
    '列选择电路在已激活的存储行中选择需要传输的数据列。',
    '把目标数据接到内部或外部的数据通路。',
  ],
  [
    /wordline/i,
    '字线连接一行存储单元的访问晶体管控制端。',
    '被选中时允许这一行的存储电容与位线交换电荷。',
  ],
  [
    /bitline/i,
    '位线连接存储单元与感应放大器，是 DRAM 读写的数据通路。',
    '传递单元电荷产生的微小变化，并用于写入和恢复数据。',
  ],
  [
    /refresh/i,
    'DRAM 存储电容会漏电，因此需要周期性刷新。',
    '在数据衰减前读出并恢复电荷，维持数据内容。',
  ],
  [
    /precharge/i,
    '预充电与均衡电路在新的存储访问前建立位线的初始状态。',
    '为下一次感应放大和数据读写做好准备。',
  ],
  [
    /access transistor/i,
    '访问晶体管由字线控制，决定存储电容是否连接位线。',
    '与存储电容组成典型的 DRAM 1T1C 存储单元。',
  ],
  [
    /storage capacitor|cell plate/i,
    '存储电容通过电荷状态表示数据；公共极板是电容结构的一部分。',
    '与访问晶体管协同保存和读写一位数据，需要定期刷新。',
  ],
  [
    /register/i,
    '寄存器位于处理器内部，保存正在使用的操作数、地址或控制状态。',
    '提供靠近运算单元的快速存取，不等同于主板上的内存条。',
  ],
  [
    /scheduler|scheduling|co-issue/i,
    '调度与发射逻辑选择可执行的工作，并将其送往可用的执行资源。',
    '提高执行资源利用率；图中位置仅用于解释工作关系。',
  ],
  [
    /tensor|matrix|XMX|neural/i,
    '矩阵和神经网络加速资源针对特定的大量重复运算设计。',
    '加速受支持的数据类型与运算，不替代处理器的所有通用工作。',
  ],
  [
    /ray trac|ray acceler/i,
    '光线追踪资源用于加速光线与场景结构的相关计算。',
    '与其他 GPU 单元协作完成渲染，不独自生成整个画面。',
  ],
  [
    /texture|sampler/i,
    '纹理单元按坐标读取、筛选和过滤纹理数据。',
    '为图形着色等工作提供所需的采样结果。',
  ],
  [
    /CUDA|arithmetic|logic unit|vector engine|scalar unit|math unit|transcendental/i,
    '执行单元完成受支持的算术、逻辑或特殊数学运算。',
    '在调度和寄存器等资源的配合下执行程序工作。',
  ],
  [
    /encoder|decoder|transcoder|media engine/i,
    '媒体处理单元对受支持格式的视频进行编码、解码或其他媒体处理。',
    '分担专用媒体工作，具体能力取决于芯片型号与格式。',
  ],
  [
    /instruction fetch/i,
    '取指单元取得接下来需要执行的程序指令。',
    '为后续译码和执行阶段提供输入。',
  ],
  [
    /instruction decode/i,
    '译码单元分析指令，形成处理器内部可以执行的控制与操作。',
    '把指令流衔接到后续执行资源。',
  ],
  [
    /controller|control|supervisor|PWM/i,
    '控制电路根据输入状态管理相关硬件的数据、时序或供电工作。',
    '协调本子系统的工作；具体参数可对照下面的原文规格和来源。',
  ],
  [
    /NAND|flash storage/i,
    'NAND 闪存是断电后仍能保留数据的存储介质。',
    '在控制器管理下保存系统、程序或文件。',
  ],
  [
    /DRAM|GDDR|Unified memory|SO-DIMM|DDR[45]/i,
    '这部分属于运行时内存体系，保存处理器当前需要的数据。',
    '容量、接口与组织方式由具体型号决定；内存与持久存储承担不同职责。',
  ],
  [
    /contact|connector|socket|header|I\/O|interconnect|interface|root complex|data path|wiring|cabl|harness|lead|fabric|access/i,
    '连接结构负责部件之间的电气接触、信号传输或供电。',
    '接口的形状、引脚定义和用途必须匹配；焊接互连不属于可直接拔插的接头。',
  ],
  [
    /heatsink|heat pipe|coldplate|cold plate|vapor|fin stack|radiator|thermal|coolant|tubing|cooling|cooler/i,
    '散热结构把发热器件的热量传到更大的表面或流动介质。',
    '与空气流动或冷却液循环配合，帮助维持合适的工作温度。',
  ],
  [
    /fan|blower|impeller|motor|rotor|stator|bearing/i,
    '风扇或电机总成包含转动与支撑结构，用于建立空气或介质流动。',
    '与散热器、风道及控制电路协作；电机内部仅作结构观察。',
  ],
  [
    /capacitor|decoupl/i,
    '电容用于储存电荷，并在相应电路中参与滤波或稳定电压。',
    '去耦器件帮助局部供电保持稳定；它们通常焊接在电路板上。',
  ],
  [
    /power stage|regulat|inductor|choke|converter/i,
    '稳压和功率转换电路把输入供电调整为器件需要的条件。',
    '在控制、电感、电容等器件配合下供电，不是装机时需要逐个拔下的模块。',
  ],
  [
    /rectif|transformer|mains|switching|bulk capacitor/i,
    '这是电源内部能量转换链路中的一个环节。',
    '用于观察交流输入到直流输出的关系；装机课程只操作电源外部。',
  ],
  [
    /battery|pouch cell/i,
    '电池组件由电芯、保护管理与连接结构等部分组成。',
    '为设备提供电力。内部拆装前隔离电池连接，课程不拆开电芯。',
  ],
  [
    /PCB|circuit board|substrate|board region/i,
    '基板为元件提供机械支撑，并通过导体层连接信号与供电。',
    '连接关系与板上器件共同决定功能；板上焊接小器件只供观察。',
  ],
  [
    /BGA|FBGA|solder|bond|encaps|mold|die attach/i,
    '封装材料和互连结构连接、支撑并保护半导体芯片。',
    '把芯片内部接口连接到外部电路；它们不是用户可直接拔下的装机件。',
  ],
  [
    /frame|cover|panel|bracket|shroud|standoff|fastener|screw|mount|housing|tray|hinge|carrier|grille|filter|pad/i,
    '这是用于支撑、固定、保护或组织结构的机械部件。',
    '安装时需要考虑固定点、遮挡关系和拆卸顺序，不只判断外观是否对齐。',
  ],
  [
    /display|LCD|backlight|diffuser/i,
    '显示系统将图像信号转为可见画面，面板、驱动和背光等各有分工。',
    '显示引擎处理输出；屏幕组件负责呈现，不能与显卡简单等同。',
  ],
  [
    /resistor|shunt|fuse|ESD|crystal|test point|sensing/i,
    '这是板级辅助、检测或保护器件，通常直接焊接在 PCB 上。',
    '与主体电路共同工作；学习其作用时观察，不把它作为普通插接零件拆下。',
  ],
  [
    /GPU|Graphics|shader|Compute|core|processor|architecture|die|cluster|tile|SM|raster|ROP|PolyMorph|primitive|render/i,
    '这里展示处理器或图形系统中执行、组织和协作的资源。',
    '物理封装与逻辑架构分别展示；方块大小和位置不代表真实晶体管布局。',
  ],
];
export function chineseExplanation(
  name: string,
  logical: boolean,
): [string, string] {
  const found = roles.find(([pattern]) => pattern.test(name));
  return found
    ? [found[1], found[2]]
    : [
        `${zh(name)}是本层结构中的一个组成部分。可结合父级、相邻部件与原文规格观察它的连接位置。`,
        logical
          ? '这是原理示意，帮助理解各部分的协作关系。'
          : '将它放回整机中观察，了解它与其他部件的配合；具体结构以引用资料为准。',
      ];
}
export function translatedTerms() {
  return [...dictionary.entries()];
}
