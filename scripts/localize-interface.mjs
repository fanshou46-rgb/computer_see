// 只替换列出的界面文案，不改部件编号和状态键。
import fs from 'node:fs';
import ts from 'typescript';
const pairs=`About and sources|关于与来源
Airflow|气流
All parts|全部部件
All systems|全部机型
Architecture diagram|架构图解
Auto|自动拆解
Back one level|返回上一层
Back to explorer|返回探索
Browse any system. Your other choice stays in place.|选择任意机型，另一侧保持不变。
Browser hardware acceleration setup|浏览器硬件加速设置
Camera controls|视角控制
Choose a system|选择机型
Choose part|选择部件
Clear filters|清除筛选
Click a part to open it, right-click to inspect it, or press Auto.|左键进入部件，右键查看说明，也可以自动拆解。
Click to inspect|点击查看说明
Close component details|关闭部件详情
Close part picker|关闭部件选择
Close specification comparison|关闭规格对比
Close systems|关闭部件目录
Colors identify routes. Arrows show direction, not speed or watts. Dashed line: power through the board.|颜色区分线路；箭头表示方向，不表示速度或功率。虚线表示经主板供电。
Coming apart|逐步拆解
Compare components|部件对比
Compared part|对比部件
Comparing|正在对比
Comparison pair|对比组合
Component hierarchy|部件层级
Component inventory|零件展开
Created by|原作者
DRAG OR PLAY|拖动进度或播放
Desktop PC|台式机
Details|详情
Diagram|原理图
Different kinds of parts, with each model’s own specifications.|不同类别部件，各自显示自身规格。
Disassemble|拆解
Disassemble both|同时拆解
Disassemble or expand both models|拆解或展开两个模型
Disassemble the specimen|拆解当前部件
Dismiss hint|关闭提示
Dismiss performance tip|关闭性能提示
Each model fits its pane. Diagrams and illustrative parts have no physical scale.|分别适配视口；原理图不表示物理比例。
Each model fits its pane. Sizes are not relative.|分别适配视口，大小不可直接比较。
Enter fullscreen|进入全屏
Enter to inspect|回车查看
Exit fullscreen|退出全屏
Expand|展开
Expand both|同时展开
Exploration scale|探索层级
Explore both|探索两侧
Explore the specimen|探索当前部件
Explosion control|展开控制
FROM THE PSU|从电源出发
Find a component|搜索部件
Fit each|分别适配
Focus|聚焦
Follow the power|追踪供电
From the case down to a compute core.|从机箱一直探索到计算核心。
Fullscreen is blocked by this browser. Press F11 instead.|浏览器阻止全屏，可以使用 F11。
Guide|硬件指南
Hardware|实体硬件
Hidden on this scale|本层已隐藏部件
Hide|隐藏
Hide |隐藏
Hide airflow|隐藏气流
Hide all|全部隐藏
Hide power flow|隐藏供电
Hide the path the air takes|隐藏气流路径
How to enable it|如何开启
Interaction inspiration · Human Atlas|交互参考 · Human Atlas
Interactive 3D computer model|可交互的 3D 电脑模型
Isolate|单独查看
Jump to any hardware or architecture resource.|搜索硬件或架构，进入对应层级。
Laptops|笔记本
Learn about PC components|认识电脑部件
Left-click to open · right-click to inspect|左键进入 · 右键查看说明
Less|收起
Loading both models…|正在加载两个模型…
Loading components for you…|正在准备部件模型…
Loading…|加载中…
Logical architecture|逻辑架构
Manufacturer documents and standards explain this component family. Illustrative geometry is not a product schematic.|制造商资料与标准解释部件原理；示意模型不是产品工程图。
Matching fields are aligned. Not listed means the catalogue has no value for that model.|相同字段对齐；未列出表示目录未记录该项参数。
Matching structures|相同结构
Memory|内存
Model scale|模型比例
No affiliation with NVIDIA, AMD or Intel. No third-party model assets. Research reviewed September 2026.|原项目独立于 NVIDIA、AMD 与 Intel。模型由代码生成，保留原项目资料来源。
No matching components. Try “memory” or “CUDA”.|未找到部件，可以试试“内存”或“CUDA”。
No matching parts|未找到部件
No specifications listed for these models.|目录未列出这些模型的规格。
No specifications listed for this model.|目录未列出此模型的规格。
No structures visible|所有结构已隐藏
Not listed|未列出
PC Anatomy on GitHub|PC Anatomy 的 GitHub 项目
PC Anatomy source code|PC Anatomy 源码
PC components: an illustrated beginner’s guide|电脑部件中文入门指南
Part categories|部件分类
Part of|所属部件
Parts on the tray|托盘中的部件
Pause|暂停
Pause automatic disassembly|暂停自动拆解
Physical hardware|实体硬件
Power|供电
Power destination|供电对象
Power flow|供电流向
Power supply|电源
References & architecture|资料与架构来源
Reload viewer|重新加载模型
Research & credits|资料与致谢
Reset|复位
Reset PC Anatomy|复位探索空间
Reset camera and assembly|复位视角与展开状态
Resources, separated|资源展开
Same physical scale in both panes.|两侧使用相同物理比例。
Search components|搜索部件
Search parts|搜索零件
Search parts, models or architecture…|搜索零件、型号或架构…
Selected|已选中
Shared disassembly control|共用拆解控制
Show|显示
Show |显示
Show airflow|显示气流
Show airflow — it draws on the assembled machine|显示整机气流
Show all|全部显示
Show all systems|显示全部系统
Show context|恢复周围部件
Show power flow|显示供电
Show the path the air takes through the machine|显示气流经过电脑的路径
Silicon|芯片
Smoother 3D exploration|让 3D 探索更流畅
Specification|规格
Specification comparison|规格对比
Specs|规格
Storage|存储
Swap comparison sides|交换对比位置
System|机型
System visibility|部件显隐
Take apart|继续拆解
Take it apart automatically|自动逐步拆解
Tap a part to see what it is and take it apart, or press Auto.|轻点查看说明，再进入内部结构，也可以自动拆解。
The 3D viewer could not load. Reload to try again.|3D 模型未能加载，请刷新重试。
The comparison viewer could not load. Reload to try again.|对比模型未能加载，请刷新重试。
Toggle systems|打开或关闭部件目录
Trace power from the PSU to each component|追踪从电源到各部件的供电
True size|真实比例
Try Tensor, GDDR7, L2 or SM…|试试“内存”“张量核心”“L2”或“SM”…
Try another category, system or search.|请更换分类、机型或搜索词。
Try enabling browser hardware acceleration for smoother rendering.|开启浏览器硬件加速可改善渲染流畅度。
Two kinds of model.|实体结构与原理示意
VISIBLE SYSTEMS|显示的系统
Visible comparison side|当前显示的对比侧
hidden component|个隐藏部件
with|包含
↑ ↓ to browse|↑ ↓ 浏览`;
const dictionary=new Map(pairs.split('\n').map(row=>{const i=row.indexOf('|');return [row.slice(0,i),row.slice(i+1)];}));
for(const file of fs.readdirSync('app').filter(f=>f.endsWith('.tsx')&&!f.startsWith('learning'))){
 const path='app/'+file,source=fs.readFileSync(path,'utf8'),tree=ts.createSourceFile(file,source,99,true,4),edits=[];
 function visit(node){
  if(ts.isStringLiteral(node)){const translated=dictionary.get(node.text);if(translated)edits.push({start:node.getStart(tree),end:node.end,text:JSON.stringify(translated)});}
  else if(ts.isJsxText(node)){const text=node.text.trim().replace(/\s+/g,' '),translated=dictionary.get(text);if(translated)edits.push({start:node.pos,end:node.end,text:node.text.replace(node.text.trim(),translated)});}
  ts.forEachChild(node,visit);
 }
 visit(tree);let output=source;for(const edit of edits.sort((a,b)=>b.start-a.start))output=output.slice(0,edit.start)+edit.text+output.slice(edit.end);
 const localized=ts.createSourceFile(file,output,99,true,4),dynamic=[];
 function localize(node){
   if(ts.isJsxExpression(node)&&node.expression&&!ts.isJsxAttribute(node.parent)){
     const expr=node.expression;
     if((ts.isPropertyAccessExpression(expr)&&['name','title','shortName','label','summary','caption','category'].includes(expr.name.text))||(ts.isIdentifier(expr)&&['label','category'].includes(expr.text)))dynamic.push({start:expr.getStart(localized),end:expr.end,text:'zh('+expr.getText(localized)+')'});
   }
   ts.forEachChild(node,localize);
 }
 localize(localized);for(const edit of dynamic.sort((a,b)=>b.start-a.start))output=output.slice(0,edit.start)+edit.text+output.slice(edit.end);
 if(dynamic.length&&!output.includes("from '@/lib/chinese'"))output="import {zh} from '@/lib/chinese';\n"+output;
 if(output!==source){fs.writeFileSync(path,output);console.log(file+': '+(edits.length+dynamic.length));}
}
