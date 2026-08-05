# javis

FirstMate 桌面工作台的 Flutter 实现。

一个不内置任何模型的跨平台 Agent 工作台：应用只负责对话界面、任务编排、文件读写、Git 版本管理和运行状态展示，模型由用户通过 API 配置接入。

文档在 [gdccwxx/javis-wiki](https://github.com/gdccwxx/javis-wiki)。

## 当前进度

界面层已完成，按 `FirstMate_Desktop_Prototype.html` 做的像素级还原。六个视图全部可用：

| 视图 | 状态 |
|------|------|
| 大副对话 | 消息流、任务卡片、引用来源、可发送消息 |
| 知识工作区 | 文件树（可筛选、可选中）+ 文档正文 |
| 用户素材库 | 卡片网格、可搜索、响应式列数 |
| Agent 配置 | 船员定义卡片、frontmatter 预览 |
| 模型连接 | 表格、钥匙串引用、YAML 示例 |
| Git 变更 | 变更统计、diff 列表、文件勾选、提交框 |

数据来自 `lib/data/demo_data.dart`。文件读写层、Agent Runtime、模型连接器还没实现。

## 跑起来

```bash
flutter pub get
flutter run -d macos     # 或 windows / linux
```

平台目录没入库，第一次跑之前需要生成：

```bash
flutter create --platforms=macos,windows,linux .
```

macOS 需要装Xcode（`flutter build macos` 依赖 `xcodebuild`）。只想看界面的话用 Web 更快：

```bash
flutter create --platforms=web .
flutter run -d chrome
```

### 直接跳到某个页面

支持 URL 参数指定初始状态，评审和走查时把链接直接指到具体页面：

```
?view=knowledge             打开知识工作区
?platform=windows           用 Windows 窗口外观
?view=git&platform=windows  两个一起用
```

`view` 取值：`chat` / `knowledge` / `library` / `agents` / `models` / `git`

## 测试

```bash
flutter test
flutter analyze
```

如果本机开了代理，`flutter test` 会因为 WebSocket 被拦而失败，需要：

```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy
export NO_PROXY="localhost,127.0.0.1,::1" no_proxy="localhost,127.0.0.1,::1"
flutter test
```

## 目录

```
lib/
├── main.dart                 入口
├── design/tokens.dart        色板、字号、圆角、布局常量
├── models/                   数据模型（对应工作区文件形态）
├── data/demo_data.dart       演示数据
├── state/                    Riverpod providers
├── widgets/                  基础组件 + 导航图标 painter
├── shell/                    AppBar / Sidebar / Inspector / Shell
├── views/                    六个主视图
└── pages/prototype_page.dart 演示壳（平台切换 + 圆角窗口）
```

分层职责和实现取舍见 wiki 的 [architecture.md](https://github.com/gdccwxx/javis-wiki/blob/main/architecture.md)。

## 几个约定

**颜色只从 `AppColors` 取。** 视图代码里不写裸色值。设计稿改了就改 `tokens.dart`，视图不动。

**密钥永不落到配置文件。** `models/*.yaml` 只写钥匙串引用。这条有测试锁着。

**派生状态用 `Provider` 算，不在 build 里过滤。** 筛选逻辑能单独测。

**保持 `flutter analyze` 零告警。**

## 接下来

按优先级：

1. 工作区文件读写（替换 `demo_data.dart`，UI 结构不动）
2. Git 封装（status / diff / commit / rollback）
3. 模型连接器（OpenAI-compatible + 连通性测试）
4. Agent Runtime（任务拆解、船员调度、产物归档）
5. 钥匙串读写
6. 设置页

有几个问题得先确认才好动手，列在 wiki 的 [open-questions.md](https://github.com/gdccwxx/javis-wiki/blob/main/open-questions.md)。
