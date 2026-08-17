# javis

FirstMate 的 Flutter 跨端工作台实现。应用不内置模型：用户配置外部 API，知识、船员定义、任务和产物保持为本地工作区文件，Git 负责版本化。

## 本次重写

根据 `PRD_FirstMate_Mobile.md` 和 `FirstMate_Desktop_Prototype.html` 重新实现界面层，旧 `lib/` 与 `test/` 代码已移除。

- **移动端**：对话优先，抽屉承载完整导航，底部导航提供对话/知识/素材/设置的高频入口。
- **桌面端**：复刻原型的 AppBar + 侧栏 + 主工作区 + 任务检查器三栏结构；1050px 以下隐藏检查器。
- **功能页面**：大副对话、知识工作区、用户素材库、任务看板、Agent 配置、模型连接、Git 变更、设置。
- **安全边界**：模型页只显示钥匙串凭证引用；不在 UI 演示数据或配置样例中保留明文密钥。
- **当前状态**：这是可交互的 UI 骨架，数据仍由 `lib/data/demo_data.dart` 提供；文件读写、Git、Agent Runtime 与真实 API 连接器待接入。

## 运行与验证

```bash
/Users/dechenguo/dev/flutter/bin/flutter pub get
/Users/dechenguo/dev/flutter/bin/flutter run -d chrome
/Users/dechenguo/dev/flutter/bin/flutter analyze
/Users/dechenguo/dev/flutter/bin/flutter test
```

可用 `?view=knowledge` 直接进入指定页面。可选值：`chat`、`knowledge`、`library`、`agents`、`models`、`git`、`settings`。

## 结构

```text
lib/
├── design/tokens.dart          原型 CSS 对应的颜色、间距与断点
├── models/workspace_models.dart
├── data/demo_data.dart         可替换的演示数据源
├── state/workbench_providers.dart
├── widgets/ui.dart             通用卡片、页头、状态标签与按钮
├── shell/workbench_shell.dart  移动/桌面自适应应用壳
└── views/workbench_views.dart  对话、知识、素材、任务、配置、模型、Git、设置
```

设计与架构文档沉淀在 [javis-wiki](https://github.com/gdccwxx/javis-wiki)。
