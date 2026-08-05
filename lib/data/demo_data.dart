import '../models/workspace_models.dart';

/// 演示数据。
///
/// 内容逐条对齐 `FirstMate_Desktop_Prototype.html` 中的静态文案，
/// 目的是让 UI 能在没有真实工作区的情况下跑起来、也方便和设计稿逐屏对比。
/// 接入文件解析层后，这一层会被真实的工作区读取逻辑替换。
abstract final class DemoData {
  static const workspaceName = 'firstmate-workspace';

  static const sessionTitle = 'FirstMate 产品方案';
  static const sessionSubtitle = '大副 · 上下文已加载：产品原则、PRD v0.2';

  static const recentSessions = <SessionSummary>[
    SessionSummary(title: 'FirstMate 产品方案', subtitle: '刚刚 · 4 个船员任务'),
    SessionSummary(title: 'Q3 规划讨论', subtitle: '昨天 · 已沉淀 3 条知识'),
    SessionSummary(title: '竞品研究', subtitle: '8 月 3 日 · 已提交'),
  ];

  static const messages = <ChatMessage>[
    ChatMessage(
      id: 'm1',
      author: MessageAuthor.user,
      text: '按照新原则重构桌面端设计：不内置模型，知识和船员都走文件与 Git。',
    ),
    ChatMessage(
      id: 'm2',
      author: MessageAuthor.firstMate,
      text: '我会按工作区协议推进。先由架构船员检查 `agents/`、`models/` 与 '
          '`knowledge/` 的边界，再由设计船员更新桌面端信息架构。',
      taskGroup: TaskGroup(
        title: '本次任务 · 4 个并行步骤',
        note: '任务文件已写入',
        steps: [
          TaskStep(
            label: '架构船员 · 文件协议校验',
            model: 'reasoning-api',
            status: TaskRunStatus.done,
          ),
          TaskStep(
            label: '设计船员 · PC 工作台布局',
            model: 'default-api',
            status: TaskRunStatus.done,
          ),
          TaskStep(
            label: '研究船员 · 参考项目分析',
            model: 'default-api',
            status: TaskRunStatus.running,
          ),
        ],
      ),
    ),
    ChatMessage(
      id: 'm3',
      author: MessageAuthor.firstMate,
      boldLead: '已完成第一轮梳理。',
      text: 'PC 版采用三栏布局：左侧是工作区与导航，中间是对话/编辑主工作区，'
          '右侧始终显示任务、Agent 和 Git 检查器。模型连接独立配置，'
          '密钥仅保存于系统安全存储。',
      citation: 'knowledge/decisions/file-first-architecture.md',
    ),
  ];

  static const knowledgeTree = <TreeNode>[
    TreeNode(name: 'knowledge', isFolder: true),
    TreeNode(name: 'decisions', isFolder: true, depth: 1),
    TreeNode(name: 'file-first-architecture.md', depth: 1),
    TreeNode(name: 'desktop-layout.md', depth: 1),
    TreeNode(name: 'notes', isFolder: true, depth: 1),
    TreeNode(name: 'prd-v0.2.md', depth: 1),
    TreeNode(name: 'agent-workflow.md', depth: 1),
    TreeNode(name: 'todos', isFolder: true, depth: 1),
    TreeNode(name: 'open-questions.md', depth: 1),
  ];

  static const selectedDocName = 'file-first-architecture.md';

  static const knowledgeDoc = KnowledgeDoc(
    path: 'knowledge/decisions/file-first-architecture.md',
    title: '文件优先架构',
    meta: '最后修改：刚刚 · 来源：FirstMate 产品方案会话 · 未提交变更',
    callout: '结论：工作区中的版本化文件是知识、配置与执行产物的唯一真源。'
        '数据库和向量索引只是可重建缓存。',
    principles: [
      '应用不包含模型权重或模型运行时，通过用户配置的 API 调用外部模型。',
      '模型定义位于 models/*.yaml；密钥仅以系统钥匙串引用形式存在。',
      '大副和船员定义位于 agents/*，通过任务与产物文件交接。',
      '会话沉淀、用户素材和执行产物进入 Git 工作区，可查diff、提交和回滚。',
    ],
    relatedFiles: [
      'agents/first-mate.md',
      'models/default.yaml',
      'tasks/task-20260805-001.yaml',
    ],
  );

  static const materialsSubtitle = 'materials/ · 16 个可引用文件';

  static const materials = <MaterialItem>[
    MaterialItem(
      kind: WorkspaceFileKind.pdf,
      size: '2.4 MB',
      title: 'FirstMate 参考研究',
      description: '参考项目的代理团队、任务隔离和知识沉淀方法。已提取文本，可被大副引用。',
      tags: [MaterialTag('已索引'), MaterialTag('研究')],
    ),
    MaterialItem(
      kind: WorkspaceFileKind.markdown,
      size: '18 KB',
      title: 'FirstMate PRD v0.2',
      description: '模型 API 接入、文件协议、Git 工作区与 PC 端信息架构。',
      tags: [MaterialTag('已关联 4 次', highlighted: true)],
    ),
    MaterialItem(
      kind: WorkspaceFileKind.text,
      size: '8 KB',
      title: '桌面端调研笔记',
      description: 'macOS 与 Windows 的窗口、菜单、密钥存储和文件权限差异。',
      tags: [MaterialTag('待摘要')],
    ),
    MaterialItem(
      kind: WorkspaceFileKind.yaml,
      size: '3 KB',
      title: '模型能力矩阵',
      description: '外部模型的工具调用、上下文长度与费用等基础配置数据。',
      tags: [MaterialTag('配置')],
    ),
  ];

  static const agentsSubtitle = 'agents/ · 5 个定义文件，均可直接编辑';

  static const agents = <AgentDefinition>[
    AgentDefinition(
      name: '大副 · First Mate',
      description: '读取任务目标和相关文件，完成拆解、调度、监督与归档。',
      defaultModel: 'default-api',
      writeScope: 'tasks/ · outputs/ · knowledge/',
      enabled: true,
      snippet: 'agents/first-mate.md\n'
          '---\n'
          'model: default-api\n'
          'tools: [read_file, write_file, git]\n'
          '---',
    ),
    AgentDefinition(
      name: '研究船员 · Researcher',
      description: '检索、交叉验证和汇总资料；结果必须写入指定输出目录。',
      defaultModel: 'reasoning-api',
      writeScope: 'outputs/research/**',
      enabled: true,
      snippet: 'agents/researcher.md\n'
          '---\n'
          'model: reasoning-api\n'
          'tools: [web_search, read_file]\n'
          '---',
    ),
    AgentDefinition(
      name: '文件船员 · File Worker',
      description: '处理格式转换、结构化提取和工作区文件维护。',
      defaultModel: 'default-api',
      writeScope: 'outputs/files/**',
      enabled: true,
    ),
    AgentDefinition(
      name: '代码船员 · Developer',
      description: '生成和修改工作区代码；当前未分配到任务。',
      defaultModel: 'coding-api',
      writeScope: 'outputs/code/**',
      enabled: false,
    ),
  ];

  static const modelsSubtitle = 'models/ · 仅存API 配置，不包含任何模型';

  static const modelsNotice = 'API 密钥不会写入 YAML 或 Git。'
      '此页只保存系统钥匙串中的凭证引用。';

  static const models = <ModelConnection>[
    ModelConnection(
      id: 'default-api',
      filePath: 'models/default.yaml',
      protocol: 'OpenAI-compatible',
      capabilities: '聊天 · 工具',
      credential: 'Keychain: DEFAULT',
      connected: true,
    ),
    ModelConnection(
      id: 'reasoning-api',
      filePath: 'models/reasoning.yaml',
      protocol: 'OpenAI-compatible',
      capabilities: '推理 · 长上下文',
      credential: 'Keychain: REASONING',
      connected: true,
    ),
    ModelConnection(
      id: 'coding-api',
      filePath: 'models/coding.yaml',
      protocol: 'OpenAI-compatible',
      capabilities: '代码 · 工具',
      credential: '未配置',
      connected: false,
    ),
  ];

  static const modelYamlSample = 'models/default.yaml\n'
      'id: default-api\n'
      'provider: openai-compatible\n'
      'base_url: https://api.example.com/v1\n'
      'model: example-model\n'
      'credential_ref: FIRSTMATE_DEFAULT_API_KEY';

  static const gitStatus = GitWorkspaceStatus(
    branch: 'main',
    lastCommitAt: '昨天 18:42',
    commitMessage: 'docs: 定义文件优先架构',
    diffs: [
      DiffEntry(
        kind: WorkspaceFileKind.markdown,
        path: 'knowledge/decisions/file-first-architecture.md',
        added: 32,
        removed: 5,
      ),
      DiffEntry(
        kind: WorkspaceFileKind.yaml,
        path: 'models/default.yaml',
        added: 18,
        removed: 2,
      ),
      DiffEntry(
        kind: WorkspaceFileKind.markdown,
        path: 'agents/first-mate.md',
        added: 34,
        removed: 5,
      ),
    ],
  );

  static const taskRuns = <TaskRun>[
    TaskRun(
      id: 'task-20260805-001',
      symbol: 'A',
      title: '架构方案校验',
      status: TaskRunStatus.done,
      model: 'reasoning-api',
      outputPath: 'outputs/architecture.md',
    ),
    TaskRun(
      id: 'task-20260805-002',
      symbol: 'D',
      title: 'PC 端界面设计',
      status: TaskRunStatus.running,
      model: 'default-api',
    ),
  ];

  static const contextFiles = <ContextFileRef>[
    ContextFileRef(WorkspaceFileKind.markdown, '产品原则'),
    ContextFileRef(WorkspaceFileKind.markdown, 'PRD v0.2'),
    ContextFileRef(WorkspaceFileKind.yaml, '模型能力矩阵'),
  ];

  static const inspectorNotice = '知识文件有新摘要，等待你确认后再提交。';
}
