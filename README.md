# 流光 AI 视频工作台

本地运行的画布式 AI 创作工作台。保留已实现的前端、后端、场景角色画布、分镜项目与任务管理代码。

## 包含的功能

- 选择背景与角色，在画布中摆放、缩放、翻转，并保存画布。
- 文生图、图生视频、文生视频、FLUX → H3、多素材参考入口。
- 提示词辅助、生成任务、素材管理、历史与分镜项目。
- 视频后处理、画幅导出与可选本地人物抠图。

## 快速启动（Windows，Python 3.11）

```powershell
py -3.11 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item config.example.json config.local.json
.venv\Scripts\python server.py
```

打开 http://127.0.0.1:8190/ 。安装完成后也可双击 `start.cmd`。
端口可通过 `AGENT_STUDIO_PORT` 环境变量设置。

## 连接生成引擎

界面程序与模型引擎分离。生成视频需要自行安装兼容的 ComfyUI、对应自定义节点及模型，普通 ComfyUI 安装并不保证支持本项目的 H3 工作流。
在 `config.local.json` 中设置 `comfy_root` 为实际 ComfyUI 文件夹，`comfy_http` 为其服务地址；先启动引擎再启动工作台。
本工作台只监听本机回环地址。默认不自动启动或下载任何引擎与权重。

如需自动启动，设置 `auto_start_comfy` 为 true、`comfy_python` 为引擎使用的 Python 路径，按引擎需要填写 `comfy_args`。
可选第二个模型目录通过 `extra_comfy_root` 设置。
人物抠图需要另行配置与 `scene_cutout.py` 校验一致的 `models/u2netp.onnx`；缺少该模型时抠图功能不可用，其余界面可用。

## 数据与发布边界

这是应用程序成品/源码包，不是预装模型的一键生成整合包。
**不包含作者制作的视频、音频、人物图片、个人素材库、项目记录、生成历史、私人截图或模型权重。**
首次启动使用空素材库。默认数据位于用户主目录的 `LiuguangStudioData`，也可用 `data_root` 指定其他目录；不要放入代码仓库。
`config.local.json` 和 `.env` 不提交。发布构建采用明确的文件清单，不递归收集用户数据。

## 检查与打包

```powershell
python tests/smoke.py
python build_release.py
```

打包输出为 `dist/liuguang-agent-studio.zip`。测试不访问真实引擎，也不读取个人素材库；不等同于 GPU 视频生成端到端测试。

## 第三方组件

界面图标使用 Phosphor SVG，保留许可证于 `static/icons/LICENSE`。Python 依赖各自遵守原项目许可证。仓库未对其他代码另行授予开源许可证。
